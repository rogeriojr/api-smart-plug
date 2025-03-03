import { Router } from 'express';
import Carteira, { ICarteira } from '../models/Carteira';

const router = Router();

// POST: Cria uma nova carteira
router.post('/carteiras', async (req, res) => {
    try {
        const carteira: ICarteira = new Carteira(req.body);
        await carteira.save();
        res.status(201).send(carteira);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Lista todas as carteiras
router.get('/carteiras', async (req, res) => {
    try {
        const carteiras = await Carteira.find().populate('usuarioId');
        res.status(200).send(carteiras);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém uma carteira por ID
router.get('/carteiras/:id', async (req, res) => {
    try {
        const carteira = await Carteira.findById(req.params.id).populate('usuarioId');
        if (!carteira) {
            return res.status(404).send('Carteira não encontrada');
        }
        res.status(200).send(carteira);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza uma carteira
router.put('/carteiras/:id', async (req, res) => {
    try {
        const carteira = await Carteira.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!carteira) {
            return res.status(404).send('Carteira não encontrada');
        }
        res.status(200).send(carteira);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// DELETE: Deleta uma carteira por ID
router.delete('/carteiras/:id', async (req, res) => {
    try {
        const carteira = await Carteira.findByIdAndDelete(req.params.id);
        if (!carteira) {
            return res.status(404).send('Carteira não encontrada');
        }
        res.status(200).send({ message: 'Carteira deletada com sucesso' });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

export default router;
