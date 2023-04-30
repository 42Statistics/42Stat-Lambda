import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

export const createMongoClient = async () => {
  const client = new MongoClient('');
  await client.connect();
  return client;
};

export const createRedisClient = async (): Promise<
  ReturnType<typeof createClient>
> => {
  const client = createClient();

  client.on('error', (err): never => {
    throw err;
  });

  await client.connect();

  return client;
};
