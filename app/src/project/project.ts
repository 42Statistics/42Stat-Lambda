import { MongoClient } from 'mongodb';
import { PROJECT_EP, Project, parseProjects } from './api/project.api.js';
import {
  getCollectionUpdatedAt,
  setCollectionUpdatedAt,
  upsertManyById,
} from '../mongodb/mongodb.js';
import { pagedRequest } from '../util/pagedRequest.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';

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
  static async update(mongoClient: MongoClient): Promise<void> {
    await ProjectUpdator.updateUpdated(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongoClient: MongoClient): Promise<void> {
    const start = await getCollectionUpdatedAt(mongoClient, PROJECT_COLLECTION);
    const end = new Date();

    await ProjectUpdator.fetchUpdated(start, end);

    const updated = await ProjectUpdator.fetchUpdated(start, end);

    await upsertManyById(mongoClient, PROJECT_COLLECTION, updated);
    await setCollectionUpdatedAt(mongoClient, PROJECT_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchUpdated(
    start: Date,
    end: Date,
  ): Promise<Project[]> {
    const projectDtos = await pagedRequest(
      PROJECT_EP.UPDATED(start, end),
      30,
      10, //1,
    );

    return parseProjects(projectDtos);
  }
}
