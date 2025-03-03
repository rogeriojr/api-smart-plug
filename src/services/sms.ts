import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function sendSMS(phoneNumber: string, message: string): Promise<string> {
    const command = new PublishCommand({
        Message: message,
        PhoneNumber: phoneNumber,
    });

    const result = await snsClient.send(command);
    return result.MessageId || '';
};