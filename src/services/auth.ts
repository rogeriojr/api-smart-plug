import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import Usuario from '../models/Usuario';

export function generateToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET!);
}

export function decodeToken(token: string): any {
    return jwt.decode(token);
}

export function getTokenFromRequest(req: any): string {
    return req.header('Authorization')?.replace('Bearer ', '');
}

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refresh_token } = req.body;
        const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET!);

        const usuario = await Usuario.findOne({
            _id: decoded.sub,
            refreshToken: refresh_token,
            status: 'ativo'
        });

        if (!usuario) {
            return res.status(401).json({ error: 'Refresh token inválido' });
        }

        // Gerar novos tokens com validade estendida
        const newAuthToken = jwt.sign(
            { sub: usuario._id },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        const newRefreshToken = jwt.sign(
            { sub: usuario._id },
            process.env.JWT_SECRET!,
            { expiresIn: '30d' }
        );

        // Atualizar tokens no banco
        usuario.authToken = newAuthToken;
        usuario.refreshToken = newRefreshToken;
        await usuario.save();

        res.json({
            access_token: newAuthToken,
            refresh_token: newRefreshToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            error: 'Sessão expirada',
            message: 'Faça login novamente'
        });
    }
};