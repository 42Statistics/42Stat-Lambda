import dotenv from 'dotenv';
import { initSeine } from './connection.js';
import { CursusUserUpdator } from './cursusUser/cursusUser.js';
import { EventUpdator } from './event/event.js';
import { EventsUserUpdator } from './eventsUser/eventsUser.js';
import { ExamUpdator } from './exam/exam.js';
import { LocationUpdator } from './location/location.js';
import { createMongoClient } from './mongodb/mongodb.js';
import { ProjectsUserUpdator } from './projectsUser/projectsUser.js';
import { QuestsUserUpdator } from './questsUser/questsUser.js';
import { LambdaRedis } from './redis/LambdaRedis.js';
import { ScoreUpdator } from './score/score.js';
import { TeamUpdator } from './team/team.js';
import { TitleUpdator } from './title/title.js';
import { TitlesUserUpdator } from './titlesUser/titlesUser.js';
import { assertEnvExist } from './util/envCheck.js';
import { MongoClient } from 'mongodb';

dotenv.config();

type Updator = {
  update: (mongoClient: MongoClient, ...args: any[]) => Promise<void>;
};

const main = async (): Promise<void> => {
  const mongoClient = await createMongoClient();
  await initSeine();

  const url = process.env.REDIS_URL;
  assertEnvExist(url);
  const redis = await LambdaRedis.createInstance({ url });

  const updators: Updator[] = [
    ProjectsUserUpdator,
    CursusUserUpdator,
    ExamUpdator,
    TeamUpdator,
    TitleUpdator,
    TitlesUserUpdator,
    LocationUpdator,
    ScoreUpdator,
    QuestsUserUpdator,
    EventUpdator,
    EventsUserUpdator,
  ];

  for (const updator of updators) {
    await updator.update(mongoClient, redis);
  }

  await mongoClient.close();
  await redis.closeConnection();
};

export const handler = main;
