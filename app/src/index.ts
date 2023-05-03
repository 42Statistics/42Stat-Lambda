import dotenv from 'dotenv';
import { initSeine } from './connection.js';
import { updateCursusUser } from './cursusUser/cursusUser.js';
import { createMongoClient } from './mongodb/mongodb.js';
import { createRedisClient } from './redis/redis.js';

dotenv.config();

const main = async (): Promise<void> => {
  const mongoClient = await createMongoClient();
  const redisClient = await createRedisClient();
  await initSeine();

  const curr = new Date();

  console.log('connected');
  // await updateCursusUser(mongoClient, redisClient);

  const end = new Date();
  console.log(end.getTime() - curr.getTime());

  await mongoClient.close();
  // await redisClient.disconnect();
};

export const handler = main;
