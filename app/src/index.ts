import dotenv from 'dotenv';
import { initSeine } from './connection.js';
import { CursusUserUpdator } from './cursusUser/cursusUser.js';
import { createMongoClient } from './mongodb/mongodb.js';
import { LambdaRedis } from './redis/LambdaRedis.js';
import { assertEnvExist } from './util/envCheck.js';
import { ExamUpdator } from './exam/exam.js';
import { TeamUpdator } from './team/team.js';
dotenv.config();

const main = async (): Promise<void> => {
  const mongoClient = await createMongoClient();
  await initSeine();

  const url = process.env.REDIS_URL;
  assertEnvExist(url);
  const redis = await LambdaRedis.createInstance({ url });

  await CursusUserUpdator.update(mongoClient, redis);
  await ExamUpdator.update(mongoClient);
  await TeamUpdator.update(mongoClient);

  await mongoClient.close();
  await redis.closeConnection();
  console.log('success');
};

export const handler = main;
