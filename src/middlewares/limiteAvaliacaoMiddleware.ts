import LimiteAvaliacao from "../models/LimiteAvaliacao";
import mongoose from 'mongoose';
import Usuario from "../models/Usuario";


export const limiteAvaliacaoMiddleware = async (req: any, res: any, next: any) => {
    console.log(req.originalUrl)
    console.log(req.body)
    next();
    return
    // if (req.body?.usuarioId) {
    //     req.body.usuarioId = new mongoose.Types.ObjectId(req.body.usuarioId);
    // }
    // try {
    //     const dataAtual: any = new Date();
    //     dataAtual.setHours(0, 0, 0, 0);

    //     const limite = await LimiteAvaliacao.findOne({
    //         usuarioId: req.body.usuarioId,
    //         data: dataAtual
    //     });

    //     const usuario = await Usuario.findById(req.body.usuarioId);

    //     if (!usuario) {
    //         throw new Error('Usuário não encontrado');
    //     }

    //     if (!limite) {
    //         const novoLimite = new LimiteAvaliacao({
    //             usuarioId: req.body.usuarioId,
    //             contagem: 1,
    //             data: dataAtual
    //         });
    //         const nL = await novoLimite.save();
    //         next();
    //         return;
    //     }

    //     const purchaseDateObj: any = new Date(usuario.dataDaCompra);
    //     const daysSincePurchase: any = Math.floor((dataAtual - purchaseDateObj) / (1000 * 60 * 60 * 24));

    //     let valorDiario = 100; // Default value
    //     let limiteDiarioDeAvaliacoes = 15; // Default value for after 21 days

    //     console.log({ usuario })

    //     if (usuario?.tipo === 'premium') {
    //         valorDiario = 200;
    //     }

    //     if (daysSincePurchase <= 7) {
    //         limiteDiarioDeAvaliacoes = 40;
    //     } else if (daysSincePurchase <= 14) {
    //         limiteDiarioDeAvaliacoes = 30;
    //     } else if (daysSincePurchase <= 21) {
    //         limiteDiarioDeAvaliacoes = 20;
    //     }

    //     if (limite && limite.contagem >= limiteDiarioDeAvaliacoes) {
    //         return res.status(400).send({ limit: 'Limite diário de avaliações alcançado.' });
    //     } else {
    //         limite.contagem += 1;
    //         const isSaved = await limite.save();
    //         req.body.usuario = usuario;
    //         next();
    //     }
    // } catch (error: any) {
    //     res.status(500).send(error.message);
    // }
};
