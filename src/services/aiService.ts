import type { Env } from '../types';

export async function generateReport(messages: any[] | undefined, prompt: string | undefined, model: string, env: Env) {
	// If messages array is provided, use it directly (useful for other apps)
	// Otherwise construct messages from prompt
	const payloadMessages = messages || [
		{ role: 'system', content: 'You are a friendly assistant' },
		{ role: 'user', content: prompt }
	];

	// Use Cloudflare Workers AI to run the model
	const response = await env.AI.run(model as any, {
		messages: payloadMessages
	});

	return response;
}
