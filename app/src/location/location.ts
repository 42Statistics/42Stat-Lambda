import { getStudentIds } from '#lambda/cursusUser/cursusUser.js';
import {
  LOCATION_API,
  LOCATION_EP,
  Location,
  isCluster,
  parseLocations,
} from '#lambda/location/api/location.api.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import { fetchByIds } from '#lambda/request/fetchByIds.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';
import { hasId } from '#lambda/util/hasId.js';

export const LOCATION_COLLECTION = 'locations';
export const DAILY_LOGTIME_COLLECTION = 'daily_logtimes';

type LocationsPerUser = {
  userId: number;
  locations: Pick<Location, 'beginAt' | 'endAt'>[];
};

type DailyLogtime = {
  userId: number;
  date: Date;
  value: number;
};

// eslint-disable-next-line
export class LocationUpdator {
  /**
   *
   * @description
   * @see updatePrevOngoing   P: 이전에 end_at 이 null 인 유저
   * @see updateOngoing       O: 아직 자리에 접속해 있는 유저
   * @see updateEnded         E: 접속을 종료한 유저
   *
   * 2023-05 기준
   * 필요 요청 수: P (1 ~ 5) + U(1 ~ 3 + n) + E(1 ~ 2)
   * 에상 소요 시간: 5 ~ 10초 + n
   *
   * !! 피신이 구분되지 않음 !!
   *
   * U 의 경우, 피신이 진행되는 기간은 폭증할 가능성이 있지만, 평소엔 1 ~ 3번 정도의 요청이면 충분함.
   *
   * E 의 경우, 접속을 종료하는 사람들이 100명을 넘을 때 마다 한번씩 요청을 더 보내야함.
   * 평소엔 1 ~ 2번으로 충분함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: LOCATION_COLLECTION,
      callback: async (start, end) => {
        await LocationUpdator.updatePrevOngoing(mongo);
        await LocationUpdator.updateOngoing(mongo, start, end);
        await LocationUpdator.updateEnded(mongo, start, end);
        await LocationUpdator.updateDailyLogtime(mongo, end);
      },
    });
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateOngoing(
    mongo: LambdaMongo,
    start: Date,
    end: Date,
  ): Promise<void> {
    const studentIds = await getStudentIds(mongo);

    const ongoing = await LocationUpdator.fetchOngoing(start, end).then(
      (locations) =>
        locations.filter(
          (location) =>
            isCluster(location) && hasId(studentIds, location.user.id),
        ),
    );

    await mongo.upsertManyById(LOCATION_COLLECTION, ongoing);
  }

  @FetchApiAction
  private static async fetchOngoing(
    start: Date,
    end: Date,
  ): Promise<Location[]> {
    const locationDtos = await fetchAllPages(LOCATION_API.ONGOING(start, end));

    return parseLocations(locationDtos);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateEnded(
    mongo: LambdaMongo,
    start: Date,
    end: Date,
  ): Promise<void> {
    const studentIds = await getStudentIds(mongo);

    const ended = await LocationUpdator.fetchEnded(start, end).then(
      (locations) =>
        locations.filter(
          (location) =>
            isCluster(location) && hasId(studentIds, location.user.id),
        ),
    );

    const endedInCluster = ended.filter(isCluster);

    await mongo.upsertManyById(LOCATION_COLLECTION, endedInCluster);
  }

  @FetchApiAction
  private static async fetchEnded(start: Date, end: Date): Promise<Location[]> {
    const locationDtos = await fetchAllPages(LOCATION_API.ENDED(start, end));

    return parseLocations(locationDtos);
  }

  /**
   *
   * @description
   * location api 에 버그가 생기면 end_at 이 null 인 상태로 존재하기 때문에,
   * 기존에 있던 location 들의 점검이 필요함.
   */
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updatePrevOngoing(mongo: LambdaMongo): Promise<void> {
    const prevOngoingIds = await mongo
      .db()
      .collection(LOCATION_COLLECTION)
      .find<{ id: number }>({ endAt: null }, { projection: { _id: 0, id: 1 } })
      .map((doc) => doc.id)
      .toArray();

    if (!prevOngoingIds.length) {
      return;
    }

    const updatedLocations = await LocationUpdator.fetchByIds(prevOngoingIds);

    const deleted = updatedLocations.filter(
      (location) =>
        prevOngoingIds.find((id) => id === location.id) === undefined,
    );

    if (deleted.length) {
      await mongo.pruneMany(LOCATION_COLLECTION, {
        id: { $in: deleted },
      });
    }

    await mongo.upsertManyById(LOCATION_COLLECTION, updatedLocations);
  }

  @FetchApiAction
  private static async fetchByIds(ids: number[]): Promise<Location[]> {
    const locationDtos = await fetchByIds(LOCATION_EP, ids);

    return parseLocations(locationDtos);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateDailyLogtime(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    const start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * 30);

    const locations = await LocationUpdator.findLocationsPerUserByDate(
      mongo,
      start,
      end,
    );

    const dailyLogtimes = locations.reduce(
      (accLogtimes, location) => [
        ...accLogtimes,
        ...LocationUpdator.toDailyLogtime(location, start, end),
      ],
      new Array<DailyLogtime>(),
    );

    await Promise.all(
      dailyLogtimes.map((dailyLogtime) =>
        LocationUpdator.saveDailyLogtime(mongo, dailyLogtime),
      ),
    );
  }

  private static async findLocationsPerUserByDate(
    mongo: LambdaMongo,
    start: Date,
    end: Date,
  ): Promise<LocationsPerUser[]> {
    return await mongo
      .db()
      .collection(LOCATION_COLLECTION)
      .aggregate<LocationsPerUser>([
        {
          $match: {
            beginAt: { $lt: end },
            $or: [{ endAt: { $gte: start } }, { endAt: null }],
          },
        },
        {
          $group: {
            _id: '$user.id',
            locations: {
              $push: {
                beginAt: '$beginAt',
                endAt: '$endAt',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            locations: 1,
          },
        },
      ])
      .toArray();
  }

  private static toDailyLogtime(
    { userId, locations }: LocationsPerUser,
    start: Date,
    end: Date,
  ): DailyLogtime[] {
    const logtimeMap = locations.reduce((logtimeMap, curr) => {
      const startDateTime = Math.max(curr.beginAt.getTime(), start.getTime());
      const endDateTime = curr.endAt?.getTime() ?? end.getTime();

      for (
        let dateTime = startDateTime;
        dateTime < endDateTime;
        dateTime = new Date(dateTime).setHours(24, 0, 0, 0)
      ) {
        const beginOfDate = new Date(dateTime).setHours(0, 0, 0, 0);
        const beginOfNextDate = new Date(dateTime).setHours(24, 0, 0, 0);

        const prevLogtime = logtimeMap.get(beginOfDate) ?? 0;

        logtimeMap.set(
          beginOfDate,
          prevLogtime + (Math.min(endDateTime, beginOfNextDate) - dateTime),
        );
      }

      return logtimeMap;
    }, new Map<number, number>());

    return Array.from(logtimeMap.entries()).map(([date, value]) => ({
      userId,
      date: new Date(date),
      value,
    }));
  }

  private static async saveDailyLogtime(
    mongo: LambdaMongo,
    logtime: DailyLogtime,
  ): Promise<void> {
    await mongo.db().collection(DAILY_LOGTIME_COLLECTION).updateOne(
      {
        userId: logtime.userId,
        date: logtime.date,
      },
      {
        $set: logtime,
      },
      {
        upsert: true,
      },
    );
  }
}
