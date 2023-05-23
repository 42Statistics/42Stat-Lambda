import { getStudentIds } from '../cursusUser/cursusUser.js';
import { LambdaMongo } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import { TEAM_EP, Team, parseTeams } from './api/team.api.js';

export const TEAM_COLLECTION = 'teams';

// eslint-disable-next-line
export class TeamUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 갱신 된 팀
   *
   * 2023-05 기준
   * 필요 요청 수: U(1 ~ 2)
   * 예상 소요 시간: 5초
   *
   * 마지막으로 갱신했던 때로부터 팀이 200개 이상 바뀌지 않는 이상 괜찮음.
   * 신규 기수가 입과하는 날 초과할 가능성이 있긴 한데... 이것도 한순간에 전부 레지스터해야 초과함.
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
    const teamDtos = await pagedRequest(TEAM_EP.UPDATED(start, end), 100, 2);

    return parseTeams(teamDtos);
  }
}
