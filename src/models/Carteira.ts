import mongoose, { Document, Schema } from 'mongoose';

export interface ICarteira extends Document {
    usuarioId: Schema.Types.ObjectId;
    valor: number;
}

const carteiraSchema: Schema = new Schema({
    usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    valor: { type: Number, default: 0 }
});

export default mongoose.model<ICarteira>('Carteira', carteiraSchema);
