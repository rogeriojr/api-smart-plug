import axios from 'axios';

export const access = async (deviceId: string, status: string | 'true' | 'false') => {
    return (await axios.post('http://tuya.acutistecnologia.com/access', {
        deviceId, status, accessKey: 'hvgkev3nt58na5vgx7ms'
    })).data
}