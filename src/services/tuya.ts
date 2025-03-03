import { TuyaContext } from '@tuya/tuya-connector-nodejs';

// Configurações
const ACCESS_KEY = 'Sua chave de acesso';
const SECRET_KEY = 'Sua chave secreta';
const BASE_URL = 'https://openapi.tuyaus.com';

// Inicializa o Tuya Context
const tuyaContext = new TuyaContext({
  baseUrl: BASE_URL,
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
});

// Função para verificar o status da tomada
export async function verificarStatusTomada(deviceId: string): Promise<{ online: boolean; status: any }> {
  try {
    const response = await tuyaContext.request({
      method: 'GET',
      path: `/v1.0/iot-03/devices/${deviceId}/status`,
    });

    console.log('Status da tomada:', response);
    //TO DO: Implementar a lógica para verificar o status da tomada
    // Procura o código relay_status dentro do array de status
    // const relayStatus = response.result.find((item: any) => item.code === "relay_status");

    return {
      online: true,
      status: response.result,
    };
  } catch (error: any) {
    console.error('Erro ao verificar o status da tomada:', error.message || error);
    return { online: false, status: null };
  }
}


// Função para enviar comando ao Smart Plug
export async function controlarSmartPlug(deviceId: string, turnOn: boolean): Promise<{ success: boolean; data: any }> {
  try {
    console.log(`Enviando comando para ${turnOn ? 'ligar' : 'desligar'} o dispositivo.`);

    // Verifica se o dispositivo está online
    const statusTomada = await verificarStatusTomada(deviceId);
    if (!statusTomada.online) {
      console.error('A tomada está offline.');
      return { success: false, data: null };
    }

    // Requisição para controlar o dispositivo
    const response = await tuyaContext.request({
      method: 'POST',
      path: `/v1.0/iot-03/devices/${deviceId}/commands`,
      body: {
        commands: [
          {
            code: 'switch_1', // Código específico do comando (switch_1 liga/desliga a tomada)
            value: turnOn,
          },
        ],
      },
    });

    console.log('Resposta da Tuya API:', JSON.stringify(response, null, 2));

    return { success: response.success, data: response };
  } catch (error: any) {
    console.error('Erro ao enviar comando:', error.message || error);
    return { success: false, data: null };
  }
}