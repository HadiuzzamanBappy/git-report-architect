import { Hono } from 'hono';
import { aiRouter } from './routes/ai';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// Global error handler
app.onError((err, c) => {
	console.error(`Error: ${err.message}`);
	return c.json({ error: 'Internal Server Error' }, 500);
});

// Basic health check route
app.get('/', (c) => {
	return c.text('Hello Cloudflare Workers AI + Hono!');
});

// Mount AI routes
app.route('/api/ai', aiRouter);

export default app;
