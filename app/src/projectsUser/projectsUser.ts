import { FT_CURSUS_ID } from '../cursusUser/api/cursusUser.api.js';
import { getStudentIds } from '../cursusUser/cursusUser.js';
import { LambdaMongo } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../request/pagedRequest.js';
import {
  PROJECTS_USER_EP,
  ProjectsUser,
  parseProjectsUsers,
} from './api/projectsUser.api.js';

export const PROJECTS_USER_COLLECTION = 'projects_users';

// eslint-disable-next-line
export class ProjectsUserUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 갱신 된 팀
   *
   * 2023-05 기준
   * 필요 요청 수: U(2 ~ 4)
   * 예상 소요 시간: 3 ~ 6초
   *
   * 마지막으로 갱신했던 때로부터 팀이 생기거나 / 바뀌거나 / 끝나는 팀이 400개 이상이 아닌 이상 괜찮음.
   * 피신 기간이나 이그잼이 있는 날에는 요청 수가 증가할 가능성이 높음.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await ProjectsUserUpdator.updateUpdated(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(PROJECTS_USER_COLLECTION);
    const end = new Date();

    const updated = await ProjectsUserUpdator.fetchUpdated(start, end);
    const studentIds = await getStudentIds(mongo);

    const validUpdated = updated.filter(
      (projectsUser) =>
        studentIds.find((id) => id === projectsUser.user.id) &&
        projectsUser.cursusIds[0] === FT_CURSUS_ID,
    );

    await mongo.upsertManyById(PROJECTS_USER_COLLECTION, validUpdated);
    await mongo.setCollectionUpdatedAt(PROJECTS_USER_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchUpdated(
    start: Date,
    end: Date,
  ): Promise<ProjectsUser[]> {
    const projectsUserDtos = await pagedRequest(
      PROJECTS_USER_EP.UPDATED(start, end),
      100,
      2,
    );

    return parseProjectsUsers(projectsUserDtos);
  }
}
