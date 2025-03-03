import { Router } from 'express';
import Acesso, { IAcesso } from '../models/Acesso';
import Trava from '../models/Trava';
import Usuario, { IUsuario } from '../models/Usuario';
import { limiteAvaliacaoMiddleware } from '../middlewares/limiteAvaliacaoMiddleware';
import { controlarSmartPlug, verificarStatusTomada } from '../services/tuya';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// A regra de acesso definida pelo Lucas Scarelli é:
// A trava estará SEMPRE LIGADA e ao ser lido o QR Code ela ficará desligada por 30 segundos e ligará novamente

// POST: Cria um novo acesso
router.post('/acessos', limiteAvaliacaoMiddleware, async (req, res) => {
    try {
        const { qrCode, usuarioId, status } = req.body;

        // Validar se a trava existe
        const trava = await Trava.findOne({ qrCode });
        if (!trava) throw new Error('Trava não encontrada');

        // Validar se o usuário existe
        const usuario = await Usuario.findOne({ _id: usuarioId });
        if (!usuario) throw new Error('Usuário não encontrado');

        // Validar o status
        if (status === undefined) throw new Error("O campo 'status' não foi informado.");

        // Enviar comando para a tomada
        const comandoTrava: any = await controlarSmartPlug(status);
        const deviceStatus = status ? 'online' : 'offline';

        // Se o comando for executado com sucesso
        if (comandoTrava?.success) {
            const agora = new Date();
            agora.setMilliseconds(agora.getMilliseconds() - 3 * 60 * 60 * 1000); // Ajustar para o fuso horário local

            // Atualizar o status da trava
            await Trava.findByIdAndUpdate(trava._id, { deviceStatus });

            // Criar e salvar o acesso
            const acesso: IAcesso = new Acesso({
                ...req.body,
                travaId: trava._id, // Salvar o ID da trava
                data: agora
            });
            await acesso.save();

            return res.status(201).send(acesso);
        }

        return res.send(comandoTrava);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// POST: Acesso com auto ligamento
router.post('/acesso_com_auto_ligamento/:codigo', limiteAvaliacaoMiddleware, async (req, res) => {
    try {
        const { usuarioId } = req.body;
        const { codigo } = req.params;

        // Validar se a trava existe
        const trava = await Trava.findOne({ codigo });
        if (!trava) throw new Error('Trava não encontrada');

        // Validar se o usuário existe
        const usuario = await Usuario.findOne({ _id: usuarioId });
        if (!usuario) throw new Error('Usuário não encontrado');

        // Verificar se o usuário está desabilitado
        if (usuario.desabilitarUsuario) {
            return res.status(403).json({
                error: 'Usuário bloqueado',
                message: 'Este usuário está bloqueado e não pode realizar esta ação.'
            });
        }

        // Verificação de trava personalizada
        if (trava.isPersonalizada && !trava.usuarios.some(u => u.equals(usuario._id))) {
            return res.status(403).json({
                error: 'Acesso negado',
                message: 'Esta trava é restrita para usuários específicos.'
            });
        }

        // Verificação de idade
        if (trava.maioresDe18) {
            const dataNascimento = new Date(usuario.dataDeNascimento);
            const hoje = new Date();
            let idade = hoje.getFullYear() - dataNascimento.getFullYear();
            const mes = hoje.getMonth() - dataNascimento.getMonth();

            if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
                idade--;
            }

            if (idade < 18) {
                return res.status(403).json({
                    error: 'Acesso restrito',
                    message: 'Esta trava é permitida apenas para maiores de 18 anos.'
                });
            }
        }

        if (trava.status !== 'ativa') {
            return res.status(403).json({
                error: 'Trava bloqueada/inativa',
                message: 'Esta trava está inativa e não pode ser utilizada.'
            });
        }

        // Verificar o status da tomada
        const statusTomada = await verificarStatusTomada(trava.deviceId);
        if (!statusTomada || !statusTomada.online) {
            throw new Error('A tomada está offline.');
        }

        // Enviar comando para desligar a tomada
        const comandoTrava = await controlarSmartPlug(trava.deviceId, false);
        console.log('Resposta da Tuya:', comandoTrava);

        if (comandoTrava?.success) {
            const agora = new Date();
            agora.setMilliseconds(agora.getMilliseconds() - 3 * 60 * 60 * 1000);

            // Atualizar o status da trava e o powerStatus para 'off'
            await Trava.findByIdAndUpdate(trava._id, {
                deviceStatus: 'offline',
                powerStatus: 'off'
            });

            // Criar e salvar o acesso
            const acesso: IAcesso = new Acesso({
                ...req.body,
                travaId: trava._id,
                data: agora
            });
            await acesso.save();

            // Agendar a trava para ligar após o tempo definido
            const tempoDesligamento = trava.tempoDesligamento || 30000;
            setTimeout(async () => {
                try {
                    console.log('Reativando a tomada após', tempoDesligamento, 'ms');
                    const secondComandoTrava = await controlarSmartPlug(trava.deviceId, true);
                    console.log('Resposta da Tuya (reativação):', secondComandoTrava);
                    if (secondComandoTrava?.success) {
                        // Atualizar o status da trava e o powerStatus para 'on'
                        await Trava.findByIdAndUpdate(trava._id, {
                            deviceStatus: 'online',
                            powerStatus: 'on'
                        });
                    }
                } catch (secondError) {
                    console.error('Erro na segunda requisição:', secondError);
                }
            }, tempoDesligamento);

            return res.status(201).send(acesso);
        }

        return res.send(comandoTrava);
    } catch (error: any) {
        console.log({ error });
        res.status(500).send(error.message);
    }
});

// GET: Lista todos os acessos com filtros
router.get('/acessos', authMiddleware, async (req, res) => {
    try {
        const user = req.user as IUsuario;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filtro: any = {};

        // Filtros para usuários 'mercado'
        if (user.tipo === 'mercado') {
            const travasDoUsuario = await Trava.find({ usuarios: user._id }).select('_id');
            const travaIds = travasDoUsuario.map(t => t._id);
            filtro.travaId = { $in: travaIds };
        }

        // Filtros adicionais via query params
        const { nomeUsuario, emailUsuario, telefoneUsuario, nomeTrava } = req.query;

        if (nomeUsuario || emailUsuario || telefoneUsuario) {
            const usuarioFiltro: any = {};
            if (nomeUsuario) usuarioFiltro.nome = { $regex: nomeUsuario, $options: 'i' };
            if (emailUsuario) usuarioFiltro.email = { $regex: emailUsuario, $options: 'i' };
            if (telefoneUsuario) usuarioFiltro.telefone = { $regex: telefoneUsuario, $options: 'i' };

            const usuarios = await Usuario.find(usuarioFiltro).select('_id');
            filtro.usuarioId = { $in: usuarios.map(u => u._id) };
        }

        // Filtro por nome da trava
        if (nomeTrava) {
            const travs = await Trava.find({ nome: { $regex: nomeTrava, $options: 'i' } }).select('_id');
            filtro.travaId = { $in: travs.map(t => t._id) };
        }

        // Contagem e busca
        const totalResults = await Acesso.countDocuments(filtro);
        const totalPages = Math.ceil(totalResults / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        const acessos = await Acesso.find(filtro)
            .sort({ data: -1, createdAt: -1, _id: 1 }) // Ordena por createdAt DESC e _id ASC
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'usuarioId',
                select: 'nome email telefone status imgUsuario'
            })
            .populate({
                path: 'travaId',
                select: 'nome'
            })
            .lean();

        res.status(200).send({
            data: acessos,
            pagination: {
                currentPage: page,
                limit,
                totalResults,
                totalPages,
                hasNextPage,
                hasPreviousPage
            }
        });
    } catch (error: any) {
        console.error('Erro em GET /acessos:', error);
        res.status(500).send(error.message);
    }
});

// GET: Obtém um acesso por ID
router.get('/acessos/:id', async (req, res) => {
    try {
        const acesso = await Acesso.findById(req.params.id)
            .populate('usuarioId')
            .populate('travaId'); // Retornar todos os campos da trava

        if (!acesso) {
            return res.status(404).send('Acesso não encontrado');
        }
        res.status(200).send(acesso);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém um acesso por ID
router.get('/acessos/trava/:codigoDaTrava', async (req, res) => {
    try {
        const trava = await Trava.findOne({ codigo: req.params.codigoDaTrava });
        if (!trava) throw new Error('Trava não encontrada');

        const acessos = await Acesso.find({ travaId: trava._id })
            .populate('usuarioId')
            .populate('travaId'); // Retornar todos os campos da trava

        if (!acessos) {
            return res.status(404).send('Acessos não encontrados.');
        }
        res.status(200).send(acessos.reverse());
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// GET: Obtém um acesso por ID
router.get('/acessos/usuario/:usuarioId', async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ _id: req.params.usuarioId });
        if (!usuario) throw new Error('Usuário não encontrado');

        const acessos = await Acesso.find({ usuarioId: usuario._id })
            .populate('usuarioId')
            .populate('travaId'); // Retornar todos os campos da trava

        if (!acessos) {
            return res.status(404).send('Acessos não encontrados.');
        }
        res.status(200).send(acessos);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza um acesso
router.put('/acessos/:id', async (req, res) => {
    try {
        const acesso = await Acesso.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!acesso) {
            return res.status(404).send('Acesso não encontrado');
        }
        res.status(200).send(acesso);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// DELETE: Deleta um acesso por ID
router.delete('/acessos/:id', async (req, res) => {
    try {
        const acesso = await Acesso.findByIdAndDelete(req.params.id);
        if (!acesso) {
            return res.status(404).send('Acesso não encontrado');
        }
        res.status(200).send({ message: 'Acesso deletado com sucesso' });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

let data: any = []
router.post('/webhook', async (req, res) => {
    try {
        console.log(req.body)
        data.push(req.body)
        // const acesso = await Acesso.findByIdAndDelete(req.params.id);
        // if (!acesso) {
        //     return res.status(404).send('Usuário não encontrado');
        // }
        res.status(200).send({ message: 'Usuário deletado com sucesso' });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});
router.post('/check/:checkout_id', async (req, res) => {
    try {
        console.log(req.params.checkout_id)
        console.log({ data })
        let checkout = data.filter((item: any) => item.id === req.params.checkout_id)
        checkout = checkout.find((item: any) => item.status === 'SUCCESSFUL')
        console.log({ checkout: checkout != undefined ? checkout : 'Não encontrado' })
        if (checkout) {
            console.log({ checkout })
            res.status(200).send(checkout);
        } else res.send({ mensagem: 'Checkout não encontrado' })
    } catch (error: any) {
        console.log({ error })
        res.status(400).send(error.message);
    }
});

export default router;