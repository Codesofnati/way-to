import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/*', cors());

app.get('/api/health', (c) => c.json({ status: 'ok', project: 'Wayto API' }));

// Ensure this line is present at the bottom!
export default app;