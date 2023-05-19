import { MongoClient } from 'mongodb';
import { upsertManyById } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequestByCount } from '../util/pagedRequestByCount.js';
import { TITLE_EP, Title, parseTitles } from './api/title.api.js';

export const TITLE_COLLECTION = 'titles';

// eslint-disable-next-line
export class TitleUpdator {
  /**
   *
   * @description
   * @see updateAll   L: title 전체
   *
   * 2023-05 기준
   * 필요 요청 수: L(14)
   * 예상 소요 시간: 20초 이상
   *
   * 아무런 인자를 넘길 수 없기 때문에, 테스트 요청을 하나 보내어 받아와야 함.
   * 응답에 규칙성이 없기 때문에 처음부터 다 받아와야함.
   * 요청 수는 칭호가 한번에 100개 이상 생기지 않는 이상 불변함.
   */
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateAll(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateAll(mongoClient: MongoClient): Promise<void> {
    const titles = await this.fetchAll();

    await upsertManyById(mongoClient, TITLE_COLLECTION, titles);
  }

  @FetchApiAction
  private static async fetchAll(): Promise<Title[]> {
    const titlesUserDtos = await pagedRequestByCount(
      TITLE_EP.FROM_LAST_PAGE(),
      0,
      100,
    );

    return parseTitles(titlesUserDtos);
  }
}
