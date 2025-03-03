import bcrypt from 'bcryptjs';
import { Router, Request, Response } from 'express';
import { limiteAvaliacaoMiddleware } from '../middlewares/limiteAvaliacaoMiddleware';
import authMiddleware from '../middlewares/authMiddleware';
import jwt from 'jsonwebtoken';
import Usuario, { IUsuario } from '../models/Usuario';
import { PublishCommand } from '@aws-sdk/client-sns';
import { sendSMS } from '../services/sms';

const router = Router();

router.get("/", async (req, res) => {
    res.send("OK, API Plug Smart funcionando perfeitamente!")
})

// POST: Cria um novo usuário
router.post('/usuarios', limiteAvaliacaoMiddleware, async (req, res) => {
    try {
        const usuarioData = {
            ...req.body,
            desabilitarUsuario: req.body.desabilitarUsuario ?? false // Garante um valor padrão
        };

        const usuario: IUsuario = new Usuario(usuarioData);
        await usuario.save();
        res.status(201).send(usuario);
    } catch (error: any) {
        console.log(error);
        res.status(500).send(error.message);
    }
});


// GET: Lista todos os usuários
router.get('/usuarios', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const user = req.user as IUsuario;

        const filtro: any = {};
        const { nome, telefone, email, cpf, status, desabilitado, ids } = req.query;

        // Novo filtro para múltiplos IDs
        if (ids) {
            const idList = (ids as string).split(',');
            filtro._id = { $in: idList };
        }

        if (nome) filtro.nome = { $regex: nome, $options: 'i' };
        if (telefone) filtro.telefone = { $regex: telefone, $options: 'i' };
        if (email) filtro.email = { $regex: email, $options: 'i' };
        if (cpf) filtro.cpf = { $regex: cpf, $options: 'i' };
        if (desabilitado && desabilitado !== 'todos') {
            filtro.desabilitarUsuario = desabilitado === 'desabilitado';
        }
        if (status && status !== 'todos') {
            filtro.status = status;
        }

        // Garantindo que o administrador veja todos os usuários corretamente
        if (user.tipo === 'mercado') {
            filtro.tipo = 'mercado';
            if (user.travaId && user.travaId.length > 0) {
                filtro.travaId = { $in: user.travaId };
            }
        }

        // Buscar e contar total de usuários
        const totalResults = await Usuario.countDocuments(filtro);
        const totalPages = Math.ceil(totalResults / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        // Buscar usuários respeitando a paginação
        const usuarios = await Usuario.find(filtro)
            .sort({ createdAt: -1, _id: 1 }) // Ordena por createdAt DESC e _id ASC
            .skip(skip)
            .limit(limit);

        res.status(200).send({
            data: usuarios,
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
        console.error('Erro em GET /usuarios:', error);
        res.status(500).send(error.message);
    }
});


// GET: Obtém um usuário por ID
router.get('/usuarios/:id', authMiddleware, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }
        res.status(200).send(usuario);
    } catch (error: any) {
        console.log(error)
        res.status(500).send(error.message);
    }
});

// GET: Obtém um usuário por E-mail
router.get('/usuarios/email/:email', async (req, res) => {
    try {
        var usuario: any = await Usuario.findOne({ email: req.params.email });
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }
        res.status(200).send(usuario);
    } catch (error: any) {
        console.log(error)
        res.status(500).send(error.message);
    }
});

// POST: Login do usuário
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const req_auth = req.headers.authorization;

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'Configuração de segurança faltando' });
        }

        if (!req_auth || req_auth !== process.env.JWT_SECRET) {
            return res.status(401).send({ error: 'Acesso negado. Token inválido.' });
        }

        if (!email || !senha) {
            return res.status(400).send({ error: 'Credenciais incompletas' });
        }

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const isMatch = await bcrypt.compare(senha, usuario.senha);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta' });
        }

        // Gerar tokens com novos tempos de expiração
        const access_token = jwt.sign(
            { _id: usuario._id, email: usuario.email, tipo: usuario.tipo },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Aumentado para 24 horas
        );

        const refresh_token = jwt.sign(
            { _id: usuario._id, email: usuario.email, tipo: usuario.tipo },
            process.env.JWT_SECRET,
            { expiresIn: '30d' } // Aumentado para 30 dias
        );

        // Salvar ambos os tokens no usuário
        usuario.authToken = access_token;
        usuario.refreshToken = refresh_token;
        await usuario.save();

        console.log("Usuário logado:")
        console.log({
            "id": usuario._id,
            "nome": usuario.nome,
            "email": usuario.email,
            "cpf": usuario.cpf,
            "telefone": usuario.telefone,
            "tipo": usuario.tipo,
            "status": usuario.status
        })
        // Retorna o usuário e o token se o e-mail e senha estiverem corretos
        res.status(200).send({ usuario, access_token, refresh_token });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).send(error.message);
    }
});

