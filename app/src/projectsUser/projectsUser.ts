import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import { getStudentIds } from '#lambda/cursusUser/cursusUser.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import {
  PROJECTS_USER_EP,
  ProjectsUser,
  parseProjectsUsers,
} from '#lambda/projectsUser/api/projectsUser.api.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const PROJECTS_USER_COLLECTION = 'projects_users';

// eslint-disable-next-line
export class ProjectsUserUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 갱신 된 팀
   *
   * 2023-05 기준
   * 필요 요청 수: U(1 ~ 4)
   * 예상 소요 시간: 3 ~ 6초
   *
   * 생기거나 / 바뀌거나 / 끝나는 팀이 100개가 넘을 때 마다 한번씩 더 요청을 보내야 함.
   * 이그잼이 있는 날에는 요청 수가 증가할 가능성이 높음.
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
    const projectsUserDtos = await fetchAllPages(
      PROJECTS_USER_EP.UPDATED(start, end),
    );

    return parseProjectsUsers(projectsUserDtos);
  }
}
