import type { Env } from '../types';

export async function generateReport(prompt: string, env: Env) {
	// Use Cloudflare Workers AI to run the model
	const response = await env.AI.run('@cf/qwen/qwen2.5-coder-32b-instruct', {
		prompt: prompt,
	});

	return response;
}
