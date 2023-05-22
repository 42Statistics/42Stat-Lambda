import { MongoClient } from 'mongodb';
import type { CURSUS_USER_COLLECTION } from '../cursusUser/cursusUser.js';
import type { EVENT_COLLECTION } from '../event/event.js';
import type { EVENTS_USER_COLLECTION } from '../eventsUser/eventsUser.js';
import type { EXAMS_COLLECTION } from '../exam/exam.js';
import type { EXPERIENCE_COLLECTION } from '../experience/experience.js';
import type { LOCATION_COLLECTION } from '../location/location.js';
import type { PROJECT_COLLECTION } from '../project/project.js';
import type { PROJECTS_USER_COLLECTION } from '../projectsUser/projectsUser.js';
import type { QUESTS_USER_COLLECTION } from '../questsUser/questsUser.js';
import type { SCALE_TEAM_COLLECTION } from '../scaleTeam/scaleTeam.js';
import type { TEAM_COLLECTION } from '../team/team.js';
import { LambdaError } from '../util/error.js';

export const LOG_COLLECTION = 'logs';

export const createMongoClient = async (): Promise<MongoClient> => {
  if (!process.env.MONGODB_URL) {
    throw Error('no env');
  }

  const client = new MongoClient(process.env.MONGODB_URL);
  await client.connect();
  return client;
};

type LogUpdatedAt =
  | typeof CURSUS_USER_COLLECTION
  | typeof EXAMS_COLLECTION
  | typeof EXPERIENCE_COLLECTION
  | typeof PROJECTS_USER_COLLECTION
  | typeof TEAM_COLLECTION
  | typeof LOCATION_COLLECTION
  | typeof QUESTS_USER_COLLECTION
  | typeof EVENT_COLLECTION
  | typeof EVENTS_USER_COLLECTION
  | typeof SCALE_TEAM_COLLECTION
  | typeof PROJECT_COLLECTION;

export const getCollectionUpdatedAt = async (
  client: MongoClient,
  collection: LogUpdatedAt,
): Promise<Date> => {
  try {
    const collectionLog = await client
      .db()
      .collection(LOG_COLLECTION)
      .findOne<{ updatedAt: Date }>({ collection });

    if (collectionLog) {
      return collectionLog.updatedAt;
    }

    return new Date(0);
  } catch (e) {
    throw new LambdaError('mongodb read error at: ' + collection);
  }
};

export const setCollectionUpdatedAt = async (
  client: MongoClient,
  collection: LogUpdatedAt,
  updatedAt: Date,
): Promise<void> => {
  try {
    await client
      .db()
      .collection(LOG_COLLECTION)
      .updateOne(
        { collection },
        { $set: { collection, updatedAt } },
        { upsert: true },
      );
  } catch {
    throw new LambdaError('mongodb write error at: ' + collection);
  }
};

export const getDocuemntCount = async (
  mongoClient: MongoClient,
  collection: string,
): Promise<number> =>
  await mongoClient.db().collection(collection).estimatedDocumentCount();

export const upsertManyById = async <T extends { id: number }>(
  client: MongoClient,
  collection: string,
  datas: T[],
): Promise<void> => {
  try {
    await Promise.all(
      datas.map((data) =>
        client
          .db()
          .collection(collection)
          .updateOne({ id: data.id }, { $set: data }, { upsert: true }),
      ),
    );
  } catch {
    throw new LambdaError('mongodb upsert error at: ' + collection);
  }
};
