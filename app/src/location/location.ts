import { LambdaMongo } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import {
  LOCATION_EP,
  Location,
  isCluster,
  parseLocations,
} from './api/location.api.js';

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
   * 필요 요청 수: U(4 * n) + E(4)
   * 에상 소요 시간: 10초
   *
   * U 의 경우, 피신이 진행되는 기간은 폭증할 가능성이 있지만, 평소엔 4번 정도의 요청이면 충분함.
   *
   * E 의 경우, 접속을 종료하는 사람들이 한번에 400명을 넘지 않으면 불변함.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await LocationUpdator.updateOngoing(mongo);
    await LocationUpdator.updateEnded(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateOngoing(mongo: LambdaMongo): Promise<void> {
    const ongoing = await LocationUpdator.fetchOngoing();
    const ongoingInCluster = ongoing.filter(isCluster);

    await mongo.upsertManyById(LOCATION_COLLECTION, ongoingInCluster);
  }

  @FetchApiAction
  private static async fetchOngoing(): Promise<Location[]> {
    const locationDtos = await pagedRequest(LOCATION_EP.ONGOING(), 100, 4);

    return parseLocations(locationDtos);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateEnded(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(LOCATION_COLLECTION);

    const end = new Date();

    const ended = await LocationUpdator.fetchEnded(start, end);
    const endedInCluster = ended.filter(isCluster);

    await mongo.upsertManyById(LOCATION_COLLECTION, endedInCluster);
    await mongo.setCollectionUpdatedAt(LOCATION_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchEnded(start: Date, end: Date): Promise<Location[]> {
    const locationDtos = await pagedRequest(
      LOCATION_EP.ENDED(start, end),
      100,
      4,
    );

    return parseLocations(locationDtos);
  }
}
