import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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
import contactsRoutes from './routes/contacts.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import crmRoutes from './routes/crm.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===== Middleware =====
const allowedOrigins = [
    env.FRONTEND_URL,
    'https://app.liabotedu.com',
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
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
app.use('/api/contacts', contactsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/crm', crmRoutes);

// ===== 404 Handler for API =====
app.use('/api/*path', (_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ===== Serve Frontend (production) =====
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA fallback: any non-API route serves index.html
app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
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
║   LIA Dashboard API + Frontend               ║
║   Running on port ${String(env.PORT).padEnd(28)}║
║   Environment: ${env.NODE_ENV.padEnd(31)}║
╚════════════════════════════════════════════════╝
    `);
});

export default app;
