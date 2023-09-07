import { SEOUL_COALITION_IDS } from '#lambda/coalition/api/coalition.api.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  SCORE_EDGE_CASE,
  SCORE_API,
  Score,
  parseScores,
} from '#lambda/score/api/score.api.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const SCORE_COLLECTION = 'scores';

type CountByCoalitionId = {
  coalitionId: number;
  count: number;
};

// eslint-disable-next-line
export class ScoreUpdator {
  /**
   *
   * @description
   * @see updateByCoalition   C: 코알리숑 별 얻은 score
   *
   * 2023-05 기준
   * 필요 요청 수: C(4 | 8)
   * 예상 소요 시간: 5 ~ 10초
   *
   * coalition 별로 한번씩 요청을 보내보아야 하지만, 체육대회 등의 행사가 있어 모든 coalition user
   * 에게 score 가 지급되는게 아니면, 각 한번으로 충분함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await ScoreUpdator.updateByCoalition(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateByCoalition(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    const coalitionScoreCounts = await mongo
      .db()
      .collection(SCORE_COLLECTION)
      .aggregate<CountByCoalitionId>([
        {
          $match: {
            coalitionId: { $in: SEOUL_COALITION_IDS },
            ...SCORE_EDGE_CASE.COUNT_FILTER,
          },
        },
        {
          $group: {
            _id: '$coalitionId',
            count: { $count: {} },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            coalitionId: '$_id',
            count: 1,
          },
        },
      ])
      .toArray();

    const byCoalition = await ScoreUpdator.fetchScoreByCoalition(
      SEOUL_COALITION_IDS.map((coalitionId) => ({
        coalitionId: coalitionId,
        count:
          (coalitionScoreCounts.find(
            (coalitoinScoreCount) =>
              coalitoinScoreCount.coalitionId === coalitionId,
          )?.count ?? 0) + SCORE_EDGE_CASE.COUNT_HINT(coalitionId),
      })),
      end,
    );

    await mongo.upsertManyById(SCORE_COLLECTION, byCoalition);
  }

  @FetchApiAction
  private static async fetchScoreByCoalition(
    coalitionScoreCounts: CountByCoalitionId[],
    end: Date,
  ): Promise<Score[]> {
    const scoreDtos: object[] = [];

    for (const { coalitionId, count } of coalitionScoreCounts) {
      const currDtos = await fetchAllPages(
        new URL(SCORE_API.BY_COALITION(coalitionId)),
        Math.floor(count / 100) + 1,
      );

      scoreDtos.push(...currDtos);
    }

    return parseScores(scoreDtos).filter(
      (score) =>
        SCORE_EDGE_CASE.IS_GOOD_IDS(score) &&
        score.createdAt.getTime() < end.getTime(),
    );
  }
}
