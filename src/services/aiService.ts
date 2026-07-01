import type { Env } from '../types';

export async function generateReport(prompt: string, env: Env) {
	// Use Cloudflare Workers AI to run the model
	const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
		prompt: prompt,
	});

	return response;
}
