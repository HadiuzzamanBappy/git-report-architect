import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { aiRouter } from './routes/ai';
import type { Env } from './types';

import { uiRouter } from './routes/ui';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Global error handler
app.onError((err, c) => {
	console.error(`Error: ${err.message}`);
	return c.json({ error: 'Internal Server Error' }, 500);
});

// Mount UI route on root
app.route('/', uiRouter);

// Mount AI routes
app.route('/api/ai', aiRouter);

export default app;
