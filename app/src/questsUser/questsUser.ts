import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import {
  QUESTS_USER_EP,
  QuestsUser,
  parseQuestsUsers,
} from '#lambda/questsUser/api/questsUser.api.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const QUESTS_USER_COLLECTION = 'quests_users';

// eslint-disable-next-line
export class QuestsUserUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 새로 달성되거나 블랙홀로 끝난 퀘스트
   *
   * 2023-05 기준
   * 필요 요청 수: U(1 | 4)
   * 예상 소요 시간: 3 | 8초
   *
   * 생기거나 갱신되는 quests user 가 100명을 넘어갈 때 마다 하나씩 요청을 더 보내야 함.
   * 신규 기수 입과일이 아니면 한번으로 충분함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await QuestsUserUpdator.updateUpdated(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(QUESTS_USER_COLLECTION);

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
    const questsUserDtos = await fetchAllPages(
      QUESTS_USER_EP.UPDATED(start, end),
    );

    return parseQuestsUsers(questsUserDtos);
  }

  @FetchApiAction
  private static async fetchWildcard(
    start: Date,
    end: Date,
  ): Promise<QuestsUser[]> {
    const questsUserDtos = await fetchAllPages(
      QUESTS_USER_EP.WILDCARD(start, end),
    );

    return parseQuestsUsers(questsUserDtos);
  }
}
