import { MongoClient } from 'mongodb';
import { FT_CURSUS_ID } from '../cursusUser/api/cursusUser.api.js';
import { getStudentIds } from '../cursusUser/cursusUser.js';
import {
  getCollectionUpdatedAt,
  setCollectionUpdatedAt,
  upsertManyById,
} from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import {
  PROJECTS_USER_EP,
  ProjectsUser,
  parseProjectsUsers,
} from './api/projectsUser.api.js';

export const PROJECTS_USER_COLLECTION = 'projects_users';

// eslint-disable-next-line
export class ProjectsUserUpdator {
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateUpdated(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongoClient: MongoClient): Promise<void> {
    const start = await getCollectionUpdatedAt(
      mongoClient,
      PROJECTS_USER_COLLECTION,
    );
    const end = new Date();

    const updated = await this.fetchUpdated(start, end);

    const studentIds = await getStudentIds(mongoClient);

    const updatedProjectsUsers = updated.filter(
      (projectsUser) =>
        studentIds.find((id) => id === projectsUser.user.id) &&
        projectsUser.cursusIds[0] === FT_CURSUS_ID,
    );

    await upsertManyById(
      mongoClient,
      PROJECTS_USER_COLLECTION,
      updatedProjectsUsers,
    );

    await setCollectionUpdatedAt(mongoClient, PROJECTS_USER_COLLECTION, end);
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
