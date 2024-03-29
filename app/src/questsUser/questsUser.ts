import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import {
  QUESTS_USER_API,
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
    await mongo.withCollectionUpdatedAt({
      end,
      collection: QUESTS_USER_COLLECTION,
      callback: async (start, end) => {
        const updated = await QuestsUserUpdator.fetchUpdated(start, end);

        await mongo.upsertManyById(QUESTS_USER_COLLECTION, updated);
      },
    });
  }

  @FetchApiAction
  private static async fetchUpdated(
    start: Date,
    end: Date,
  ): Promise<QuestsUser[]> {
    const questsUserDtos = await fetchAllPages(
      QUESTS_USER_API.UPDATED(start, end),
    );

    return parseQuestsUsers(questsUserDtos);
  }
}
