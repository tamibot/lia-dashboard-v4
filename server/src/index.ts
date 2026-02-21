import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import programsRoutes from './routes/programs.routes.js';
import webinarsRoutes from './routes/webinars.routes.js';
import profileRoutes from './routes/profile.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import agentsRoutes from './routes/agents.routes.js';
import aiRoutes from './routes/ai.routes.js';
import publicRoutes from './routes/public.routes.js';

const app = express();

// ===== Middleware =====
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== Health Check =====
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
    });
});

// ===== Public API Routes (no auth, for n8n agents & external integrations) =====
app.use('/api/public', publicRoutes);

// ===== Authenticated API Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/webinars', webinarsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/ai', aiRoutes);

// ===== 404 Handler =====
app.use('/api/*path', (_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ===== Error Handler =====
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
});

// ===== Start Server =====
app.listen(env.PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   🚀 LIA Dashboard API                        ║
║   Running on port ${String(env.PORT).padEnd(28)}║
║   Environment: ${env.NODE_ENV.padEnd(31)}║
║   Frontend:    ${env.FRONTEND_URL.padEnd(31)}║
╚════════════════════════════════════════════════╝
    `);
});

export default app;
