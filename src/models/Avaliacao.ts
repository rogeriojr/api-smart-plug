import mongoose, { Document, Schema } from 'mongoose';

export interface IAvaliacao extends Document {
    ofertaId: Schema.Types.ObjectId;
    usuarioId: Schema.Types.ObjectId;
    valor: number;
    status: string;  // Este campo pode ser definido de forma mais específica, dependendo dos valores possíveis.
    data: Date;
}

const avaliacaoSchema: Schema = new Schema({
    ofertaId: { type: Schema.Types.ObjectId, ref: 'Oferta', required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    valor: { type: Number, required: true },
    status: { type: String, required: true },  // Pode-se adicionar enum aqui para os status válidos.
    data: { type: Date, default: Date.now }
});

export default mongoose.model<IAvaliacao>('Avaliacao', avaliacaoSchema);
