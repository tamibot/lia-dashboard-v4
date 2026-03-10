import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../utils/jwt.js';
import { env } from '../config/env.js';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// Demo user for development only
const DEMO_USER: JwtPayload = {
    userId: '47a09593-6f23-497e-8138-e1e708c3ae3d',
    orgId: 'a6b7b632-237c-42d0-88b1-94a97f175ede',
    role: 'admin',
    email: 'admin@innovation-institute.edu'
};

/**
 * JWT Authentication middleware.
 * In development: falls back to demo user if no valid token.
 * In production: requires a valid JWT token.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const isDev = env.NODE_ENV === 'development';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (isDev) {
            req.user = DEMO_USER;
            next();
            return;
        }
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    } catch (err) {
        if (isDev) {
            req.user = DEMO_USER;
            next();
            return;
        }
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Role-based authorization middleware.
 * Must be called after authenticate().
 */
export function authorize(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
}
