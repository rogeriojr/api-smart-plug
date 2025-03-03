import { Router } from 'express';
import Trava, { ITrava } from '../models/Trava';
import { v4 as uuidv4 } from 'uuid';
import Usuario, { IUsuario } from '../models/Usuario';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// POST: Cria uma nova trava
router.post('/travas', authMiddleware, async (req, res) => {
    try {
        const user = req.user as IUsuario;

        if (!['adm', 'mercado'].includes(user.tipo)) {
            return res.status(403).send('Acesso não autorizado');
        }

        const {
            nome,
            nomeMercado,
            deviceId,
            codigo,
            tempoDesligamento,
            isPersonalizada,
            maioresDe18
        } = req.body;

        const trava: ITrava = new Trava({
            nome,
            nomeMercado,
            deviceId,
            codigo,
            tempoDesligamento: tempoDesligamento || 30000, // 30s padrão
            qrCode: req.body.qrCode || uuidv4(),
            usuarios: [user._id], // Usuários com acesso
            criadorId: user._id, // Dono da trava
            status: 'ativa', // Valor padrão
            deviceStatus: 'offline', // Valor padrão
            powerStatus: 'off', // Valor padrão
            isPersonalizada: isPersonalizada || false,
            maioresDe18: maioresDe18 || false
        });

        await trava.save();
        res.status(201).send(trava);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Lista todas as travas com filtros
router.get('/travas', authMiddleware, async (req, res) => {
    try {
        const user = req.user as IUsuario;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filtro: any = {};
        const { nomeMercado, deviceId, status } = req.query;

        // Filtro para usuários mercado
        if (user.tipo === 'mercado') {
            filtro.usuarios = user._id;
        }

        // Admin pode ver todas as travas
        if (user.tipo !== 'adm') {
            filtro.usuarios = user._id;
        }

        // Filtrar nomeMercado com expressão regular (ignora letras maiúsculas e espaços extras)
        if (nomeMercado) {
            filtro.nomeMercado = { $regex: nomeMercado.trim(), $options: 'i' };
        }

        // Filtrar deviceId exatamente, removendo espaços extras
        if (deviceId) {
            filtro.deviceId = deviceId.trim();
        }

        // Filtrar status apenas se for "ativo" ou "inativo"
        if (status) {
            filtro.status = status;
        }

        const totalResults = await Trava.countDocuments(filtro);
        const totalPages = Math.ceil(totalResults / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        const travas = await Trava.find(filtro)
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'usuarios',
                select: 'nome email tipo dataDeNascimento'
            });

        res.status(200).send({
            data: travas,
            pagination: {
                currentPage: page,
                limit: limit,
                totalResults: totalResults,
                totalPages: totalPages,
                hasNextPage: hasNextPage,
                hasPreviousPage: hasPreviousPage,
            },
        });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém uma trava por ID
router.get('/travas/:id', async (req, res) => {
    try {
        const trava = await Trava.findById(req.params.id);
        if (!trava) {
            return res.status(404).send('Usuário não encontrado');
        }
        res.status(200).send(trava);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém uma trava por código
router.get('/travas/codigo/:codigo', async (req, res) => {
    try {
        var trava: any = await Trava.findOne({ codigo: req.params.codigo });
        if (!trava) {
            return res.status(404).send('Usuário não encontrado');
        }
        res.status(200).send(trava);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza uma trava
router.put('/travas/:id', authMiddleware, async (req, res) => {
    try {
        const user = req.user as IUsuario;
        const trava = await Trava.findById(req.params.id);

        if (!trava) return res.status(404).send('Trava não encontrada');

        if (user.tipo !== 'adm' && !trava.criadorId.equals(user._id)) {
            return res.status(403).send('Acesso não autorizado');
        }

        const updatableFields = {
            nome: req.body.nome,
            nomeMercado: req.body.nomeMercado,
            deviceId: req.body.deviceId,
            codigo: req.body.codigo,
            tempoDesligamento: req.body.tempoDesligamento,
            status: req.body.status,
            deviceStatus: req.body.deviceStatus,
            powerStatus: req.body.powerStatus,
            isPersonalizada: req.body.isPersonalizada,
            maioresDe18: req.body.maioresDe18
        };

        if (user.tipo === 'adm' && req.body.usuarios) {
            updatableFields.usuarios = req.body.usuarios;
        }

        const updatedTrava = await Trava.findByIdAndUpdate(
            req.params.id,
            { $set: updatableFields },
            { new: true }
        );

        res.status(200).send(updatedTrava);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// DELETE: Deleta uma trava
router.delete('/travas/:id', async (req, res) => {
    try {
        const trava = await Trava.findByIdAndDelete(req.params.id);
        if (!trava) {
            return res.status(404).send('Usuário não encontrado');
        }
        res.status(200).send({ message: 'Usuário deletado com sucesso' });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});


export default router;