import dotenv from 'dotenv';
import { CoalitionsUserUpdator } from './coalitionsUser/coalitionsUser.js';
import { initSeine } from './connection.js';
import { CursusUserUpdator } from './cursusUser/cursusUser.js';
import { EventUpdator } from './event/event.js';
import { EventsUserUpdator } from './eventsUser/eventsUser.js';
import { ExamUpdator } from './exam/exam.js';
import { LocationUpdator } from './location/location.js';
import { LambdaMongo } from './mongodb/mongodb.js';
import { ProjectUpdator } from './project/project.js';
import { ProjectsUserUpdator } from './projectsUser/projectsUser.js';
import { QuestsUserUpdator } from './questsUser/questsUser.js';
import { LambdaRedis } from './redis/LambdaRedis.js';
import { ScaleTeamUpdator } from './scaleTeam/scaleTeam.js';
import { ScoreUpdator } from './score/score.js';
import { TeamUpdator } from './team/team.js';
import { TitleUpdator } from './title/title.js';
import { TitlesUserUpdator } from './titlesUser/titlesUser.js';
import { assertEnvExist } from './util/envCheck.js';

dotenv.config();

const main = async (): Promise<void> => {
  await initSeine();

  const mongoUrl = process.env.MONGODB_URL;
  assertEnvExist(mongoUrl);
  const mongo = await LambdaMongo.createInstance(mongoUrl);

  const redisUrl = process.env.REDIS_URL;
  assertEnvExist(redisUrl);
  const redis = await LambdaRedis.createInstance(redisUrl);

  await ProjectsUserUpdator.update(mongo);
  await CursusUserUpdator.update(mongo, redis);
  await ExamUpdator.update(mongo);
  await TeamUpdator.update(mongo);
  await TitleUpdator.update(mongo);
  await TitlesUserUpdator.update(mongo);
  await LocationUpdator.update(mongo);
  await ScoreUpdator.update(mongo);
  await QuestsUserUpdator.update(mongo);
  await EventUpdator.update(mongo);
  await EventsUserUpdator.update(mongo);
  await ScaleTeamUpdator.update(mongo);
  await ProjectUpdator.update(mongo);
  await CoalitionsUserUpdator.update(mongo);

  await mongo.closeConnection();
  await redis.closeConnection();
};

export const handler = main;
