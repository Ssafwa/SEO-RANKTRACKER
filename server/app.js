import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rankRoutes from './routes/rankRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import { runDailyRankChecks } from './controllers/rankController.js';
import auth from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer() {
    const app = express();
    const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        ...(process.env.FRONTEND_URL || '').split(','),
    ]
        .map((origin) => origin.trim())
        .filter(Boolean);

    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Origin is not allowed by CORS'));
        },
        credentials: true,
    }));
    app.use(express.json({ limit: '1mb' }));

    app.get('/api/health', (_req, res) => {
        res.json({ success: true, status: 'ok' });
    });
    app.get('/api/cron/rank-checks', runDailyRankChecks);
    app.use('/api/auth', authRoutes);
    app.use('/api/analysis', auth, analysisRoutes);
    app.use('/api/rank', auth, rankRoutes);

    if (process.env.NODE_ENV === 'production') {
        const clientPath = path.resolve(__dirname, '../client/dist');
        app.use(express.static(clientPath));
        app.get('/{*splat}', (_req, res) => {
            res.sendFile(path.join(clientPath, 'index.html'));
        });
    }

    app.use((error, _req, res, _next) => {
        if (error instanceof SyntaxError && 'body' in error) {
            return res.status(400).json({ success: false, message: 'Invalid JSON request body' });
        }
        if (error.message === 'Origin is not allowed by CORS') {
            return res.status(403).json({ success: false, message: error.message });
        }
        console.error('API error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    });

    return app;
}
