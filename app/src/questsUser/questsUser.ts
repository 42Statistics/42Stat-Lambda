import { LambdaMongo } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../request/pagedRequest.js';
import {
  QUESTS_USER_EP,
  QuestsUser,
  parseQuestsUsers,
} from './api/questsUser.api.js';

export const QUESTS_USER_COLLECTION = 'quests_users';

// eslint-disable-next-line
export class QuestsUserUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 새로 달성되거나 블랙홀로 끝난 퀘스트
   *
   * 2023-05 기준
   * 필요 요청 수: U(2)
   * 예상 소요 시간: 5초
   *
   * 한번에 100개 이상의 quests user 가 생기거나 변하지 않는 이상 불변함.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await QuestsUserUpdator.updateUpdated(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(QUESTS_USER_COLLECTION);

    const end = new Date();

    const updated = await QuestsUserUpdator.fetchUpdated(start, end);
    const wildcard = await QuestsUserUpdator.fetchWildcard(start, end);

    await mongo.upsertManyById(QUESTS_USER_COLLECTION, [
      ...updated,
      ...wildcard,
    ]);

    await mongo.setCollectionUpdatedAt(QUESTS_USER_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchUpdated(
    start: Date,
    end: Date,
  ): Promise<QuestsUser[]> {
    const questsUserDtos = await pagedRequest(
      QUESTS_USER_EP.UPDATED(start, end),
      100,
      1,
    );

    return parseQuestsUsers(questsUserDtos);
  }

  @FetchApiAction
  private static async fetchWildcard(
    start: Date,
    end: Date,
  ): Promise<QuestsUser[]> {
    const questsUserDtos = await pagedRequest(
      QUESTS_USER_EP.WILDCARD(start, end),
      100,
      1,
    );

    return parseQuestsUsers(questsUserDtos);
  }
}
