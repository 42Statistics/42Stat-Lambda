import {
  COALITIONS_USER_API,
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
   * 예상 소요 시간: 2초 | 6초
   *
   * 신규 기수가 입과하는 날에만 3번 (300명 기준) 의 요청이 필요함. 평소에는 한번으로 충분함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await CoalitionsUserUpdator.updateCreated(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateCreated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: COALITIONS_USER_COLLECTION,
      callback: async (start, end) => {
        const created = await CoalitionsUserUpdator.fetchCreated(start, end);

        await mongo.upsertManyById(COALITIONS_USER_COLLECTION, created);
      },
    });
  }

  @FetchApiAction
  private static async fetchCreated(
    start: Date,
    end: Date,
  ): Promise<CoalitionsUser[]> {
    const coalitionsUserDtos = await fetchAllPages(
      COALITIONS_USER_API.CREATED(start, end),
    );

    return parseCoalitionsUsers(coalitionsUserDtos);
  }
}
