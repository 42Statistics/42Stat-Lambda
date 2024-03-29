import { EVENT_API, Event, parseEvents } from '#lambda/event/api/event.api.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

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
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await EventUpdator.updateUpdated(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: EVENT_COLLECTION,
      callback: async (start, end) => {
        const updated = await EventUpdator.fetchUpdated(start, end);

        await mongo.upsertManyById(EVENT_COLLECTION, updated);
      },
    });
  }

  @FetchApiAction
  private static async fetchUpdated(start: Date, end: Date): Promise<Event[]> {
    const eventDtos = await fetchAllPages(EVENT_API.UPDATED(start, end));

    return parseEvents(eventDtos);
  }
}
