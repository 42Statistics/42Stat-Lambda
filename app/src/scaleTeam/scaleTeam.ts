import { LambdaMongo } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import {
  SCALE_TEAM_EP,
  ScaleTeam,
  parseScaleTeams,
} from './api/scaleTeam.api.js';

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
   * 한번에 100개의 평가가 끝나지 않는 이상 불변함.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await ScaleTeamUpdator.updateFilled(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateFilled(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(SCALE_TEAM_COLLECTION);

    const end = new Date();

    const filled = await ScaleTeamUpdator.fetchFilled(start, end);

    await mongo.upsertManyById(SCALE_TEAM_COLLECTION, filled);
    await mongo.setCollectionUpdatedAt(SCALE_TEAM_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchFilled(
    start: Date,
    end: Date,
  ): Promise<ScaleTeam[]> {
    const scaleTeamDtos = await pagedRequest(
      SCALE_TEAM_EP.FILLED(start, end),
      100,
      1,
    );

    return parseScaleTeams(scaleTeamDtos);
  }
}
