import { MongoClient } from 'mongodb';
import { LambdaError } from '../util/error.js';
import type { CURSUS_USER_COLLECTION } from '../cursusUser/cursusUser.js';
import type { EXAMS_COLLECTION } from '../exam/exam.js';
import type { EXPERIENCE_COLLECTION } from '../experience/experience.js';
import type { PROJECTS_USER_COLLECTION } from '../projectUser/projectsUser.js';
import type { TEAM_COLLECTION } from '../team/team.js';
import type { TITLES_USER_COLLECTION } from '../titlesUser/titlesUser.js';

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
  | typeof TEAM_COLLECTION;

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

type LogLastPage = typeof TITLES_USER_COLLECTION;

export const getCollectionLastPage = async (
  client: MongoClient,
  collection: LogLastPage,
): Promise<number> => {
  try {
    const collectionLog = await client
      .db()
      .collection(LOG_COLLECTION)
      .findOne<{ lastPage: number }>({ collection });

    if (collectionLog) {
      return collectionLog.lastPage;
    }

    return 1;
  } catch (e) {
    throw new LambdaError('mongodb read error at: ' + collection);
  }
};

export const setCollectionLastPage = async (
  client: MongoClient,
  collection: LogLastPage,
  lastPage: number,
): Promise<void> => {
  try {
    await client
      .db()
      .collection(LOG_COLLECTION)
      .updateOne(
        { collection },
        { $set: { collection, lastPage } },
        { upsert: true },
      );
  } catch {
    throw new LambdaError('mongodb write error at: ' + collection);
  }
};

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
