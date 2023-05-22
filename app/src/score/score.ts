import { MongoClient } from 'mongodb';
import { upsertManyById } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequestByCount } from '../util/pagedRequestByCount.js';
import {
  SCORE_EP,
  Score,
  parseScores,
  targetCoalitionIds,
} from './api/score.api.js';

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
   * 필요 요청 수: C(4 ~ 8)
   * 예상 소요 시간: 5 ~ 10초
   *
   * coalition 별로 한번씩 요청을 보내보아야 하지만, 체육대회 등의 행사가 있어 모든 coalition user
   * 에게 score 가 지급되는게 아니면, 확인용 요청 (1) + 받아오는 요청 (1) 으로 불변함.
   *
   * 추후 ```pagedRequestByCount``` 가 확인용 요청과 받아오는 요청을 구분하지
   * 않게 로직이 개선되면 절반으로 줄일 수 있음.
   */
  static async update(mongoClient: MongoClient): Promise<void> {
    await ScoreUpdator.updateByCoalition(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateByCoalition(
    mongoClient: MongoClient,
  ): Promise<void> {
    const coalitionScoreCounts = await mongoClient
      .db()
      .collection(SCORE_COLLECTION)
      .aggregate<CountByCoalitionId>([
        {
          $match: {
            coalitionId: { $in: targetCoalitionIds },
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
      targetCoalitionIds.map((coalitionId) => ({
        coalitionId: coalitionId,
        count:
          coalitionScoreCounts.find(
            (coalitoinScoreCount) =>
              coalitoinScoreCount.coalitionId === coalitionId,
          )?.count ?? 0,
      })),
    );

    await upsertManyById(mongoClient, SCORE_COLLECTION, byCoalition);
  }

  @FetchApiAction
  private static async fetchScoreByCoalition(
    coalitionScoreCounts: CountByCoalitionId[],
  ): Promise<Score[]> {
    const scoreDtos: object[] = [];

    for (const { coalitionId, count } of coalitionScoreCounts) {
      const currDtos = await pagedRequestByCount(
        new URL(SCORE_EP.BY_COALITION(coalitionId)),
        count,
      );

      scoreDtos.push(...currDtos);
    }

    return parseScores(scoreDtos);
  }
}
