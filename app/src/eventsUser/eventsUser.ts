import { getStudentIds } from '#lambda/cursusUser/cursusUser.js';
import type { Event } from '#lambda/event/api/event.api.js';
import { EVENT_COLLECTION } from '#lambda/event/event.js';
import {
  EVENTS_USER_API,
  EventsUser,
  parseEventsUsers,
} from '#lambda/eventsUser/api/eventsUser.api.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';
import { hasId } from '#lambda/util/hasId.js';

export const EVENTS_USER_COLLECTION = 'events_users';

// eslint-disable-next-line
export class EventsUserUpdator {
  /**
   *
   * @description
   * @see updateByEvent   E: 종료된 event
   *
   * 2023-05 기준
   * 필요 요청 수: E(1 ~ 2)
   * 예상 소요 시간: 3 ~ 5초
   *
   * 한번에 끝나는 event 가 겹치거나, 한 event 의 등록 인원이 매우 많아, events user 의 총 합이
   * 100명을 넘어갈 때 마다 하나씩 요청을 더 보내야 함.
   *
   * 과연 event 의 수정이 events user 에서 갱신했다고 생각하는 시점 이전으로 이루어질 수 있을지?
   * 현재로썬 event 를 바로 직전에 갱신하기 때문에, 그럴 가능성이 없다고 생각 중.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await EventsUserUpdator.updateByEvent(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateByEvent(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: EVENTS_USER_COLLECTION,
      callback: async (start, end) => {
        const eventIds = await mongo
          .db()
          .collection<Event>(EVENT_COLLECTION)
          .find({ endAt: { $gte: start, $lt: end } })
          .map((event) => event.id)
          .toArray();

        if (!eventIds.length) {
          return;
        }

        const studentIds = await getStudentIds(mongo);

        const byEvent = await EventsUserUpdator.fetchByEvent(eventIds).then(
          (eventsUsers) =>
            eventsUsers.filter((eventsUser) =>
              hasId(studentIds, eventsUser.user.id),
            ),
        );

        await mongo.upsertManyById(EVENTS_USER_COLLECTION, byEvent);
      },
    });
  }

  @FetchApiAction
  private static async fetchByEvent(eventIds: number[]): Promise<EventsUser[]> {
    const eventsUserDtos = await fetchAllPages(
      EVENTS_USER_API.BY_EVENT(eventIds),
    );

    return parseEventsUsers(eventsUserDtos);
  }
}
