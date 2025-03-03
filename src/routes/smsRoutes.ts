import { Router, Request, Response } from 'express';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const router = Router();

// Criar o cliente SNS com as credenciais do .env
const snsClient = new SNSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// POST: Envia uma mensagem SMS
router.post('/sms/send', async (req: Request, res: Response) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
        return res.status(400).json({ error: 'phoneNumber and message are required' });
    }

    try {
        const command = new PublishCommand({
            Message: message,
            PhoneNumber: phoneNumber,
        });

        const result = await snsClient.send(command);
        res.status(200).json({
            message: 'SMS enviado com sucesso!',
            MessageId: result.MessageId,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            error: 'Falha ao enviar SMS',
            details: error.message,
        });
    }
});

export default router;
