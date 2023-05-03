import { MongoClient } from 'mongodb';
import {
  getCollectionUpdatedAt,
  setCollectionUpdatedAt,
  upsertManyById,
} from '../mongodb/mongodb.js';
import { hsetCacheManyById, RedisClient } from '../redis/redis.js';
import { assertParseSuccess, LambdaError, logError } from '../util/error.js';
import { pagedRequest } from '../util/pagedRequest.js';
import {
  CURSUS_USER_EP,
  isStudent,
  parseFromDto,
} from './api/cursusUser.api.js';
import { CURSUS_USERS_CACHE_KEY } from './dto/cursusUser.redis.js';

const CURSUS_USERS_COLLECTION = 'cursus_users';

/**
 *
 * @description
 * U: 새로 입과하거나 블랙홀 간 유저 수
 * A: 현재 활성화 된 유저 수
 *
 * 2023-05 기준
 * 필요 요청 수: U(4) + A(18)
 * 예상 소요 시간: 30초 ~ 40초
 *
 * U 의 경우, 한번에 들어온 유저 수와 업데이트 간격 사이에 블랙홀 간 사람 수의 합이 400을 넘지 않으면
 * 불변함.
 *
 * A 의 경우, 시간이 지날수록 선형적으로 증가하겠지만 당분간은 크게 문제 없음. 추후 이 부분이 커지면
 * 멤버들을 따로, 더 긴 간격으로 업데이트 하는 방법이 있음.
 */
export const updateCursusUser = async (
  mongoClient: MongoClient,
  redisClient: RedisClient,
): Promise<void> => {
  try {
    try {
      await updateCursusChanged(mongoClient, redisClient);
    } catch (e) {
      if (e instanceof LambdaError) {
        await logError(mongoClient, e);
      }
    }

    try {
      await updateActivated(mongoClient, redisClient);
    } catch (e) {
      if (e instanceof LambdaError) {
        await logError(mongoClient, e);
      }
    }
  } catch {
    console.error('exception occurred');
  }
};

/**
 *
 * @description
 * 새로 입과하거나 블랙홀 간 사람, 과정 중단을 신청한 사람들을 업데이트 하는 로직
 */
const updateCursusChanged = async (
  mongoClient: MongoClient,
  redisClient: RedisClient,
): Promise<void> => {
  const start = await getCollectionUpdatedAt(
    mongoClient,
    CURSUS_USERS_COLLECTION,
  );

  const end = new Date();

  const cursusUserDto = await pagedRequest(
    CURSUS_USER_EP.CURSUS_CHANGED(start, end),
    100,
    4,
  );

  const cursusUsersParsed = parseFromDto(cursusUserDto);
  assertParseSuccess(cursusUsersParsed);

  await upsertManyById(
    mongoClient,
    CURSUS_USERS_COLLECTION,
    cursusUsersParsed.data,
  );

  await setCollectionUpdatedAt(mongoClient, CURSUS_USERS_COLLECTION, end);
  await hsetCacheManyById(
    redisClient,
    CURSUS_USERS_CACHE_KEY.USER_HASH,
    cursusUsersParsed.data.filter(isStudent),
  );
};

/**
 *
 * @description 실제로 정보가 바뀔 가능성이 있는 사람들을 업데이트 하는 로직
 */
const updateActivated = async (
  mongoClient: MongoClient,
  redisClient: RedisClient,
): Promise<void> => {
  const cursusUserDto = await pagedRequest(CURSUS_USER_EP.ACTIVATED(), 100, 6);

  const cursusUsersParsed = parseFromDto(cursusUserDto);
  assertParseSuccess(cursusUsersParsed);

  await upsertManyById(
    mongoClient,
    CURSUS_USERS_COLLECTION,
    cursusUsersParsed.data,
  );

  await hsetCacheManyById(
    redisClient,
    CURSUS_USERS_CACHE_KEY.USER_HASH,
    cursusUsersParsed.data.filter(isStudent),
  );
};
