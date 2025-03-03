import mongoose, { Document, Schema } from 'mongoose';

export interface ILimiteAvaliacao extends Document {
    usuarioId: Schema.Types.ObjectId;
    data: Date;
    contagem: number;
}

const limiteAvaliacaoSchema: Schema = new Schema({
    usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    data: { type: Date, default: Date.now },
    contagem: { type: Number, default: 0 }
});

export default mongoose.model<ILimiteAvaliacao>('LimiteAvaliacao', limiteAvaliacaoSchema);
