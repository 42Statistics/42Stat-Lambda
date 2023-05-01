import { MongoClient } from 'mongodb';
import { RedisClient } from '../connection.js';
import {
  getCollectionUpdatedAt,
  setCollectionUpdatedAt,
  upsertManyById,
} from '../mongodb/mongodb.js';
import { logError } from '../util/logError.js';
import { pagedRequest } from '../util/pagedRequest.js';
import { cursusUserSchema, CURSUS_USER_EP } from './api/cursusUser.api.js';

const CURSUS_USERS_COLLECTION = 'cursus_users';

export const updateCursusUser = async (
  mongoClient: MongoClient,
  redisClient: RedisClient,
): Promise<void | never> => {
  const start = await getCollectionUpdatedAt(
    mongoClient,
    CURSUS_USERS_COLLECTION,
  );

  const end = new Date();

  const cursusUserDto = await pagedRequest(
    mongoClient,
    CURSUS_USER_EP(start, end),
  );

  const cursusUsers = cursusUserSchema.array().safeParse(cursusUserDto);

  if (!cursusUsers.success) {
    await logError(mongoClient, cursusUsers.error.errors);
    throw Error();
  }

  await upsertManyById(mongoClient, CURSUS_USERS_COLLECTION, cursusUsers.data);
  await setCollectionUpdatedAt(mongoClient, CURSUS_USERS_COLLECTION, end);
};