// POST: Refresh token
router.post('/login/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).send({ error: 'Refresh token necessário' });
        }

        // Verificar token e buscar usuário
        const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET!) as { _id: string };
        const usuario = await Usuario.findOne({
            _id: decoded._id,
            refreshToken: refresh_token,
            status: 'ativo'
        });

        if (!usuario) {
            return res.status(401).send({ error: 'Refresh token inválido' });
        }

        // Gerar novos tokens
        const new_access_token = jwt.sign(
            { _id: usuario._id, email: usuario.email, tipo: usuario.tipo },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        const new_refresh_token = jwt.sign(
            { _id: usuario._id, email: usuario.email, tipo: usuario.tipo },
            process.env.JWT_SECRET!,
            { expiresIn: '30d' }
        );

        // Atualizar tokens no banco
        usuario.authToken = new_access_token;
        usuario.refreshToken = new_refresh_token;
        await usuario.save();

        res.status(200).send({
            access_token: new_access_token,
            refresh_token: new_refresh_token
        });

    } catch (error: any) {
        console.error('Refresh token error:', error);

        const errorMessage = error.name === 'TokenExpiredError'
            ? 'Refresh token expirado'
            : 'Erro na renovação de token';

        res.status(401).send({
            error: errorMessage,
            message: 'Faça login novamente'
        });
    }
});

// POST: Logout do usuário
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send('Token não fornecido ou inválido');
        }

        const token = authHeader.split(' ')[1];

        // Busca o usuário pelo token
        let usuario: any = await Usuario.findOne({ authToken: token });
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Define o token como 'deslogado'
        usuario.authToken = null;
        await usuario.save();

        res.status(200).send('Logout realizado com sucesso');
    } catch (error: any) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

// POST: Obtém um código de recuperação de senha
router.post('/codigo-senha', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).send({ error: 'E-mail não fornecido.' });
        }

        // Busca o usuário pelo e-mail
        const usuario: any = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }
        if (!usuario.telefone || usuario.telefone.length < 11) {
            return res.status(400).send('Telefone não cadastrado ou inválido, entre em contato com o suporte');
        }

        // Gera um código e envia por sms
        const codigo = Math.floor(100000 + Math.random() * 9000000);
        console.log(`Código de recuperação de senha: ${codigo}`);
        // Salvando o código do usuário no banco
        usuario.codigoRecuperacao = codigo;
        await usuario.save();
        // Enviar o código por SMS
        console.log(usuario.telefone);
        const sendSms = await sendSMS(usuario.telefone, "Código de recuperação de senha Plug Smart: " + codigo);
        console.log(sendSms);
        res.status(200).send({ message: 'Código de recuperação de senha enviado com sucesso' });
    } catch (error: any) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

// POST: Confirmar código de recuperação de senha
router.post('/confirmar-codigo-senha', async (req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).send({ error: 'E-mail ou código não fornecido.' });
        }

        // Busca o usuário pelo e-mail
        let usuario: any = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Verifica se o código fornecido é válido
        if (codigo !== usuario.codigoRecuperacao) {
            return res.status(400).send('Código de recuperação de senha inválido');
        }

        res.status(200).send({ message: 'Código de recuperação de senha confirmado com sucesso' });
    } catch (error: any) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

// PUT: Recuperar senha do usuário
router.put('/recuperar-senha', async (req, res) => {
    try {
        const { email, senha, codigo } = req.body;

        // Verifica se todos os dados necessários foram fornecidos
        if (!email || !senha || !codigo) {
            return res.status(400).send({ error: 'E-mail, senha ou código não fornecido.' });
        }

        // Busca o usuário pelo e-mail
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).send({ error: 'Usuário não encontrado' });
        }

        // Verifica se o código fornecido é válido
        if (codigo !== usuario.codigoRecuperacao) {
            return res.status(400).send({ error: 'Código de recuperação de senha inválido' });
        }

        // Atualiza a senha e reseta o código de recuperação
        usuario.senha = senha;
        usuario.codigoRecuperacao = '';

        // Salva as alterações
        await usuario.save();

        res.status(200).send({ message: 'Senha recuperada com sucesso' });
    } catch (error: any) {
        console.error(error);
        res.status(500).send({ error: error.message || 'Erro interno do servidor' });
    }
});

// PUT: Atualiza um usuário
router.put('/usuarios/:id', authMiddleware, async (req, res) => {
    try {
        const { senha, desabilitarUsuario } = req.body;

        // Se a senha for fornecida, criptografe antes de atualizar
        if (senha) {
            const salt = await bcrypt.genSalt(10);
            req.body.senha = await bcrypt.hash(senha, salt);
        }

        // Atualiza o usuário
        const usuario = await Usuario.findByIdAndUpdate(req.params.id, {
            ...req.body,
            desabilitarUsuario: desabilitarUsuario ?? false // Garante que o valor seja booleano
        }, { new: true });

        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }

        res.status(200).send(usuario);
    } catch (error: any) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

router.put('/usuarios/desabilitar/:id', authMiddleware, async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(req.params.id, {
            desabilitarUsuario: true
        }, { new: true });

        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }

        res.status(200).send({ message: 'Usuário desabilitado com sucesso', usuario });
    } catch (error: any) {
        console.log(error);
        res.status(500).send(error.message);
    }
});


