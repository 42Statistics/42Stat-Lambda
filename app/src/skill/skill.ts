import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import { SKILL_API, Skill, parseSkills } from '#lambda/skill/api/skill.api.js';
import {
  At_00_Action,
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const SKILL_COLLECTION = 'skills';

// eslint-disable-next-line
export class SkillUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 새로 생기거나 갱신된 skill
   *
   * 2023-05기준
   * 필요 요청 수: U(1)
   * 예상 소요 시간: 3초
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await SkillUpdator.updateUpdated(mongo, end);
  }

  @At_00_Action
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: SKILL_COLLECTION,
      callback: async (start, end) => {
        const updated = await SkillUpdator.fetchUpdated(start, end);

        await mongo.upsertManyById(SKILL_COLLECTION, updated);
      },
    });
  }

  @FetchApiAction
  private static async fetchUpdated(start: Date, end: Date): Promise<Skill[]> {
    const skillDtos = await fetchAllPages(SKILL_API.UPDATED(start, end));

    return parseSkills(skillDtos);
  }
}
