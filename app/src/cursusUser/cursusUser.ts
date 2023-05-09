import { MongoClient } from 'mongodb';
import {
  getCollectionUpdatedAt,
  setCollectionUpdatedAt,
  upsertManyById,
} from '../mongodb/mongodb.js';
import { LambdaRedis } from '../redis/LambdaRedis.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import {
  CURSUS_USER_EP,
  CursusUser,
  isStudent,
  parseCursusUsers,
  wildcardUserIds,
} from './api/cursusUser.api.js';
import { CURSUS_USERS_CACHE_KEY } from './dto/cursusUser.redis.js';

const CURSUS_USERS_COLLECTION = 'cursus_users';

// eslint-disable-next-line
export class CursusUserUpdator {
  /**
   *
   * @description
   * @see updateCursusChanged   U: 새로 입과하거나 블랙홀 간 유저
   * @see updateActivated       A: 현재 활성화 된 유저
   *
   * 2023-05 기준
   * 필요 요청 수: U(4) + A(20)
   * 예상 소요 시간: 30초 ~ 40초
   *
   * U 의 경우, 한번에 들어온 유저 수와 업데이트 간격 사이에 블랙홀 간 사람 수의 합이 400을 넘지 않으면
   * 불변함.
   *
   * A 의 경우, 시간이 지날수록 선형적으로 증가하겠지만 당분간은 크게 문제 없음. 추후 이 부분이 커지면
   * 멤버들을 따로, 더 긴 간격으로 업데이트 하는 방법이 있음.
   */
  static async update(
    mongoClient: MongoClient,
    redis: LambdaRedis,
  ): Promise<void> {
    await this.updateCursusChanged(mongoClient);
    await this.updateActivated(mongoClient);
    await this.updateCache(mongoClient, redis);
  }

  /**
   *
   * @description
   * 새로 입과하거나 블랙홀 간 사람, 과정 중단을 신청한 사람들을 업데이트 하는 로직
   */
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateCursusChanged(
    mongoClient: MongoClient,
  ): Promise<void> {
    const start = await getCollectionUpdatedAt(
      mongoClient,
      CURSUS_USERS_COLLECTION,
    );

    const end = new Date();

    const cursusChanged = await this.fetchCursusChanged(start, end);

    await upsertManyById(mongoClient, CURSUS_USERS_COLLECTION, cursusChanged);
    await setCollectionUpdatedAt(mongoClient, CURSUS_USERS_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchCursusChanged(
    start: Date,
    end: Date,
  ): Promise<CursusUser[]> {
    const cursusUserDto = await pagedRequest(
      CURSUS_USER_EP.CURSUS_CHANGED(start, end),
      100,
      4,
    );

    return parseCursusUsers(cursusUserDto).filter(isStudent);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateActivated(
    mongoClient: MongoClient,
  ): Promise<void> {
    const activated = await this.fetchActivated();

    await upsertManyById(mongoClient, CURSUS_USERS_COLLECTION, activated);
  }

  /**
   *
   * @description 실제로 정보가 바뀔 가능성이 있는 사람들을 업데이트 하는 로직
   */
  @FetchApiAction
  private static async fetchActivated(): Promise<CursusUser[]> {
    const cursusUserDtos = await pagedRequest(
      CURSUS_USER_EP.ACTIVATED(),
      100,
      10,
    );

    return parseCursusUsers(cursusUserDtos).filter(isStudent);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateCache(
    mongoClient: MongoClient,
    redis: LambdaRedis,
  ): Promise<void> {
    const cursusUsers = await mongoClient
      .db()
      .collection<CursusUser>(CURSUS_USERS_COLLECTION)
      .find()
      .toArray();

    await redis.replaceHashDatasWithId(
      CURSUS_USERS_CACHE_KEY.USER_HASH,
      cursusUsers,
    );
  }
}

export const getStudentIds = async (
  mongoClient: MongoClient,
): Promise<number[]> => {
  const ids = await mongoClient
    .db()
    .collection<CursusUser>(CURSUS_USERS_COLLECTION)
    .find()
    .project<{ id: number }>({ _id: 0, id: '$user.id' })
    .map((docs) => docs.id)
    .toArray();

  ids.push(...wildcardUserIds);

  return ids;
};
