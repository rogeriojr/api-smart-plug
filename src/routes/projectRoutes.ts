import { Router } from 'express';
import Avaliacao, { IAvaliacao } from '../models/Avaliacao';
import Projeto, { IProjeto } from '../models/Projeto';

const router = Router();

// POST: Cria uma nova projeto
router.post('/projetos', async (req, res) => {
    try {
        const projeto: IProjeto = new Projeto(req.body);
        await projeto.save();
        res.status(201).send(projeto);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Lista todas as projetos
router.get('/projetos', async (req, res) => {
    try {
        const projetos = await Projeto.find();
        res.status(200).send(projetos);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém uma projeto por ID
router.get('/projetos/:id', async (req, res) => {
    try {
        const projeto = await Projeto.findById(req.params.id);
        if (!projeto) {
            return res.status(404).send('Projeto não encontrada');
        }
        res.status(200).send(projeto);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza uma projeto
router.put('/projetos/:id', async (req, res) => {
    try {
        const projeto = await Projeto.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!projeto) {
            return res.status(404).send('Projeto não encontrada');
        }
        res.status(200).send(projeto);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// DELETE: Deleta uma projeto por ID
router.delete('/projetos/:id', async (req, res) => {
    try {
        const projeto = await Projeto.findByIdAndDelete(req.params.id);
        if (!projeto) {
            return res.status(404).send('Projeto não encontrada');
        }
        res.status(200).send({ message: 'Projeto deletada com sucesso' });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

export default router;
