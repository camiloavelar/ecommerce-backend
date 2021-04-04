import parameterStoreEnv from 'aws-parameter-store-env';
import util from 'util';
import aws from 'aws-sdk';

const env = process.env.NODE_ENV === 'production' ? 'production' : 'testing';

export const loadConfig = async () => {
  let awsConfig = {
    region: 'sa-east-1',
  };

  if (process.env.NODE_ENV === 'development') {
    awsConfig.credentials = {
      secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    };
  }

  aws.config.update(awsConfig);

  const secretsManager = new aws.SecretsManager();

  const configPromise = util.promisify(parameterStoreEnv.config);

  await configPromise({
    path: `/${env}/`,
    parameters: [
      {
        name: 'JWT_SECRET',
        envName: 'JWT_SECRET',
      },
      {
        name: 'MONGO_URL',
        envName: 'MONGO_URL',
      },
      {
        name: 'PAYPAL_CLIENT_ID',
        envName: 'PAYPAL_CLIENT_ID',
      },
      {
        name: 'GN_PIX_CRT',
        envName: 'PIX_CRT',
      },
      {
        name: 'GN_PIX_KEY',
        envName: 'PIX_KEY',
      },
      {
        name: 'GN_PIX_URL',
        envName: 'PIX_URL',
      },
    ],
    region: 'sa-east-1',
    withDecryption: true,
  });

  const gnPixApiSecretPromise = secretsManager
    .getSecretValue({ SecretId: `${env}/GN_PIX_API` })
    .promise();

  const gnPaymentApiSecretPromise = secretsManager
    .getSecretValue({ SecretId: `${env}/GN_PAYMENT_API` })
    .promise();

  const [gnPixApiSecret, gnPaymentApiSecret] = await Promise.all([
    gnPixApiSecretPromise,
    gnPaymentApiSecretPromise,
  ]);

  const pixApiCredentials = JSON.parse(gnPixApiSecret.SecretString);
  const paymentApiCredentials = JSON.parse(gnPaymentApiSecret.SecretString);

  process.env.GN_BILLET_CLIENT_ID = paymentApiCredentials.id;
  process.env.GN_BILLET_CLIENT_SECRET = paymentApiCredentials.secret;
  process.env.GN_PIX_CLIENT_ID = pixApiCredentials.id;
  process.env.GN_PIX_SECRET = pixApiCredentials.secret;
};
