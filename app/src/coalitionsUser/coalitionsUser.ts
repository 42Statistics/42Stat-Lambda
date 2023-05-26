import {
  COALITIONS_USER_EP,
  CoalitionsUser,
  parseCoalitionsUsers,
} from '#lambda/coalitionsUser/api/coalitionsUser.api.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const COALITIONS_USER_COLLECTION = 'coalitions_users';

// eslint-disable-next-line
export class CoalitionsUserUpdator {
  /**
   *
   * @description
   * @see updateCreated   C: 새로 생성된 coalitions user
   *
   * 2023-05 기준
   * 필요 요청 수: C(1 | 3 ~ 4)
   * 예상 소요 시간: 3초 | 10초
   *
   * 요청을 1번 보냄으로써 새로 만들어진 사람들이 있는지 확인하고, 필요한 경우 추가로 요청을 보냅니다.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await CoalitionsUserUpdator.updateCreated(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateCreated(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(
      COALITIONS_USER_COLLECTION,
    );

    const end = new Date();

    const created = await CoalitionsUserUpdator.fetchCreated(start, end);

    await mongo.upsertManyById(COALITIONS_USER_COLLECTION, created);
    await mongo.setCollectionUpdatedAt(COALITIONS_USER_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchCreated(
    start: Date,
    end: Date,
  ): Promise<CoalitionsUser[]> {
    const coalitionsUserDtos = await fetchAllPages(
      COALITIONS_USER_EP.CREATED(start, end),
    );

    return parseCoalitionsUsers(coalitionsUserDtos);
  }
}
