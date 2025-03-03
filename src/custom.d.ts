// src/custom.d.ts
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        export interface Request {
            user?: string | jwt.JwtPayload;
        }
    }
}