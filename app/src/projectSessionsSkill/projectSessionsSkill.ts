import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import {
  PROJECT_SESSIONS_SKILL_EP,
  ProjectSessionsSkill,
  parseProjectSessionsSkills,
} from '#lambda/projectSessionsSkill/api/projectSessionsSkill.api.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const PROJECT_SESSIONS_SKILL_COLLECTION = 'project_sessions_skills';

// eslint-disable-next-line
export class ProjectSessionsSkillUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 새로 생기거나 갱신된 session skill
   *
   * 2023-05 기준
   * 필요 요청 수: U(1)
   * 예상 소요 시간: 3초
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await ProjectSessionsSkillUpdator.updateUpdated(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(
      PROJECT_SESSIONS_SKILL_COLLECTION,
    );

    const updated = await ProjectSessionsSkillUpdator.fetchUpdated(start, end);

    await mongo.upsertManyById(PROJECT_SESSIONS_SKILL_COLLECTION, updated);
    await mongo.setCollectionUpdatedAt(PROJECT_SESSIONS_SKILL_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchUpdated(
    start: Date,
    end: Date,
  ): Promise<ProjectSessionsSkill[]> {
    const projectSessionsSkillDtos = await fetchAllPages(
      PROJECT_SESSIONS_SKILL_EP.UPDATED(start, end),
    );

    return parseProjectSessionsSkills(projectSessionsSkillDtos);
  }
}
