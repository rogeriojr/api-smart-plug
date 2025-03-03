import mongoose, { Document, Schema } from 'mongoose';

export interface IOferta extends Document {
    titulo: string;
    valor: number;
    urlFoto: string;
    urlFotoLoja: string;
    status: string;  // Este campo pode ser definido de forma mais específica, dependendo dos valores possíveis.
}

const ofertaSchema: Schema = new Schema({
    titulo: { type: String, required: true },
    valor: { type: Number, required: true },
    urlFoto: { type: String, required: true },
    urlFotoLoja: { type: String, required: true },
    status: { type: String, required: true }  // Pode-se adicionar enum aqui para os status válidos.
});

export default mongoose.model<IOferta>('Oferta', ofertaSchema);
