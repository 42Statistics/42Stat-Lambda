import { MongoClient } from 'mongodb';
import {
  CursusUser,
  wildcardUserIds,
} from '../cursusUser/api/cursusUser.api.js';
import { CURSUS_USERS_COLLECTION } from '../cursusUser/cursusUser.js';
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
import { TEAM_EP, Team_, parseTeams } from './api/team.api.js';

const TEAM_COLLECTION = 'teams';

// eslint-disable-next-line
export class TeamUpdator {
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateUpdated(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongoClient: MongoClient): Promise<void> {
    const start = await getCollectionUpdatedAt(mongoClient, TEAM_COLLECTION);
    const end = new Date();

    const updated = await this.fetchUpdated(start, end);

    const studentIds = await mongoClient
      .db()
      .collection<CursusUser>(CURSUS_USERS_COLLECTION)
      .find()
      .project<{ id: number }>({ _id: 0, id: 1 })
      .map((doc) => doc.id)
      .toArray();

    studentIds.push(...wildcardUserIds);

    const updatedStudentTeams = updated.filter((team) =>
      studentIds.find((id) => id === team.users[0].id),
    );

    await upsertManyById(mongoClient, TEAM_COLLECTION, updatedStudentTeams);
    await setCollectionUpdatedAt(mongoClient, TEAM_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchUpdated(start: Date, end: Date): Promise<Team_[]> {
    const teamDtos = await pagedRequest(TEAM_EP.UPDATED(start, end), 100, 10);

    return parseTeams(teamDtos);
  }
}
