import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import {
  PROJECT_EP,
  Project,
  parseProjects,
} from '#lambda/project/api/project.api.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const ORIGINAL_PROJECT_COLLECTION = 'original_projects';
export const PROJECT_COLLECTION = 'projects';

// eslint-disable-next-line
export class ProjectUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 새로 생기거나 갱신된 project
   *
   * 2023-05 기준
   * 필요 요청 수: U(1)
   * 예상 소요 시간: 3초
   *
   * project 가 한번에 대량 생성 / 변경되지 않는 이상 불변함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await ProjectUpdator.updateUpdated(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: PROJECT_COLLECTION,
      callback: async (start, end) => {
        await ProjectUpdator.fetchUpdated(start, end);

        const updated = await ProjectUpdator.fetchUpdated(start, end);

        await mongo.upsertManyById(ORIGINAL_PROJECT_COLLECTION, updated);
        await mongo.upsertManyById(PROJECT_COLLECTION, updated);
      },
    });
  }

  @FetchApiAction
  private static async fetchUpdated(
    start: Date,
    end: Date,
  ): Promise<Project[]> {
    const projectDtos = await fetchAllPages(
      PROJECT_EP.UPDATED(start, end),
      1,
      30,
    );

    return parseProjects(projectDtos);
  }
}
