import { MongoClient } from 'mongodb';

const ERROR_COLLECTION = 'errors';

export class LambdaError extends Error {
  readonly udata?: unknown;

  constructor(message: string, udata?: unknown) {
    super(message);
    this.udata = udata;
  }
}

export const logError = async (
  client: MongoClient,
  { name, message, udata }: LambdaError,
): Promise<void> => {
  try {
    await client
      .db()
      .collection(ERROR_COLLECTION)
      .insertOne({ name, message, udata });
  } catch {
    console.error('log failed');
  }
};
