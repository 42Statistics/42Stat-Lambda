import { MongoClient } from 'mongodb';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import {
  getCollectionUpdatedAt,
  setCollectionUpdatedAt,
  upsertManyById,
} from '../mongodb/mongodb.js';
import {
  LOCATION_EP,
  Location,
  isCluster,
  parseLocations,
} from './api/location.api.js';
import { pagedRequest } from '../util/pagedRequest.js';

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
   *
   * U 의 경우, 피신이 진행되는 기간은 폭증할 가능성이 있지만, 평소엔 4번 정도의 요청이면 충분함.
   *
   * E 의 경우, 접속을 종료하는 사람들이 한번에 400명을 넘지 않으면 불변함.
   */
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateOngoing(mongoClient);
    await this.updateEnded(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateOngoing(mongoClient: MongoClient): Promise<void> {
    const ongoing = await this.fetchOngoing();
    const ongoingInCluster = ongoing.filter(isCluster);

    await upsertManyById(mongoClient, LOCATION_COLLECTION, ongoingInCluster);
  }

  @FetchApiAction
  private static async fetchOngoing(): Promise<Location[]> {
    const locationsDto = await pagedRequest(LOCATION_EP.ONGOING(), 100, 4);

    return parseLocations(locationsDto);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateEnded(mongoClient: MongoClient): Promise<void> {
    const start = await getCollectionUpdatedAt(
      mongoClient,
      LOCATION_COLLECTION,
    );

    const end = new Date();

    const ended = await this.fetchEnded(start, end);
    const endedInCluster = ended.filter(isCluster);

    await upsertManyById(mongoClient, LOCATION_COLLECTION, endedInCluster);
    await setCollectionUpdatedAt(mongoClient, LOCATION_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchEnded(start: Date, end: Date): Promise<Location[]> {
    const locationsDto = await pagedRequest(
      LOCATION_EP.ENDED(start, end),
      100,
      4,
    );

    return parseLocations(locationsDto);
  }
}
