import mongoose, { Document, Schema } from 'mongoose';

export interface IPagamento extends Document {
    projetoId: string;
    valor: number;
    data: Date;
}

const projetoSchema: Schema = new Schema({
    projetoId: { type: String, required: true },
    valor: { type: Number, required: true },
    data: { type: Date, default: Date.now }
});

export default mongoose.model<IPagamento>('Pagamento', projetoSchema);