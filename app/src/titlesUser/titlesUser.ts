import { MongoClient } from 'mongodb';
import { getDocuemntCount, upsertManyById } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncDocumentCount,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequestByCount } from '../util/pagedRequestByCount.js';
import {
  TITLES_USER_EP,
  TitlesUser,
  parseTitlesUsers,
} from './api/titlesUser.api.js';

export const TITLES_USER_COLLECTION = 'titles_users';

// eslint-disable-next-line
export class TitlesUserUpdator {
  /**
   *
   * @description
   * @see updateFromLastPage   L: 전체 titlesUser
   *
   * 2023-05 기준
   * 필요 요청 수: L(1)
   * 예상 소요 시간: 2초
   *
   * 아무런 인자를 넘길 수 없기 때문에, 테스트 요청을 하나 보내어 받아와야 함.
   * 요청 수 자체는 불변할 것으로 예상되나, writer's soul 처럼 나중에 생긴 칭호를 일괄 지급하는 경우,
   * 증가할 가능성이 있음.
   */
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateFromLastPage(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateFromLastPage(
    mongoClient: MongoClient,
  ): Promise<void> {
    const docCount = await getDocuemntCount(
      mongoClient,
      TITLES_USER_COLLECTION,
    );

    const titlesUsers = await this.fetchFromLastPage(docCount);

    await upsertManyById(mongoClient, TITLES_USER_COLLECTION, titlesUsers);
  }

  @FetchApiAction
  @LogAsyncDocumentCount
  private static async fetchFromLastPage(
    docCount: number,
  ): Promise<TitlesUser[]> {
    const titlesUserDtos = await pagedRequestByCount(
      TITLES_USER_EP.FROM_LAST_PAGE(),
      docCount,
      100,
    );

    return parseTitlesUsers(titlesUserDtos);
  }
}
