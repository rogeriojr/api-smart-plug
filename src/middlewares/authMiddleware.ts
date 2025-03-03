import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Usuario, { IUsuario } from '../models/Usuario';

interface AuthenticatedRequest extends Request {
    user?: any;
}
const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: 'Acesso não autorizado',
                message: 'Token de acesso necessário'
            });
        }

        // Verificação do token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { _id: string };

        // Busca completa do usuário com verificação de token
        const usuario = await Usuario.findOne({
            _id: decoded._id,
            authToken: token,
            status: 'ativo'
        }).select('-senha -__v');

        if (!usuario) {
            return res.status(401).json({
                error: 'Acesso revogado',
                message: 'Token inválido ou usuário desativado'
            });
        }

        // Adiciona usuário à requisição
        req.user = usuario;
        next();

    } catch (error) {
        console.error('[AUTH MIDDLEWARE]', error);

        const statusCode = error.name === 'TokenExpiredError' ? 401 : 500;
        const errorMessage = error.name === 'TokenExpiredError'
            ? 'Sessão expirada'
            : 'Erro de autenticação';

        res.status(statusCode).json({
            error: errorMessage,
            message: 'Reautenticação necessária'
        });
    }
};

export default authMiddleware;