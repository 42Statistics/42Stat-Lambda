import { LambdaMongo } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import { EVENT_EP, Event, parseEvents } from './api/event.api.js';

export const EVENT_COLLECTION = 'events';

// eslint-disable-next-line
export class EventUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 새로 생기거나 갱신된 event
   *
   * 2023-05 기준
   * 필요 요청 수: U(1)
   * 예상 소요 시간: 3초
   *
   * 한번에 100개 이상의 event 가 변하지 않는 이상 불변함.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await EventUpdator.updateUpdated(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(EVENT_COLLECTION);
    const end = new Date();

    const updated = await EventUpdator.fetchUpdated(start, end);

    await mongo.upsertManyById(EVENT_COLLECTION, updated);
    await mongo.setCollectionUpdatedAt(EVENT_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchUpdated(start: Date, end: Date): Promise<Event[]> {
    const eventDtos = await pagedRequest(EVENT_EP.UPDATED(start, end), 100, 1);

    return parseEvents(eventDtos);
  }
}
