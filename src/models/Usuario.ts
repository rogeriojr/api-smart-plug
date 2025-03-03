import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { hashPassword } from '../middlewares/usuarioMiddleware';

export interface IUsuario extends Document {
    nome: string;
    cpf: string;
    urlFoto: string;
    email: string;
    telefone: string;
    senha: string;
    dataDeNascimento: Date;
    tipo: 'comum' | 'adm' | 'dev' | 'mercado';
    status: 'ativo' | 'inativo';
    authToken: string;
    refreshToken: string;
    codigoRecuperacao: string;
    codigoAtivacao: string;
    imgUsuario?: string;
    desabilitarUsuario: boolean;
    travaId?: mongoose.Types.ObjectId[];
    compararSenha(senhaDigitada: string): Promise<boolean>;
}

const usuarioSchema: Schema = new Schema({
    nome: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    urlFoto: { type: String, required: false, default: null },
    email: { type: String, required: true, unique: true },
    telefone: { type: String, required: false, default: null },
    dataDeNascimento: { type: Date, required: true },
    tipo: { type: String, enum: ['comum', 'adm', 'dev', 'mercado'], default: 'comum' },
    status: { type: String, enum: ['ativo', 'inativo'], default: 'inativo' },
    codigoRecuperacao: { type: String, required: false, default: null },
    codigoAtivacao: { type: String, required: false, default: null },
    authToken: { type: String, required: false, default: null },
    refreshToken: { type: String, required: false, default: null },
    imgUsuario: { type: String, required: false, default: null },
    desabilitarUsuario: { type: Boolean, required: true, default: false },
    travaId: [{ type: Schema.Types.ObjectId, ref: 'Trava' }]
});

usuarioSchema.pre<IUsuario>('save', hashPassword);

usuarioSchema.methods.compararSenha = async function (senhaDigitada: string): Promise<boolean> {
    return await bcrypt.compare(senhaDigitada, this.senha);
};

export default mongoose.model<IUsuario>('Usuario', usuarioSchema);