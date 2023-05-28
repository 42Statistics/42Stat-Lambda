import { CoalitionsUserUpdator } from '#lambda/coalitionsUser/coalitionsUser.js';
import { CursusUserUpdator } from '#lambda/cursusUser/cursusUser.js';
import { EventUpdator } from '#lambda/event/event.js';
import { EventsUserUpdator } from '#lambda/eventsUser/eventsUser.js';
import { ExamUpdator } from '#lambda/exam/exam.js';
import { LocationUpdator } from '#lambda/location/location.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { ProjectUpdator } from '#lambda/project/project.js';
import { ProjectsUserUpdator } from '#lambda/projectsUser/projectsUser.js';
import { QuestsUserUpdator } from '#lambda/questsUser/questsUser.js';
import { LambdaRedis } from '#lambda/redis/LambdaRedis.js';
import { initSeine } from '#lambda/request/initSeine.js';
import { ScaleTeamUpdator } from '#lambda/scaleTeam/scaleTeam.js';
import { ScoreUpdator } from '#lambda/score/score.js';
import { TeamUpdator } from '#lambda/team/team.js';
import { TitleUpdator } from '#lambda/title/title.js';
import { TitlesUserUpdator } from '#lambda/titlesUser/titlesUser.js';
import { assertEnvExist } from '#lambda/util/envCheck.js';
import dotenv from 'dotenv';

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
  await TeamUpdator.update(mongo);
  await CursusUserUpdator.update(mongo, redis);
  await ExamUpdator.update(mongo);
  {
    const miniutes = new Date().getUTCMinutes();

    if (Math.floor(miniutes / 10) === 0) {
      await TitleUpdator.update(mongo);
      await TitlesUserUpdator.update(mongo);
    }
  }
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
