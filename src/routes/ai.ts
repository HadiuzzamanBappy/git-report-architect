import { Hono } from 'hono';
import type { Env } from '../types';
import { generateReport } from '../services/aiService';

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
		const prompt = body.prompt;
		const messages = body.messages;
		const model = body.model || '@cf/qwen/qwen2.5-coder-32b-instruct'; // Default model

		if (!prompt && !messages) {
			return c.json({ error: 'Prompt or messages array is required' }, 400);
		}

		const cacheKeyPayload = messages ? JSON.stringify(messages) : prompt;
		const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cacheKeyPayload));
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		const cacheKey = `report:${model}:${hashHex}`;

		// Check the cache first
		const cachedResult = await c.env.REPORT_CACHE.get(cacheKey);
		if (cachedResult) {
			return c.json({ source: 'cache', data: JSON.parse(cachedResult) });
		}

		// If not in cache, call the AI service
		const aiResult = await generateReport(messages, prompt, model, c.env);

		// Save to KV cache for next time (e.g., cache for 1 hour = 3600 seconds)
		await c.env.REPORT_CACHE.put(cacheKey, JSON.stringify(aiResult), { expirationTtl: 3600 });

		return c.json({ source: 'ai', data: aiResult });
	} catch (error: any) {
		console.error('AI Route Error:', error);
		return c.json({ error: 'Failed to generate report', details: error.message }, 500);
	}
});
