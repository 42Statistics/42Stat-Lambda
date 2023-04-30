import { createMongoClient, createRedisClient } from './connection.js';

const main = async (): Promise<void> => {
  const mongoClient = await createMongoClient();
  const redisClient = await createRedisClient();

  const cursusUsers = fetchCursusUsers();

  await mongoClient.close();
  await redisClient.disconnect();
};

await main();
