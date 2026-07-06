import { Hono } from 'hono';
import type { Env } from '../types';
import { generateReport } from '../services/aiService';
import { fetchGithubData } from '../services/githubService';

export const aiRouter = new Hono<{ Bindings: Env }>();

aiRouter.use('/generate', async (c, next) => {
	const token = c.env.API_TOKEN;
	if (token) {
		const authHeader = c.req.header('Authorization');
		if (!authHeader || authHeader !== `Bearer ${token}`) {
			return c.json({ error: 'Unauthorized' }, 401);
		}
	}
	await next();
});

aiRouter.post('/generate', async (c) => {
	try {
		const body = await c.req.json();
		const reportType = body.reportType || 'commit';
		const gitData = body.gitData;
		const model = body.model || '@cf/moonshotai/kimi-k2.6'; // Default model

		if (!gitData) {
			return c.json({ error: 'gitData is required' }, 400);
		}

		let finalGitData = gitData;
		if (gitData.trim().startsWith('http://github.com') || gitData.trim().startsWith('https://github.com')) {
			try {
				finalGitData = await fetchGithubData(gitData.trim());
			} catch (e: any) {
				return c.json({ error: 'Failed to fetch GitHub repository', details: e.message }, 400);
			}
		}

		const cacheKeyPayload = `${reportType}:${finalGitData}`;
		const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cacheKeyPayload));
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		const cacheKey = `report:${model}:${hashHex}`;

		// Check the cache first
		const cachedResult = await c.env.REPORT_CACHE.get(cacheKey);
		if (cachedResult) {
			return c.json(JSON.parse(cachedResult)); // Returns { source: 'cache', data: ..., id: ... }
		}

		// If not in cache, call the AI service
		const aiResult = await generateReport(reportType, finalGitData, model, c.env);
		const reportId = crypto.randomUUID();

		const responsePayload = { source: 'ai', data: aiResult, id: reportId };

		// Save to KV cache for next time (1 hour cache)
		await c.env.REPORT_CACHE.put(cacheKey, JSON.stringify({ ...responsePayload, source: 'cache' }), { expirationTtl: 3600 });
		
		// Save permanently for shareable links
		await c.env.REPORT_CACHE.put(`saved:${reportId}`, JSON.stringify(aiResult));

		return c.json(responsePayload);
	} catch (error: any) {
		console.error('AI Route Error:', error);
		return c.json({ error: 'Failed to generate report', details: error.message }, 500);
	}
});

aiRouter.get('/case-study/:id', async (c) => {
	try {
		const id = c.req.param('id');
		const savedData = await c.env.REPORT_CACHE.get(`saved:${id}`);
		if (!savedData) {
			return c.json({ error: 'Case study not found' }, 404);
		}
		return c.json({ data: JSON.parse(savedData) });
	} catch (error: any) {
		return c.json({ error: 'Failed to fetch case study', details: error.message }, 500);
	}
});
