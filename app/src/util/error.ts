import { MongoClient, ObjectId } from 'mongodb';
import { z } from 'zod';

const ERROR_COLLECTION = 'errors';

export class LambdaError extends Error {
  readonly udatas?: object[];

  constructor(message: string, udatas?: object[]) {
    super(message);
    this.udatas = udatas;
  }
}

export const logError = async (
  client: MongoClient,
  { message, udatas }: LambdaError,
): Promise<void> => {
  try {
    const errorId = new ObjectId();

    await client
      .db()
      .collection(ERROR_COLLECTION)
      .insertOne({ _id: errorId, message });

    if (udatas) {
      await client
        .db()
        .collection(ERROR_COLLECTION)
        .insertMany(udatas.map((udata) => ({ errorId, udata })));
    }
  } catch {
    console.error('log failed');
  }
};

export function assertParseSuccess<T>(
  parsedData: z.SafeParseReturnType<unknown[], T>,
): asserts parsedData is z.SafeParseSuccess<T> {
  if (!parsedData.success) {
    throw new LambdaError('zod parse failed.', parsedData.error.errors);
  }
}
