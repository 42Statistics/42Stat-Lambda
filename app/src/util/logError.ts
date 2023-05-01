import { MongoClient } from 'mongodb';

export const logError = async (
  client: MongoClient,
  error: object[],
): Promise<void> => {
  try {
    await client.db().collection('erros').insertMany(error);
  } catch {
    try {
      await client.db().collection('erros').insertMany(error);
    } catch {
      console.error('log failed');
    }
  }
};
