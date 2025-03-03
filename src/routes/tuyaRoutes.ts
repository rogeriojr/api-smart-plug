import express from 'express';
import { controlarSmartPlug } from '../services/tuya';

const router = express.Router();

// POST: Controla o dispositivo Smart Plug
router.post('/smartplug/control', async (req, res) => {
  const { turnOn } = req.body;

  // Validação do parâmetro
  if (typeof turnOn !== 'boolean') {
    return res.status(400).send({ error: 'O parâmetro turnOn é obrigatório e deve ser booleano.' });
  }

  try {
    const resultado = await controlarSmartPlug(turnOn);

    if (resultado.success) {
      return res.status(200).send({ message: 'Comando enviado com sucesso!', data: resultado.data });
    } else {
      return res.status(500).send({ error: 'Falha ao enviar o comando.', data: resultado.data });
    }
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error.message || error);
    res.status(500).send({ error: 'Erro interno do servidor.' });
  }
});

export default router;
