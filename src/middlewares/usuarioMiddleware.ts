import bcrypt from 'bcryptjs';
import { IUsuario } from '../models/Usuario';

export const hashPassword = async function (this: IUsuario, next: (err?: Error) => void) {
    if (!this.isModified('senha')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.senha, salt);
        this.senha = hashedPassword;
        next();
    } catch (error) {
        // Certifique-se de que o erro seja uma instância de Error
        next(error instanceof Error ? error : new Error('Erro ao gerar o hash da senha'));
    }
};
