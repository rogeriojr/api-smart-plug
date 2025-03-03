import { Router } from 'express';
import { limiteAvaliacaoMiddleware } from '../middlewares/limiteAvaliacaoMiddleware';
import Avaliacao, { IAvaliacao } from '../models/Avaliacao';
import Carteira from '../models/Carteira';
import Oferta from '../models/Oferta';
import Usuario from '../models/Usuario';

const router = Router();

// POST: Cria uma nova avaliação e atualiza a carteira do usuário
router.post('/avaliacoes', limiteAvaliacaoMiddleware, async (req, res) => {
    const session = await Avaliacao.startSession();
    session.startTransaction();
    try {
        const avaliacao: IAvaliacao = new Avaliacao(req.body);
        await avaliacao.save({ session });

        // verificar se oferta já foi avaliada pelo usuário
        const avaliacaoRealizada = await Avaliacao.findOne({ ofertaId: avaliacao.ofertaId, usuarioId: avaliacao.usuarioId})

        if(avaliacaoRealizada) {
            throw new Error('Oferta avaliada anteriormente pelo usuário');
        }

        const oferta = await Oferta.findById(avaliacao.ofertaId).session(session);

        const valorAReceber = req.body.usuario.tipo === 'premium' ? 200 : 100

        if (!oferta) {
            throw new Error('Oferta não encontrada');
        }

        const carteira = await Carteira.findOne({ usuarioId: avaliacao.usuarioId }).session(session);
        if (carteira) {
            // carteira.valor += oferta.valor;
            carteira.valor += valorAReceber;
            await carteira.save({ session });
        } else {
            const novaCarteira = new Carteira({
                usuarioId: avaliacao.usuarioId,
                // valor: oferta.valor
                valor: valorAReceber
            });
            await novaCarteira.save({ session });
        }

        await session.commitTransaction();
        res.status(201).send(avaliacao);
    } catch (error: any) {
        await session.abortTransaction();
        res.status(500).send(error.message);
    } finally {
        session.endSession();
    }
});

// GET: Lista todas as avaliações
router.get('/avaliacoes', async (req, res) => {
    try {
        const avaliacoes = await Avaliacao.find().populate('ofertaId usuarioId');
        res.status(200).send(avaliacoes);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém uma avaliação por ID
router.get('/avaliacoes/:id', async (req, res) => {
    try {
        const avaliacao = await Avaliacao.findById(req.params.id).populate('ofertaId usuarioId');
        if (!avaliacao) {
            return res.status(404).send('Avaliação não encontrada');
        }
        res.status(200).send(avaliacao);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza uma avaliação
router.put('/avaliacoes/:id', async (req, res) => {
    try {
        const avaliacao = await Avaliacao.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!avaliacao) {
            return res.status(404).send('Avaliação não encontrada');
        }
        res.status(200).send(avaliacao);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// DELETE: Deleta uma avaliação por ID
router.delete('/avaliacoes/:id', async (req, res) => {
    try {
        const avaliacao = await Avaliacao.findByIdAndDelete(req.params.id);
        if (!avaliacao) {
            return res.status(404).send('Avaliação não encontrada');
        }
        res.status(200).send({ message: 'Avaliação deletada com sucesso' });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

export default router;
