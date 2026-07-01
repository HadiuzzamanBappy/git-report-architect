import type { Env } from '../types';

export async function generateReport(prompt: string, model: string, env: Env) {
	// Use Cloudflare Workers AI to run the model
	const response = await env.AI.run(model as any, {
		prompt: prompt,
	});

	return response;
}
