import seine from 'la-seine';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

export const createMongoClient = async (): Promise<MongoClient> => {
  if (!process.env.MONGODB_URL) {
    throw Error('no env');
  }

  const client = new MongoClient(process.env.MONGODB_URL);
  await client.connect();
  return client;
};

export type RedisClient = ReturnType<typeof createClient>;

export const createRedisClient = async (): Promise<RedisClient> => {
  const client = createClient();

  // client.on('error', (err): never => {
  //   throw err;
  // });

  // await client.connect();

  return client;
};

export const initSeine = async (): Promise<void> => {
  const clientId = process.env.API_CLIENT_ID;
  const clientSecret = process.env.API_CLIENT_SECRET;

  if (!(clientId && clientSecret)) {
    throw Error('no env');
  }

  await seine.addApiClient({ clientId, clientSecret });
};
