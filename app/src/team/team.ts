import { CampusUserUpdator } from '#lambda/campusUser/campusUser.js';
import { HYULIM } from '#lambda/cursusUser/api/cursusUser.api.js';
import { getStudentIds } from '#lambda/cursusUser/cursusUser.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { ProjectsUserUpdator } from '#lambda/projectsUser/projectsUser.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import { fetchByIds } from '#lambda/request/fetchByIds.js';
import {
  TEAM_API,
  TEAM_EP,
  Team,
  parseTeams,
} from '#lambda/team/api/team.api.js';
import {
  At_10_Action,
  At_20_Action,
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';
import { hasId } from '#lambda/util/hasId.js';

export const TEAM_COLLECTION = 'teams';

// eslint-disable-next-line
export class TeamUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 갱신 된 팀
   * @see pruneDeleted    D: 삭제 된 팀
   * @see updateGiveUps   G: giveup 한 팀
   *
   * 2023-05 기준
   * 필요 요청 수:
   *  - 매 실행: U(1)
   *  - 한시간에 한번: D(18 ~), G(10 ~)
   * 예상 소요 시간: 3초 + 60초 ~
   *
   * U: team 이 100개 이상 생기거나 갱신될 때 마다 요청을 한번씩 더 보내야 함.
   *
   * D: in_progress 인 team 이 증가할수록 선형적으로 증가함.
   *
   * G: waiting_for_correction 인 team 이 증가할수록 선형적으로 증가함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await TeamUpdator.updateUpdated(mongo, end);

    await TeamUpdator.deleteUnregistered(mongo);
    await TeamUpdator.updateGiveUps(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: TEAM_COLLECTION,
      callback: async (start, end) => {
        const studentIds = await getStudentIds(mongo);
        const transferIds = CampusUserUpdator.getTransferIds();

        const updated = await TeamUpdator.fetchUpdated(start, end).then(
          (teams) =>
            teams.filter(
              ({ users }) =>
                users.find((user) => hasId([...studentIds, HYULIM], user.id)) &&
                users.find((user) => hasId(transferIds, user.id)) === undefined,
            ),
        );

        await mongo.upsertManyById(TEAM_COLLECTION, updated);
      },
    });
  }

  @FetchApiAction
  private static async fetchUpdated(start: Date, end: Date): Promise<Team[]> {
    const teamDtos = await fetchAllPages(TEAM_API.UPDATED(start, end));

    return parseTeams(teamDtos);
  }

  @At_10_Action
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async deleteUnregistered(mongo: LambdaMongo): Promise<void> {
    const teamIds = await mongo
      .db()
      .collection(TEAM_COLLECTION)
      .find<Team>({ status: 'in_progress' })
      .map((doc) => doc.id)
      .toArray();

    const targetTeams = await this.fetchTeamsByIds(teamIds);
    const targetTeamIds = teamIds.filter(
      (id) => targetTeams.find((team) => team.id === id) === undefined,
    );

    if (!targetTeamIds.length) {
      return;
    }

    await mongo.pruneMany(TEAM_COLLECTION, { id: { $in: targetTeamIds } });
  }

  @At_20_Action
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateGiveUps(mongo: LambdaMongo): Promise<void> {
    const prevState: Team['status'] = 'waiting_for_correction';

    const teamIds = await mongo
      .db()
      .collection(TEAM_COLLECTION)
      .find<Team>({ status: prevState })
      .map((doc) => doc.id)
      .toArray();

    const updatedTeams = await this.fetchTeamsByIds(teamIds);
    const statusChangedTeams = updatedTeams.filter(
      (team) => team.status !== prevState,
    );

    await mongo.upsertManyById(TEAM_COLLECTION, statusChangedTeams);

    await ProjectsUserUpdator.updateGiveUpsByTeamIds(
      mongo,
      statusChangedTeams.map(({ id }) => id),
    );
  }

  @FetchApiAction
  private static async fetchTeamsByIds(ids: number[]): Promise<Team[]> {
    const teamDtos = await fetchByIds(TEAM_EP, ids);

    return parseTeams(teamDtos);
  }
}
