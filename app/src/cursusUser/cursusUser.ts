import { MongoClient } from 'mongodb';
import { RedisClient } from '../connection.js';
import { logError } from '../util/logError.js';
import { pagedRequest } from '../util/pagedRequest.js';
import { cursusUserSchema, CURSUS_USER_EP } from './api/cursusUser.api.js';

const COLLECTION_NAME = 'cursus_users';

export const updateCursusUser = async (
  mongoClient: MongoClient,
  redisClient: RedisClient,
): Promise<void | never> => {
  const start = await mongoClient
    .db()
    .collection('log')
    .findOne<{ updatedAt: Date }>({ name: COLLECTION_NAME });

  const end = new Date();

  console.log(start, end);

  const cursusUserDto = await pagedRequest(
    mongoClient,
    CURSUS_USER_EP(start ? start.updatedAt : new Date(0), end),
    100,
  );

  const cursusUsers = cursusUserSchema.array().safeParse(cursusUserDto);

  if (!cursusUsers.success) {
    await logError(mongoClient, cursusUsers.error.errors);
    throw Error();
  }

  await Promise.all(
    cursusUsers.data.map((cursusUser) =>
      mongoClient
        .db()
        .collection(COLLECTION_NAME)
        .updateOne(
          { id: cursusUser.id },
          { $set: cursusUser },
          { upsert: true },
        ),
    ),
  );

  await mongoClient
    .db()
    .collection('log')
    .updateOne(
      { name: COLLECTION_NAME },
      { $set: { name: COLLECTION_NAME, updatedAt: end } },
      { upsert: true },
    );
};
