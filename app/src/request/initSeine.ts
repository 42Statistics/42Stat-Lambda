import { assertEnvExist } from '#lambda/util/envCheck.js';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import seine from 'la-seine';

export const initSeine = async (): Promise<void> => {
  const clientId = process.env.API_CLIENT_ID;

  const clientSecretId = process.env.API_CLIENT_SECRET_ID;
  assertEnvExist(clientSecretId);

  const secretsManagerClient = new SecretsManagerClient();
  const clientSecretJsonString = await secretsManagerClient.send(
    new GetSecretValueCommand({
      SecretId: clientSecretId,
    }),
  );
  secretsManagerClient.destroy();

  assertEnvExist(clientSecretJsonString.SecretString);

  const clientSecretKey = process.env.API_CLIENT_SECRET_KEY;
  assertEnvExist(clientSecretKey);

  const clientSecret = JSON.parse(clientSecretJsonString.SecretString)[
    clientSecretKey
  ];

  assertEnvExist(clientId);
  assertEnvExist(clientSecret);

  await seine.updateApiClient({ clientId, clientSecret });
};
