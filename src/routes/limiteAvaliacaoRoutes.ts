import { Router } from 'express';
import LimiteAvaliacao, { ILimiteAvaliacao } from '../models/LimiteAvaliacao';

const router = Router();

// GET: Obtém a contagem de avaliações de um usuário em um dia específico
router.get('/limite-avaliacao/:userId', async (req, res) => {
    try {
        const dataAtual = new Date();
        dataAtual.setHours(0, 0, 0, 0);

        const limite = await LimiteAvaliacao.findOne({
            usuarioId: req.params.userId,
            data: dataAtual
        });

        if (!limite) {
            return res.status(404).send('Limite de avaliação não encontrado para o usuário na data especificada');
        }

        res.status(200).send(limite);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});


//  zerar limite de avaliação - teste
router.put('/limite-avaliacao/:userId', async (req, res) => {
    try {
        const dataAtual = new Date();
        dataAtual.setHours(0, 0, 0, 0);

        const limite = await LimiteAvaliacao.findOneAndUpdate({
            usuarioId: req.params.userId,
            data: dataAtual
        }, { contagem: 0 });

        if (!limite) {
            return res.status(404).send('Limite de avaliação não encontrado para o usuário na data especificada');
        }

        res.status(200).send(limite);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

export default router;
