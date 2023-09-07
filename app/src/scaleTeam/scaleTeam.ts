import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  SCALE_TEAM_API,
  ScaleTeam,
  parseScaleTeams,
} from '#lambda/scaleTeam/api/scaleTeam.api.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const SCALE_TEAM_COLLECTION = 'scale_teams';

// eslint-disable-next-line
export class ScaleTeamUpdator {
  /**
   *
   * @description
   * @see updateFilled   F: 평가자의 comment 가 작성 완료된 평가
   *
   * 2023-05 기준
   * 필요 요청 수: F(1)
   * 예상 소요 시간: 5초
   *
   * 끝난 평가가 100개를 넘을 때 마다 요청을 한번씩 더 보내야 함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await ScaleTeamUpdator.updateFilled(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateFilled(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: SCALE_TEAM_COLLECTION,
      callback: async (start, end) => {
        const filled = await ScaleTeamUpdator.fetchFilled(start, end);

        await mongo.upsertManyById(SCALE_TEAM_COLLECTION, filled);
      },
    });
  }

  @FetchApiAction
  private static async fetchFilled(
    start: Date,
    end: Date,
  ): Promise<ScaleTeam[]> {
    const scaleTeamDtos = await fetchAllPages(
      SCALE_TEAM_API.FILLED(start, end),
    );

    return parseScaleTeams(scaleTeamDtos);
  }
}
