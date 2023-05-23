import { ExperienceUpdator } from '../experience/experience.js';
import { LambdaMongo } from '../mongodb/mongodb.js';
import { LambdaRedis } from '../redis/LambdaRedis.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import { singleRequest } from '../util/requestSingle.js';
import {
  CURSUS_USER_EP,
  CursusUser,
  isStudent,
  parseCursusUsers,
  wildcardUserIds,
} from './api/cursusUser.api.js';
import { CURSUS_USERS_CACHE_KEY } from './dto/cursusUser.redis.js';

export const CURSUS_USER_COLLECTION = 'cursus_users';

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
  static async update(mongo: LambdaMongo, redis: LambdaRedis): Promise<void> {
    await CursusUserUpdator.updateCursusChanged(mongo);
    await CursusUserUpdator.updateActivated(mongo);
    await CursusUserUpdator.updateCache(mongo, redis);
  }

  /**
   *
   * @description
   * 새로 입과하거나 블랙홀 간 사람, 과정 중단을 신청한 사람들을 업데이트 하는 로직
   */
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateCursusChanged(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(CURSUS_USER_COLLECTION);
    const end = new Date();

    const cursusChanged = await CursusUserUpdator.fetchCursusChanged(
      start,
      end,
    );

    await mongo.upsertManyById(CURSUS_USER_COLLECTION, cursusChanged);
    await mongo.setCollectionUpdatedAt(CURSUS_USER_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchCursusChanged(
    start: Date,
    end: Date,
  ): Promise<CursusUser[]> {
    const cursusUserDtos = await pagedRequest(
      CURSUS_USER_EP.CURSUS_CHANGED(start, end),
      100,
      4,
    );

    return parseCursusUsers(cursusUserDtos).filter(isStudent);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateActivated(mongo: LambdaMongo): Promise<void> {
    const activated = await CursusUserUpdator.fetchActivated();
    const wildcard = await CursusUserUpdator.fetchWildcard();

    await mongo.upsertManyById(CURSUS_USER_COLLECTION, [
      ...activated,
      ...wildcard,
    ]);

    // todo: 적당한 위치 찾아주기. 현재 시점에선 cursus user의 업데이트 성공을 알려주고 있지 않기
    // 때문에, 이런 조치가 필요합니다.
    await ExperienceUpdator.update(mongo);
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

  @FetchApiAction
  private static async fetchWildcard(): Promise<CursusUser[]> {
    const cursusUserDtos = await singleRequest<object[]>(
      CURSUS_USER_EP.WILDCARD(),
    );

    return parseCursusUsers(cursusUserDtos);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateCache(
    mongo: LambdaMongo,
    redis: LambdaRedis,
  ): Promise<void> {
    const cursusUsers = await mongo
      .db()
      .collection<CursusUser>(CURSUS_USER_COLLECTION)
      .find()
      .toArray();

    await redis.replaceHashDatasWithId(
      CURSUS_USERS_CACHE_KEY.USER_HASH,
      cursusUsers,
    );
  }
}

export const getStudentIds = async (mongo: LambdaMongo): Promise<number[]> => {
  const ids = await mongo
    .db()
    .collection<CursusUser>(CURSUS_USER_COLLECTION)
    .find()
    .project<{ id: number }>({ _id: 0, id: '$user.id' })
    .map((docs) => docs.id)
    .toArray();

  ids.push(...wildcardUserIds);

  return ids;
};
