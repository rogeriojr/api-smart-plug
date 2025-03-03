# API Smart Plug

## Sobre o Projeto
A **API Smart Plug** é uma API desenvolvida em **Node.js** com **Express** e **TypeScript**, projetada para controlar **smart plugs da Tuya**. O sistema também utiliza o serviço **SNS da Amazon (AWS Simple Notification Service)** para notificações e comunicação em tempo real via **WebSockets**. O banco de dados utilizado é o **MongoDB**.

## Prints


## Tecnologias Utilizadas
- **Node.js** + **Express**
- **TypeScript**
- **AWS SNS (@aws-sdk/client-sns)**
- **Tuya Connector (@tuya/tuya-connector-nodejs)**
- **Socket.io** para comunicação em tempo real
- **MongoDB (mongoose)** para armazenamento de dados
- **JWT (jsonwebtoken)** para autenticação
- **bcryptjs** para criptografia de senhas

## Requisitos
Antes de rodar o projeto, certifique-se de ter instalado:
- **Node.js** (versão mais recente recomendada)
- **MongoDB** (caso utilize armazenamento local)
- Conta AWS configurada para uso do SNS
- Conta Tuya configurada para controle dos dispositivos

## Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/api-smart-plug.git
   cd api-smart-plug
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo **.env** e configure as variáveis necessárias:
   ```env
   TUYA_ACCESS_ID=seu_access_id
   TUYA_ACCESS_SECRET=seu_access_secret
   AWS_REGION=us-east-1
   AWS_SNS_TOPIC_ARN=seu_topic_arn
   MONGO_URI=mongodb://localhost:27017/smartplug
   JWT_SECRET=sua_chave_secreta
   ```

## Configuração do Banco de Dados (MongoDB)
Para configurar a conexão com o MongoDB, adicione o seguinte trecho de código no seu arquivo principal:

```typescript
import express from 'express';
import cors from 'cors'; 
import mongoose from 'mongoose';
import usuarioRoutes from './routes/usuarioRoutes';
import carteiraRoutes from './routes/carteiraRoutes';
import avaliacaoRoutes from './routes/avaliacaoRoutes';
import ofertaRoutes from './routes/ofertaRoutes';
import limiteAvaliacaoRoutes from './routes/limiteAvaliacaoRoutes';
import projectRoutes from './routes/projectRoutes';
import pagamentoRoutes from './routes/pagamentoRoutes';
import travaRoutes from './routes/travaRoutes';
import acessoRoutes from './routes/acessoRoutes';
import smsRoutes from './routes/smsRoutes';
import tuyaRoutes from './routes/tuyaRoutes';

const app = express();

// Ativando o CORS para todas as rotas
app.use(cors());

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI as string, {
    dbName: 'smartplug'
}).then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Configurando o limite para o payload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rotas
app.use(usuarioRoutes);
app.use(carteiraRoutes);
app.use(avaliacaoRoutes);
app.use(ofertaRoutes);
app.use(limiteAvaliacaoRoutes);
app.use(projectRoutes);
app.use(pagamentoRoutes);
app.use(travaRoutes);
app.use(acessoRoutes);
app.use(smsRoutes);
app.use(tuyaRoutes);

export default app;
```

## Execução
### Modo desenvolvimento
```bash
npm run dev
```

### Build e execução em produção
```bash
npm run build
npm start
```

## Endpoints Principais
A API oferece endpoints para:
- Autenticação de usuários
- Gerenciamento de dispositivos Tuya
- Controle remoto dos smart plugs
- Envio de mensagens via AWS SNS


## Contribuição
Fique à vontade para abrir **issues** e **pull requests** para melhorias no projeto.

## Licença
Este projeto é licenciado sob a **MIT License**.
# api-smart-plug
