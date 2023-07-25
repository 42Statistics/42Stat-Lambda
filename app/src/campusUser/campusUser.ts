import type { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';
import {
  CAMPUS_USER_EP,
  parseCampusUsers,
  type CampusUser,
} from './api/campusUser.api.js';

export const CAMPUS_USER_COLLECTION = 'campus_users';

// eslint-disable-next-line
export class CampusUserUpdator {
  private static transferUserIds: number[] | null = null;

  /**
   *
   * @description
   * @see updateNotPrmiary   N: 42 서울이 primary campus 가 아닌 유저
   *
   * 2023-07 기준
   * 필요 요청 수: N(1)
   * 예상 소요 시간: 2초
   *
   * transfer 를 100명 이상 갈때마다 한번씩 더 보내야 함.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await this.updateNotPrmiary(mongo, end);

    this.transferUserIds = await mongo
      .db()
      .collection<CampusUser>(CAMPUS_USER_COLLECTION)
      .find<{ userId: number }>({
        isPrimary: false,
      })
      .map((doc) => doc.userId)
      .toArray();
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateNotPrmiary(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    const notPrimary = await this.fetchNotPrimary(end);

    await mongo.deleteMany(CAMPUS_USER_COLLECTION);
    await mongo.upsertManyById(CAMPUS_USER_COLLECTION, notPrimary);
  }

  @FetchApiAction
  private static async fetchNotPrimary(end: Date): Promise<CampusUser[]> {
    const campusUserDtos = await fetchAllPages(
      CAMPUS_USER_EP.UPDATED_NOT_PRIMARY(new Date(0), end),
    );

    return parseCampusUsers(campusUserDtos);
  }

  public static getTransferIds(): number[] {
    if (!this.transferUserIds) {
      throw Error('campus user not updated');
    }

    return this.transferUserIds;
  }
}
