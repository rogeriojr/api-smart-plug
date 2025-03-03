import { Router } from 'express';
import Pagamento, { IPagamento } from '../models/Pagamento';
import Projeto from '../models/Projeto';

const router = Router();

// POST: Cria uma nova pagamento
router.post('/pagamentos', async (req, res) => {
    try {
        const projeto = await Projeto.findOne({ _id: req.body.projetoId });
        console.log({ projeto })
        if (projeto) {
            const novoValorPago = projeto.valorPago + req.body.valor
            const pagamento: IPagamento = new Pagamento({ ...req.body, valor: req.body.valor });
            await pagamento.save();
            await Projeto.findOneAndUpdate({ _id: req.body.projetoId }, { valorPago: novoValorPago })
            res.status(201).send(pagamento);
            return
        }
        res.send({ status: true })
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Lista todas as pagamentos
router.get('/pagamentos', async (req, res) => {
    try {
        const pagamentos = await Pagamento.find();
        res.status(200).send(pagamentos);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém uma pagamento por ID
router.get('/pagamentos/:id', async (req, res) => {
    try {
        const pagamento = await Pagamento.findById(req.params.id);
        if (!pagamento) {
            return res.status(404).send('Pagamento não encontrada');
        }
        res.status(200).send(pagamento);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém uma pagamento por ID
router.get('/pagamentos/by_project/:id', async (req, res) => {
    try {
        console.log(req.params)
        const pagamento = await Pagamento.find({ projetoId: req.params.id });
        console.log(pagamento)
        if (!pagamento) {
            return res.status(404).send('Pagamento não encontrada');
        }
        res.status(200).send(pagamento);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza uma pagamento
router.put('/pagamentos/:id', async (req, res) => {
    try {
        const pagamento = await Pagamento.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!pagamento) {
            return res.status(404).send('Pagamento não encontrada');
        }
        res.status(200).send(pagamento);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// DELETE: Deleta uma pagamento por ID
router.delete('/pagamentos/:id', async (req, res) => {
    try {
        const pagamento = await Pagamento.findByIdAndDelete(req.params.id);
        if (!pagamento) {
            return res.status(404).send('Pagamento não encontrada');
        }
        res.status(200).send({ message: 'Pagamento deletada com sucesso' });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

export default router;
