# Git Report Architect

A professional Cloudflare Workers application built with **Hono** and **Cloudflare Workers AI**. This API generates AI-powered reports based on prompts, utilizing Cloudflare's KV namespace for high-performance caching to reduce AI execution costs.

## Features
- **Hono Web Framework**: Lightweight, blazing fast routing for the Edge.
- **Cloudflare Workers AI**: Built-in, serverless AI execution using `qwen2.5-coder-32b-instruct` (No API keys required!).
- **KV Caching**: Identical prompts are cached in a Cloudflare KV namespace to ensure instant responses and save AI credits.
- **TypeScript**: Strictly typed environment variables and bindings.

---

## 🚀 Setup Instructions

If you are cloning this repository to a new machine, follow these steps to get up and running:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or higher recommended).
- A [Cloudflare](https://dash.cloudflare.com/) account.

### 2. Install Dependencies
Clone the repository and install the required npm packages:
```bash
git clone https://github.com/HadiuzzamanBappy/git-report-architect.git
cd git-report-architect
npm install
```

### 3. Generate TypeScript Types
If this is your first time setting up the project, or if you modify bindings in `wrangler.jsonc`, run this command to generate the `worker-configuration.d.ts` file so TypeScript knows about your KV and AI bindings:
```bash
npm run cf-typegen
```

---

## 💻 Local Development

To run the local development server (which simulates the Cloudflare Edge environment on your computer):
```bash
npm run dev
```
The API will be available at `http://localhost:8787`.

### Testing the API
Send a `POST` request to the `/api/ai/generate` endpoint. Make sure you send a JSON body.

**Using cURL:**
```bash
curl -X POST http://localhost:8787/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a short poem about coding."}'
```
*(If you run the exact same request twice, the second response will say `"source": "cache"`!)*

---

## ☁️ Deployment

When you are ready to push your changes live to the internet, simply run:
```bash
npm run deploy
```
This command bundles your application and deploys it to Cloudflare's global network. Cloudflare will output your live URL (e.g., `https://git-report-architect.<subdomain>.workers.dev`). 

You can test the live URL exactly the same way as local development, just replace `http://localhost:8787` with your deployed URL.

---

## 📁 Project Structure

- `src/index.ts`: The main entry point initializing the Hono app and global error handlers.
- `src/routes/ai.ts`: The Hono router handling the `/api/ai/generate` endpoint and caching logic.
- `src/services/aiService.ts`: The service layer that communicates directly with Cloudflare Workers AI.
- `src/types.ts`: TypeScript interfaces defining the environment (`Env`) bindings.
- `wrangler.jsonc`: The core Cloudflare Workers configuration file where bindings (like KV and AI) are declared.
