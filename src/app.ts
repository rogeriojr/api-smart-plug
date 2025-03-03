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
mongoose.connect('', { // Adicionar a string de conexão do MongoDB
    dbName: 'smartplug'
});

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
