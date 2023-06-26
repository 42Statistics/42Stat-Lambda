import {
  CURSUS_USER_EP,
  CursusUser,
  isStudent,
  parseCursusUsers,
  wildcardUserIds,
} from '#lambda/cursusUser/api/cursusUser.api.js';
import { ExperienceUpdator } from '#lambda/experience/experience.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

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
   * 필요 요청 수: U(1 | 4) + A(11 + n)
   * 예상 소요 시간: 20초 + n
   *
   * U 의 경우, 한번에 들어온 유저 수와 블랙홀 간 사람 수가 100명을 넘을때마다 하나씩 요청을 더 보내야 함.
   * 평소엔 한번의 요청으로 충분하나, 신규 기수가 들어오는 날은 4번 정도 필요할 것으로 예상.
   *
   * A 의 경우, 시간이 지날수록 선형적으로 증가하겠지만 당분간은 크게 문제 없음. 추후 이 부분이 커지면
   * 멤버들을 따로, 더 긴 간격으로 업데이트 하는 방법이 있음.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await CursusUserUpdator.updateCursusChanged(mongo, end);
    await CursusUserUpdator.updateActivated(mongo);
  }

  /**
   *
   * @description
   * 새로 입과하거나 블랙홀 간 사람, 과정 중단을 신청한 사람들을 업데이트 하는 로직
   */
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateCursusChanged(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(CURSUS_USER_COLLECTION);

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
    const cursusUserDtos = await fetchAllPages(
      CURSUS_USER_EP.CURSUS_CHANGED(start, end),
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
   * @description
   * 실제로 정보가 바뀔 가능성이 있는 사람들의 정보를 가져오는 함수 입니다. 반환 시 실제 학생 계정들만
   * 남깁니다.
   */
  @FetchApiAction
  private static async fetchActivated(): Promise<CursusUser[]> {
    const cursusUserDtos = await fetchAllPages(CURSUS_USER_EP.ACTIVATED());

    return parseCursusUsers(cursusUserDtos).filter(isStudent);
  }

  @FetchApiAction
  private static async fetchWildcard(): Promise<CursusUser[]> {
    const cursusUserDtos = await fetchAllPages(CURSUS_USER_EP.WILDCARD());

    return parseCursusUsers(cursusUserDtos);
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
