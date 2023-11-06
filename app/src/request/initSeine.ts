import { assertEnvExist } from '#lambda/util/envCheck.js';
import { LambdaError } from '#lambda/util/error.js';
import {
  GetSecretValueCommand,
  type GetSecretValueCommandOutput,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import seine from 'la-seine';

export const initSeine = async (): Promise<void> => {
  const clientId = process.env.API_CLIENT_ID;
  assertEnvExist(clientId);

  const clientSecret = await getClientSecretFromAws();

  await seine.updateApiClient({ clientId, clientSecret });
};

const fetchClientSecretFromAws = async (
  clientSecretId: string,
): Promise<GetSecretValueCommandOutput> => {
  const secretsManagerClient = new SecretsManagerClient();
  const clientSecretJsonString = await secretsManagerClient.send(
    new GetSecretValueCommand({
      SecretId: clientSecretId,
    }),
  );

  secretsManagerClient.destroy();

  return clientSecretJsonString;
};

const awsSecretConfigErrorMessage = 'wrong aws secret config';
const getClientSecretFromAws = async (): Promise<string> => {
  const clientSecretId = process.env.API_CLIENT_SECRET_ID;
  assertEnvExist(clientSecretId);

  const clientSecretJsonString = await fetchClientSecretFromAws(clientSecretId);
  assertEnvExist(clientSecretJsonString.SecretString);

  const clientSecretJson = JSON.parse(
    clientSecretJsonString.SecretString,
  ) as unknown;

  const clientSecretKey = process.env.API_CLIENT_SECRET_KEY;
  assertEnvExist(clientSecretKey);

  if (
    !clientSecretJson ||
    typeof clientSecretJson !== 'object' ||
    !(clientSecretKey in clientSecretJson)
  ) {
    throw new LambdaError(awsSecretConfigErrorMessage);
  }

  const clientSecret = (clientSecretJson as Record<string, string>)[
    clientSecretKey
  ] as unknown;

  if (!clientSecret || typeof clientSecret !== 'string') {
    throw new LambdaError(awsSecretConfigErrorMessage);
  }

  return clientSecret;
};
