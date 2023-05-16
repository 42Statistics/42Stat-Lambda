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
import { LOCATION_EP, Location, parseLocations } from './api/location.api.js';
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
   * 필요 요청 수: U(10) + E(4)
   *
   * U 의 경우, 피신이 진행되는 기간은 폭증할 가능성이 있지만, 평소엔 10번보다 적은 요청으로 가능함.
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
    const locationEnded = await this.fetchOngoing();

    await upsertManyById(mongoClient, LOCATION_COLLECTION, locationEnded);
  }

  @FetchApiAction
  private static async fetchOngoing(): Promise<Location[]> {
    const locationsDto = await pagedRequest(LOCATION_EP.ONGOING(), 100, 10);

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

    const locationEnded = await this.fetchEnded(start, end);

    await upsertManyById(mongoClient, LOCATION_COLLECTION, locationEnded);
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
