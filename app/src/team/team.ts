import { getStudentIds } from '#lambda/cursusUser/cursusUser.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import { TEAM_EP, Team, parseTeams } from '#lambda/team/api/team.api.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const TEAM_COLLECTION = 'teams';

// eslint-disable-next-line
export class TeamUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 갱신 된 팀
   *
   * 2023-05 기준
   * 필요 요청 수: U(1)
   * 예상 소요 시간: 3초
   *
   * team 이 100개 이상 생기거나 갱신될 때 마다 요청을 한번씩 더 보내야 함.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await TeamUpdator.updateUpdated(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(TEAM_COLLECTION);
    const end = new Date();

    const updated = await TeamUpdator.fetchUpdated(start, end);
    const studentIds = await getStudentIds(mongo);

    const updatedStudentTeams = updated.filter((team) =>
      studentIds.find((id) => id === team.users[0].id),
    );

    await mongo.upsertManyById(TEAM_COLLECTION, updatedStudentTeams);
    await mongo.setCollectionUpdatedAt(TEAM_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchUpdated(start: Date, end: Date): Promise<Team[]> {
    const teamDtos = await fetchAllPages(TEAM_EP.UPDATED(start, end));

    return parseTeams(teamDtos);
  }
}
