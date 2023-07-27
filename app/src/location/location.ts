import { getStudentIds } from '#lambda/cursusUser/cursusUser.js';
import {
  LOCATION_EP,
  Location,
  isCluster,
  parseLocations,
} from '#lambda/location/api/location.api.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';
import { hasId } from '#lambda/util/hasId.js';

export const LOCATION_COLLECTION = 'locations';

// eslint-disable-next-line
export class LocationUpdator {
  /**
   *
   * @description
   * @see updateOngoing   O: 아직 자리에 접속해 있는 유저
   * @see updateEnded     E: 접속을 종료한 유저
   *
   * 2023-05 기준
   * 필요 요청 수: U(1 ~ 3 + n) + E(1 ~ 2)
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
        await LocationUpdator.updateOngoing(mongo, start, end);
        await LocationUpdator.updateEnded(mongo, start, end);
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
    const locationDtos = await fetchAllPages(LOCATION_EP.ONGOING(start, end));

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
    const locationDtos = await fetchAllPages(LOCATION_EP.ENDED(start, end));

    return parseLocations(locationDtos);
  }
}
