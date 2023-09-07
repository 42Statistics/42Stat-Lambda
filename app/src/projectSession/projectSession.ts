import type { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import {
  PROJECT_SESSION_API,
  ProjectSession,
  parseProjectSessions,
} from '#lambda/projectSession/api/projectSessions.api.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const PROJECT_SESSION_COLLECTION = 'project_sessions';

// eslint-disable-next-line
export class ProjectSessionUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 새로 생기거나 갱신 된 세션
   *
   * 2023-05 기준
   * 필요 요청 수: U(1)
   * 예상 소요 시간: 3초
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await ProjectSessionUpdator.updateUpdated(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: PROJECT_SESSION_COLLECTION,
      callback: async (start, end) => {
        const updated = await ProjectSessionUpdator.fetchUpdated(start, end);

        await mongo.upsertManyById(PROJECT_SESSION_COLLECTION, updated);
      },
    });
  }

  @FetchApiAction
  private static async fetchUpdated(
    start: Date,
    end: Date,
  ): Promise<ProjectSession[]> {
    const projectSessionDtos = await fetchAllPages(
      PROJECT_SESSION_API.UPDATED(start, end),
    );

    return parseProjectSessions(projectSessionDtos);
  }
}
