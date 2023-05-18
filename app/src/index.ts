import dotenv from 'dotenv';
import { initSeine } from './connection.js';
import { CursusUserUpdator } from './cursusUser/cursusUser.js';
import { ExamUpdator } from './exam/exam.js';
import { LocationUpdator } from './location/location.js';
import { createMongoClient } from './mongodb/mongodb.js';
import { ProjectsUserUpdator } from './projectUser/projectsUser.js';
import { LambdaRedis } from './redis/LambdaRedis.js';
import { TeamUpdator } from './team/team.js';
import { TitleUpdator } from './title/title.js';
import { TitlesUserUpdator } from './titlesUser/titlesUser.js';
import { assertEnvExist } from './util/envCheck.js';

dotenv.config();

// todo:  cache, updator interface 만들어서 배열 형태로 관리

const main = async (): Promise<void> => {
  const mongoClient = await createMongoClient();
  await initSeine();

  const url = process.env.REDIS_URL;
  assertEnvExist(url);
  const redis = await LambdaRedis.createInstance({ url });

  await ProjectsUserUpdator.update(mongoClient);
  await CursusUserUpdator.update(mongoClient, redis);
  await ExamUpdator.update(mongoClient);
  await TeamUpdator.update(mongoClient);
  await TitleUpdator.update(mongoClient);
  await TitlesUserUpdator.update(mongoClient);
  await LocationUpdator.update(mongoClient);

  await mongoClient.close();
  await redis.closeConnection();
};

export const handler = main;
