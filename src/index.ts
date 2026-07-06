import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { aiRouter } from './routes/ai';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
	origin: [
		'http://localhost:5173',
		'https://git-report-architect.pages.dev'
	]
}));

// Global error handler
app.onError((err, c) => {
	console.error(`Error: ${err.message}`);
	return c.json({ error: 'Internal Server Error' }, 500);
});

// Mount AI routes
app.route('/api/ai', aiRouter);

export default app;
