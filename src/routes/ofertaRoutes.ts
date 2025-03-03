import { Router } from 'express';
import Avaliacao, { IAvaliacao } from '../models/Avaliacao';
import Oferta, { IOferta } from '../models/Oferta';

const router = Router();

// POST: Cria uma nova oferta
router.post('/ofertas', async (req, res) => {
    try {
        const oferta: IOferta = new Oferta(req.body);
        await oferta.save();
        res.status(201).send(oferta);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Lista todas as ofertas
router.get('/ofertas', async (req, res) => {
    try {
        const ofertas = await Oferta.find();
        res.status(200).send(ofertas);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém uma oferta por ID
router.get('/ofertas/:id', async (req, res) => {
    try {
        const oferta = await Oferta.findById(req.params.id);
        if (!oferta) {
            return res.status(404).send('Oferta não encontrada');
        }
        res.status(200).send(oferta);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém as ofertas por ID
router.get('/ofertas/user/:id', async (req, res) => {
    try {
        const avaliacoes = await Avaliacao.find({ usuarioId: req.params.id });
        var ofertaIds = avaliacoes.map( (avaliacao: IAvaliacao) => avaliacao.ofertaId )
        const ofertas = await Oferta.find({ _id: { $nin: ofertaIds } });

        if (!ofertas) {
            // Ofertas não encontradas
            return res.status(200).send([]);
        }
        res.status(200).send(ofertas);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza uma oferta
router.put('/ofertas/:id', async (req, res) => {
    try {
        const oferta = await Oferta.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!oferta) {
            return res.status(404).send('Oferta não encontrada');
        }
        res.status(200).send(oferta);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// DELETE: Deleta uma oferta por ID
router.delete('/ofertas/:id', async (req, res) => {
    try {
        const oferta = await Oferta.findByIdAndDelete(req.params.id);
        if (!oferta) {
            return res.status(404).send('Oferta não encontrada');
        }
        res.status(200).send({ message: 'Oferta deletada com sucesso' });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

export default router;
