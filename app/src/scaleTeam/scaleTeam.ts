import { TIMEZONE } from '#lambda/index.js';
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
const DAILY_USER_SCALE_TEAM_COUNTS_VIEW = 'mv_daily_user_scale_team_counts';

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
  @UpdateAction
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: SCALE_TEAM_COLLECTION,
      callback: async (start, end) => {
        await ScaleTeamUpdator.updateFilled(mongo, start, end);
        await ScaleTeamUpdator.updateDailyScaleTeamCountsView(
          mongo,
          start,
          end,
        );
      },
    });
  }

  @LogAsyncEstimatedTime
  private static async updateFilled(
    mongo: LambdaMongo,
    start: Date,
    end: Date,
  ): Promise<void> {
    const filled = await ScaleTeamUpdator.fetchFilled(start, end);

    await mongo.upsertManyById(SCALE_TEAM_COLLECTION, filled);
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

  @LogAsyncEstimatedTime
  private static async updateDailyScaleTeamCountsView(
    mongo: LambdaMongo,
    start: Date,
    end: Date,
  ): Promise<void> {
    await mongo
      .db()
      .collection(SCALE_TEAM_COLLECTION)
      .aggregate([
        {
          $match: {
            filledAt: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateFromParts: {
                  year: {
                    $year: {
                      date: '$filledAt',
                      timezone: TIMEZONE,
                    },
                  },
                  month: {
                    $month: {
                      date: '$filledAt',
                      timezone: TIMEZONE,
                    },
                  },
                  day: {
                    $dayOfMonth: {
                      date: '$filledAt',
                      timezone: TIMEZONE,
                    },
                  },
                  timezone: TIMEZONE,
                },
              },
              userId: '$corrector.id',
            },
            count: {
              $count: {},
            },
          },
        },
        {
          $sort: {
            _id: 1,
            userId: 1,
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id.date',
            userId: '$_id.userId',
            count: 1,
          },
        },
        {
          $merge: {
            into: DAILY_USER_SCALE_TEAM_COUNTS_VIEW,
            on: ['date', 'userId'],
            whenMatched: [
              {
                $set: {
                  count: {
                    $sum: ['$count', '$$new.count'],
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