// DELETE: Deleta um usuário por ID
router.delete('/usuarios/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        // Obtém o id do usuário logado pelo header da requisição
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).send('Token não fornecido');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        const loggedUserId = decoded._id;
        const userIdToDelete = req.params.id;
        const user = await Usuario.findById(loggedUserId);

        // Verifica se o usuário logado é admin ou se o ID do usuário logado é o mesmo que está sendo apagado
        if (!user || (user.tipo !== 'adm' && loggedUserId !== userIdToDelete)) {
            return res.status(403).send('Acesso negado');
        }

        const usuario = await Usuario.findByIdAndDelete(userIdToDelete);
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }
        res.status(200).send({ message: 'Usuário deletado com sucesso' });
    } catch (error: any) {
        console.log(error)
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza a senha de um usuário autenticado
router.put('/atualizar-senha', authMiddleware, async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;

        // Obtém o id do usuário logado pelo header da requisição
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).send('Token não fornecido');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        const userId = decoded._id;

        // Busca o usuário pelo id
        const usuario = await Usuario.findById(userId);
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Compara a senha atual fornecida com a senha criptografada no banco
        const isMatch = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!isMatch) {
            return res.status(400).send('Senha atual incorreta');
        }

        // Criptografa a nova senha e atualiza no banco
        usuario.senha = novaSenha;
        await usuario.save();

        res.status(200).send({ message: 'Senha atualizada com sucesso' });
    } catch (error: any) {
        console.log(error)
        res.status(500).send(error.message);
    }
});

// PUT: Atualiza a imagem de um usuário autenticado
router.put('/atualizar-imagem', authMiddleware, async (req, res) => {
    try {
        const { imgUsuario } = req.body;

        // Obtém o id do usuário logado pelo header da requisição
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).send('Token não fornecido');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        const userId = decoded._id;

        // Busca o usuário pelo id
        const usuario = await Usuario.findById(userId);
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Atualiza a imagem do usuário
        usuario.imgUsuario = imgUsuario;
        await usuario.save();

        res.status(200).send({ message: 'Imagem atualizada com sucesso' });
    } catch (error: any) {
        console.log(error)
        res.status(500).send(error.message);
    }
});

// POST: Envia um código de ativação por SMS
router.post('/codigo-ativacao', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).send({ error: 'E-mail não fornecido.' });
        }

        // Busca o usuário pelo e-mail
        const usuario: any = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).send('Usuário não encontrado');
        }
        if (!usuario.telefone || usuario.telefone.length < 11) {
            return res.status(400).send('Telefone não cadastrado ou inválido, entre em contato com o suporte');
        }

        // Gera um código e envia por sms
        const codigo = Math.floor(100000 + Math.random() * 9000000);
        console.log(`Código de ativação: ${codigo}`);
        // Salvando o código do usuário no banco
        usuario.codigoAtivacao = codigo;
        await usuario.save();
        // Enviar o código por SMS
        console.log(usuario.telefone);
        const sendSms = await sendSMS(usuario.telefone, "Código de ativação Plug Smart: " + codigo);
        console.log(sendSms);
        res.status(200).send({ message: 'Código de ativação enviado com sucesso' });
    } catch (error: any) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

// POST: Ativa um usuário pelo código de SMS
router.post('/ativar-usuario', async (req, res) => {
    try {
        const { email, codigo } = req.body;

        // Verifica se todos os dados necessários foram fornecidos
        if (!email || !codigo) {
            return res.status(400).send({ error: 'E-mail ou código não fornecido.' });
        }

        // Busca o usuário pelo e-mail
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).send({ error: 'Usuário não encontrado' });
        }

        // Verifica se o código fornecido é válido
        if (codigo !== usuario.codigoAtivacao) {
            return res.status(400).send({ error: 'Código de ativação inválido' });
        }

        // Ativa o usuário
        usuario.status = 'ativo';
        usuario.codigoAtivacao = '';

        // Salva as alterações
        await usuario.save();

        res.status(200).send({ message: 'Usuário ativado com sucesso' });
    } catch (error: any) {
        console.error(error);
        res.status(500).send({ error: error.message || 'Erro interno do servidor' });
    }
});

router.delete("/usuarios/deletar-conta/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        // Obtém o ID do usuário logado pelo token
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).send("Token não fornecido.");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        const loggedUserId = decoded._id;
        const userIdToDelete = req.params.id;

        // Verifica se o usuário logado é o dono da conta ou um administrador
        const user = await Usuario.findById(loggedUserId);
        if (!user || (user.tipo !== "adm" && loggedUserId !== userIdToDelete)) {
            return res.status(403).send("Acesso negado.");
        }

        // Busca o usuário que será deletado
        const usuario = await Usuario.findById(userIdToDelete);
        if (!usuario) {
            return res.status(404).send("Usuário não encontrado.");
        }

        // Remove o usuário
        await Usuario.findByIdAndDelete(userIdToDelete);

        res.status(200).send({ message: "Conta excluída com sucesso e todos os dados relacionados foram removidos." });
    } catch (error: any) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

export default router;