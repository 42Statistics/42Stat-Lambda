import type { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';
import { USER_EP, parseUsers, type User } from './api/user.api.js';

export const USER_COLLECTION = 'users';

// eslint-disable-next-line
export class UserUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 새로 등록되거나 갱신된 유저 (직원 포함)
   *
   * 2023-07 기준
   * 필요 요청 수: U(1 | 4)
   * 예상 소요 시간: 1 | 3 초
   *
   * 한번에 들어오거나 갱신되는 유저가 수가 많지 않기 때문에, 평소에는 한번으로 충분하지만,
   * 신규 기수가 들어오는 날은 추가 요청이 필요함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await UserUpdator.updateUpdated(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt(USER_COLLECTION, async (start, end) => {
      const updated = await UserUpdator.fetchUpdated(start, end);

      await mongo.upsertManyById(USER_COLLECTION, updated);
    })(end);
  }

  @FetchApiAction
  private static async fetchUpdated(start: Date, end: Date): Promise<User[]> {
    const userDtos = await fetchAllPages(USER_EP.IS_SEOUL(start, end));

    return parseUsers(userDtos);
  }
}
