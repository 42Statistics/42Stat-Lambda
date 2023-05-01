import {
  createMongoClient,
  createRedisClient,
  initSeine,
} from './connection.js';
import { updateCursusUser } from './cursusUser/cursusUser.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../env/.env' });

const main = async (): Promise<void> => {
  const mongoClient = await createMongoClient();
  const redisClient = await createRedisClient();
  await initSeine();

  await updateCursusUser(mongoClient, redisClient);

  await mongoClient.close();
  // await redisClient.disconnect();
};

await main();
