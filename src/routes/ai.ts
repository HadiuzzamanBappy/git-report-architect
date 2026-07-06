import { Hono } from 'hono';
import type { Env } from '../types';
import { generateReport } from '../services/aiService';
import { fetchGithubData } from '../services/githubService';

export const aiRouter = new Hono<{ Bindings: Env }>();

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
				finalGitData = await fetchGithubData(gitData.trim(), c.env.GITHUB_TOKEN);
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
		const aiResult = await generateReport(reportType, finalGitData, model, c.env, true);
		const reportId = crypto.randomUUID();

		if (aiResult instanceof ReadableStream) {
			const [clientStream, workerStream] = aiResult.tee();
			
			c.executionCtx.waitUntil((async () => {
				try {
					const reader = workerStream.getReader();
					const decoder = new TextDecoder();
					let fullText = "";
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						const chunk = decoder.decode(value, { stream: true });
						const lines = chunk.split('\n');
						for (const line of lines) {
							if (line.startsWith('data: ') && line !== 'data: [DONE]') {
								try {
									const data = JSON.parse(line.substring(6));
									fullText += data.response || '';
								} catch (e) {}
							}
						}
					}
					await c.env.REPORT_CACHE.put(cacheKey, JSON.stringify({ source: 'cache', data: fullText, id: reportId }), { expirationTtl: 3600 });
					await c.env.REPORT_CACHE.put(`saved:${reportId}`, JSON.stringify(fullText));
				} catch (e) {
					console.error('Error in stream processing:', e);
				}
			})());

			return new Response(clientStream, {
				headers: {
					'Content-Type': 'text/event-stream',
					'X-Report-Id': reportId
				}
			});
		}

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
