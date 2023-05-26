import type { Event } from '../event/api/event.api.js';
import { EVENT_COLLECTION } from '../event/event.js';
import { LambdaMongo } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../request/pagedRequest.js';
import {
  EVENTS_USER_EP,
  EventsUser,
  parseEventsUsers,
} from './api/eventsUser.api.js';

export const EVENTS_USER_COLLECTION = 'events_users';

// eslint-disable-next-line
export class EventsUserUpdator {
  /**
   *
   * @description
   * @see updateByEvent   E: 종료된 event
   *
   * 2023-05 기준
   * 필요 요청 수: E(2)
   * 예상 소요 시간: 5초
   *
   * 한번에 끝나는 event 가 겹치거나, 한 event 의 등록 인원이 매우 많아, events user 의 총 합이
   * 200명이 넘는 경우가 아니면 불변함.
   *
   * 과연 event 의 수정이 events user 에서 갱신했다고 생각하는 시점 이전으로 이루어질 수 있을지?
   * 현재로썬 event 를 바로 직전에 갱신하기 때문에, 그럴 가능성이 없다고 생각 중.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await EventsUserUpdator.updateByEvent(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateByEvent(mongo: LambdaMongo): Promise<void> {
    const start = await mongo.getCollectionUpdatedAt(EVENTS_USER_COLLECTION);

    const end = new Date();

    const eventIds = await mongo
      .db()
      .collection<Event>(EVENT_COLLECTION)
      .find({ endAt: { $gte: start, $lt: end } })
      .map((event) => event.id)
      .toArray();

    if (!eventIds.length) {
      return;
    }

    const byEvent = await EventsUserUpdator.fetchByEvent(eventIds);

    await mongo.upsertManyById(EVENTS_USER_COLLECTION, byEvent);
    await mongo.setCollectionUpdatedAt(EVENTS_USER_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchByEvent(eventIds: number[]): Promise<EventsUser[]> {
    const eventsUserDtos = await pagedRequest(
      EVENTS_USER_EP.BY_EVENT(eventIds),
      100,
      2,
    );

    return parseEventsUsers(eventsUserDtos);
  }
}
