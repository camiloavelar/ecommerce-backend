import Gerencianet from 'gn-api-sdk-node';
import https from 'https';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.GN_BILLET_CLIENT_ID;
const clientSecret = process.env.GN_BILLET_SECRET;

const pixClientId = process.env.GN_PIX_CLIENT_ID;
const pixSecret = process.env.GN_PIX_SECRET;

const options = {
  client_id: clientId,
  client_secret: clientSecret,
  sandbox: true,
};

const gerencianet = new Gerencianet(options);

export const createBillet = (billetInfo) => {
  return gerencianet.oneStep([], billetInfo);
};

export const createPixCharge = async (pixInfo) => {
  const agent = new https.Agent({
    cert: process.env.PIX_CRT,
    key: process.env.PIX_KEY,
    keepAlive: true,
    keepAliveMsecs: 5 * 60 * 1000,
  });

  const auth = Buffer.from(`${pixClientId}:${pixSecret}`).toString('base64');

  const config = {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    httpsAgent: agent,
  };

  const data = JSON.stringify({ grant_type: 'client_credentials' });

  try {
    const {
      data: { access_token },
    } = await axios.request({
      url: `${process.env.PIX_URL}/oauth/token`,
      method: 'POST',
      data,
      ...config,
    });

    const config2 = {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
    };

    const data2 = {
      calendario: {
        expiracao: 3600,
      },
      devedor: {
        cpf: pixInfo.document,
        nome: pixInfo.name,
      },
      valor: {
        original: pixInfo.value,
      },
      chave: 'camilo.avelar+gn@gmail.com',
      infoAdicionais: pixInfo.additionalInfo,
    };

    const {
      data: {
        loc: { id },
      },
    } = await axios.request({
      url: `${process.env.PIX_URL}/v2/cob`,
      method: 'POST',
      data: data2,
      ...config2,
    });

    const { data: response } = await axios.request({
      url: `${process.env.PIX_URL}/v2/loc/${id}/qrcode`,
      method: 'GET',
      ...config2,
    });

    return response.imagemQrcode;
  } catch (err) {
    console.log(err.response);
    throw err;
  }
};
