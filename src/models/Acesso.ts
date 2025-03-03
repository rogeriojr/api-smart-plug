import mongoose, { Document, Schema } from 'mongoose';

export interface IAcesso extends Document {
    usuarioId: string;
    travaId: string;
    data: Date;
    lat: string;
    long: string;
    imgUsuario?: string;
}

const acessoSchema: Schema = new Schema({
    usuarioId: { type: String, required: true, ref: 'Usuario' },
    travaId: { type: String, required: true, ref: 'Trava' },
    data: { type: Date },
    lat: { type: String, required: false },
    long: { type: String, required: false },
    imgUsuario: { type: String, required: false }
});

export default mongoose.model<IAcesso>('Acesso', acessoSchema);
