import { LambdaMongo } from '#lambda/mongodb/mongodb.js';

const ERROR_COLLECTION = 'errors';

export class LambdaError extends Error {
  readonly udata?: unknown;

  constructor(message: string, udata?: unknown) {
    super(message);
    this.udata = udata;
  }
}

export const logError = async (
  mongo: LambdaMongo,
  { name, message, udata }: LambdaError,
): Promise<void> => {
  try {
    await mongo
      .db()
      .collection(ERROR_COLLECTION)
      .insertOne({ name, message, udata });
  } catch {
    console.error('log failed');
  }
};
