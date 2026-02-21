import type { Request } from 'express';

/**
 * Safely extract a string param from Express 5 request.
 * Express 5 types params as string | string[], this normalizes to string.
 */
export function param(req: Request, name: string): string {
    const val = req.params[name];
    return Array.isArray(val) ? val[0] : val;
}
