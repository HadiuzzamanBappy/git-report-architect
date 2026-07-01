import { Hono } from 'hono';
import type { Env } from '../types';
import { generateReport } from '../services/aiService';

export const aiRouter = new Hono<{ Bindings: Env }>();

aiRouter.post('/generate', async (c) => {
	try {
		const body = await c.req.json();
		const prompt = body.prompt;

		if (!prompt) {
			return c.json({ error: 'Prompt is required' }, 400);
		}

		const cacheKey = `report:${prompt}`;

		// Check the cache first
		const cachedResult = await c.env.REPORT_CACHE.get(cacheKey);
		if (cachedResult) {
			return c.json({ source: 'cache', data: JSON.parse(cachedResult) });
		}

		// If not in cache, call the AI service
		const aiResult = await generateReport(prompt, c.env);

		// Save to KV cache for next time (e.g., cache for 1 hour = 3600 seconds)
		await c.env.REPORT_CACHE.put(cacheKey, JSON.stringify(aiResult), { expirationTtl: 3600 });

		return c.json({ source: 'ai', data: aiResult });
	} catch (error: any) {
		console.error('AI Route Error:', error);
		return c.json({ error: 'Failed to generate report', details: error.message }, 500);
	}
});
