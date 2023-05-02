import { MongoClient } from 'mongodb';
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

export const getCollectionUpdatedAt = async (
  client: MongoClient,
  collection: string,
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
  collection: string,
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
