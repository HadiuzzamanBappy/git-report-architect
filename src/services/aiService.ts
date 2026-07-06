import type { Env } from '../types';

const SYSTEM_PROMPTS: Record<string, string> = {
	commit: "You are an expert developer. Given a git diff, write a clean, concise, and conventional commit message. Do not include extra conversational text, just the commit message itself starting with the conventional type (feat, fix, chore, etc).",
	changelog: "You are an expert technical writer. Given a git log, group the commits into a structured Markdown changelog with sections like '🚀 Features', '🐛 Bug Fixes', and '🧹 Chores'. Use bullet points for each commit. Do not include conversational filler.",
	pr: "You are an expert developer. Given a git diff (and optionally commit messages), write a comprehensive Markdown Pull Request description. Include a high-level summary, explain the 'why' and 'how' of the code changes, and list the key changes.",
	case_study: "You are an expert tech analyst and technical writer. Analyze the provided repository data or notes and write a comprehensive, professional Product Post-Mortem and Case Study. Include well-structured Markdown sections for: Overview, Architecture & Tech Stack, Key Features, Challenges Solved, and Conclusion. Make it engaging, professional, and highly insightful."
};

export async function generateReport(reportType: string, gitData: string, model: string, env: Env, stream: boolean = false) {
	const systemContent = SYSTEM_PROMPTS[reportType] || SYSTEM_PROMPTS['commit'];

	const payloadMessages = [
		{ role: 'system', content: systemContent },
		{ role: 'user', content: gitData }
	];

	// Use Cloudflare Workers AI to run the model
	const response = await env.AI.run(model as any, {
		messages: payloadMessages,
        stream
	});

	return response;
}
