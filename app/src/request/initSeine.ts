import { assertEnvExist } from '#lambda/util/envCheck.js';
import seine from 'la-seine';

export const initSeine = async (): Promise<void> => {
  const clientId = process.env.API_CLIENT_ID;
  const clientSecret = process.env.API_CLIENT_SECRET;

  assertEnvExist(clientId);
  assertEnvExist(clientSecret);

  await seine.updateApiClient({ clientId, clientSecret });
};
