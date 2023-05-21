import { MongoClient } from 'mongodb';
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
import { upsertManyById } from '../mongodb/mongodb.js';

export const SCORE_COLLECTION = 'scores';

type CountByCoalitionId = {
  coalitionId: number;
  count: number;
};

// eslint-disable-next-line
export class ScoreUpdator {
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateByCoalition(mongoClient);
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

    const byCoalition = await this.fetchScoreByCoalition(
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
