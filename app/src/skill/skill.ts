import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import { SKILL_EP, Skill, parseSkills } from '#lambda/skill/api/skill.api.js';
import {
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
  static async update(mongo: LambdaMongo): Promise<void> {
    await SkillUpdator.updateUpdated(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(SKILL_COLLECTION);
    const end = new Date();

    const updated = await SkillUpdator.fetchUpdated(start, end);

    await mongo.upsertManyById(SKILL_COLLECTION, updated);
    await mongo.setCollectionUpdatedAt(SKILL_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchUpdated(start: Date, end: Date): Promise<Skill[]> {
    const skillDtos = await fetchAllPages(SKILL_EP.UPDATED(start, end));

    return parseSkills(skillDtos);
  }
}
