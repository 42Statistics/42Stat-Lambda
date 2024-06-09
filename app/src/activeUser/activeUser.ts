import { TIMEZONE } from '#lambda/index.js';
import { DAILY_LOGTIME_COLLECTION } from '#lambda/location/location.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { SCALE_TEAM_COLLECTION } from '#lambda/scaleTeam/scaleTeam.js';
import { DateWrapper } from '#lambda/util/date.js';
import { z } from 'zod';

const MV_ACTIVE_USER_COLLECTION = 'mv_active_user_counts';

const activeUserCountSchema = z.object({
  date: z.date(),
  count: z.number(),
});

type UserIdSetByMonth = { date: number; userIds: number[] };
type ScaleTeamIdSetByMonth = {
  date: number;
  correctorIds: number[];
  correctedIds: number[];
};

// eslint-disable-next-line
export class ActiveUserUpdator {
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await ActiveUserUpdator.updateUpdated(mongo, end);
  }

  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    const userIdSetByMonth = new Map<number, Set<number>>();
    const twoMonthAgo = new DateWrapper(end)
      .startOfMonth()
      .moveMonth(-2)
      .toDate();

    //#region scaleTeam
    const scaleTeamUserGroupList = await mongo
      .db()
      .collection(SCALE_TEAM_COLLECTION)
      .aggregate<ScaleTeamIdSetByMonth>([
        {
          $match: {
            beginAt: {
              $gte: twoMonthAgo,
              $lt: end,
            },
          },
        },
        {
          $unwind: '$correcteds',
        },
        {
          $group: {
            _id: {
              $dateFromParts: {
                year: {
                  $year: {
                    date: '$beginAt',
                    timezone: TIMEZONE,
                  },
                },
                month: {
                  $month: {
                    date: '$beginAt',
                    timezone: TIMEZONE,
                  },
                },
                timezone: TIMEZONE,
              },
            },
            correctorIds: {
              $addToSet: '$corrector.id',
            },
            correctedIds: {
              $addToSet: '$correcteds.id',
            },
          },
        },
        {
          $project: {
            _id: 0,
            date: { $toLong: '$_id' },
            correctorIds: 1,
            correctedIds: 1,
          },
        },
      ])
      .toArray();

    scaleTeamUserGroupList.forEach((scaleTeamUserGroup) => {
      const userIds = new Set<number>([
        ...scaleTeamUserGroup.correctorIds,
        ...scaleTeamUserGroup.correctedIds,
      ]);

      ActiveUserUpdator.addUserIdSetByMonth(userIdSetByMonth, {
        date: scaleTeamUserGroup.date,
        userIds: Array.from(userIds),
      });
    });
    //#endregion scaleTeam

    //#region logtime
    const dailyLogtimeUserIds = await mongo
      .db()
      .collection(DAILY_LOGTIME_COLLECTION)
      .aggregate<UserIdSetByMonth>([
        {
          $match: {
            date: {
              $gte: twoMonthAgo,
              $lt: end,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateFromParts: {
                year: {
                  $year: {
                    date: '$date',
                    timezone: TIMEZONE,
                  },
                },
                month: {
                  $month: {
                    date: '$date',
                    timezone: TIMEZONE,
                  },
                },
                timezone: TIMEZONE,
              },
            },
            userIds: {
              $addToSet: '$userId',
            },
          },
        },
        {
          $project: {
            _id: 0,
            date: { $toLong: '$_id' },
            userIds: 1,
          },
        },
      ])
      .toArray();

    dailyLogtimeUserIds.forEach((dailyLogtimeUserId) => {
      ActiveUserUpdator.addUserIdSetByMonth(
        userIdSetByMonth,
        dailyLogtimeUserId,
      );
    });
    //#endregion logtime

    const userIdByMonthList = Array.from(userIdSetByMonth.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([date, userIdSet]) =>
        activeUserCountSchema.parse({
          date: new DateWrapper(date).toDate(),
          count: userIdSet.size,
        }),
      );

    for (const userIdByMonth of userIdByMonthList) {
      await mongo
        .db()
        .collection(MV_ACTIVE_USER_COLLECTION)
        .updateOne(userIdByMonth, { $set: userIdByMonth }, { upsert: true });
    }
  }

  private static addUserIdSetByMonth(
    origin: Map<number, Set<number>>,
    userIdSetByMonth: UserIdSetByMonth,
  ): void {
    const prev = origin.get(userIdSetByMonth.date) ?? new Set<number>();
    userIdSetByMonth.userIds.forEach((userId) => prev.add(userId));

    origin.set(userIdSetByMonth.date, prev);
  }
}
