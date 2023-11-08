import { SEOUL_COALITION_IDS } from '#lambda/coalition/api/coalition.api.js';
import { TIMEZONE } from '#lambda/index.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  SCORE_API,
  SCORE_EDGE_CASE,
  Score,
  parseScores,
} from '#lambda/score/api/score.api.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const SCORE_COLLECTION = 'scores';
const DAILY_SCORE_VALUES_VIEW = 'mv_daily_score_values';

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
  @UpdateAction
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: SCORE_COLLECTION,
      callback: async (start, end) => {
        await ScoreUpdator.updateByCoalition(mongo, end);
        await ScoreUpdator.updateDailyScoreValuesView(mongo, start, end);
      },
    });
  }

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

  @LogAsyncEstimatedTime
  private static async updateDailyScoreValuesView(
    mongo: LambdaMongo,
    start: Date,
    end: Date,
  ): Promise<void> {
    await mongo
      .db()
      .collection(SCORE_COLLECTION)
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
            coalitionsUserId: { $ne: null },
          },
        },
        {
          $group: {
            _id: {
              coalitionId: '$coalitionId',
              date: {
                $dateFromParts: {
                  year: {
                    $year: {
                      date: '$createdAt',
                      timezone: TIMEZONE,
                    },
                  },
                  month: {
                    $month: {
                      date: '$createdAt',
                      timezone: TIMEZONE,
                    },
                  },
                  day: {
                    $dayOfMonth: {
                      date: '$createdAt',
                      timezone: TIMEZONE,
                    },
                  },
                  timezone: TIMEZONE,
                },
              },
            },
            value: { $sum: '$value' },
          },
        },
        {
          $project: {
            _id: 0,
            coalitionId: '$_id.coalitionId',
            date: '$_id.date',
            value: 1,
          },
        },
        {
          $sort: {
            date: 1,
            coalitionId: 1,
          },
        },
        {
          $merge: {
            into: DAILY_SCORE_VALUES_VIEW,
            on: ['date', 'coalitionId'],
            whenMatched: [
              {
                $set: {
                  value: {
                    $sum: ['$value', '$$new.value'],
                  },
                },
              },
            ],
            whenNotMatched: 'insert',
          },
        },
      ])
      .toArray();
  }
}
