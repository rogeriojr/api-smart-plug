import mongoose, { Document, Schema } from 'mongoose';

export interface ITrava extends Document {
    nome: string;
    nomeMercado: string;
    usuarios: mongoose.Types.ObjectId[];
    qrCode: string;
    codigo: string;
    deviceId: string;
    status: 'ativa' | 'inativa';
    deviceStatus: 'online' | 'offline';
    powerStatus: 'on' | 'off';
    tempoDesligamento?: number;
    criadorId: mongoose.Types.ObjectId;
    isPersonalizada: boolean;
    maioresDe18: boolean;
}

const travaSchema: Schema = new Schema({
    nome: { type: String, required: true },
    nomeMercado: { type: String, required: true },
    usuarios: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
    deviceId: { type: String, required: true, unique: true },
    codigo: { type: String, required: true, unique: true },
    qrCode: { type: String, required: false },
    status: { type: String, default: 'ativa' },
    deviceStatus: { type: String, default: 'online' },
    powerStatus: { type: String, default: 'on' },
    tempoDesligamento: { type: Number, default: 30000 },
    criadorId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    isPersonalizada: { type: Boolean, default: false },
    maioresDe18: { type: Boolean, default: false }
});

export default mongoose.model<ITrava>('Trava', travaSchema);