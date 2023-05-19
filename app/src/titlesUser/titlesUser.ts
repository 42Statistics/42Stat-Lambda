import { MongoClient } from 'mongodb';
import { upsertManyById } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import {
  TITLES_USER_EP,
  TitlesUser,
  parseTitlesUsers,
} from './api/titlesUser.api.js';
import { pagedRequestByCount } from '../util/pagedRequestByCount.js';
export const TITLES_USER_COLLECTION = 'titles_users';

// eslint-disable-next-line
export class TitlesUserUpdator {
  /**
   *
   * @description
   * @see updateAll   L: 전체 titlesUser
   *
   * 2023-05 기준
   * 필요 요청 수: L(150 ~ 200)
   * 예상 소요 시간: 3분 이상
   *
   * 아무런 인자를 넘길 수 없기 때문에, 테스트 요청을 하나 보내어 받아와야 함.
   * 응답에 아무런 규칙성이 없기 때문에 처음부터 다 받아와야함.
   * 선형적으로 이 시간이 증가할텐데, 마땅한 대책이 없음. 별도의 람다 함수로 분리하는 것도 고려해야할 듯.
   */
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateAll(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateAll(mongoClient: MongoClient): Promise<void> {
    const titlesUsers = await this.fetchAll();

    await upsertManyById(mongoClient, TITLES_USER_COLLECTION, titlesUsers);
  }

  @FetchApiAction
  private static async fetchAll(): Promise<TitlesUser[]> {
    const titlesUserDtos = await pagedRequestByCount(
      TITLES_USER_EP.FROM_LAST_PAGE(),
      0,
      100,
    );

    return parseTitlesUsers(titlesUserDtos);
  }
}
