import { MongoClient } from 'mongodb';
import {
  FetchApiAction,
  LogAsyncDocumentCount,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { getDocuemntCount, upsertManyById } from '../mongodb/mongodb.js';
import { TITLE_EP, Title, parseTitles } from './api/title.api.js';
import { pagedRequestByCount } from '../util/pagedRequestByCount.js';

export const TITLE_COLLECTION = 'titles';

// eslint-disable-next-line
export class TitleUpdator {
  /**
   *
   * @description
   * @see updateFromLastPage   L: title 전체
   *
   * 2023-05 기준
   * 필요 요청 수: L(1)
   * 예상 소요 시간: 2초
   *
   * 아무런 인자를 넘길 수 없기 때문에, 테스트 요청을 하나 보내어 받아와야 함.
   * 요청 수는 칭호가 한번에 100개 이상 생기지 않는 이상 불변함.
   */
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateFromLastPage(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateFromLastPage(
    mongoClient: MongoClient,
  ): Promise<void> {
    const documentCount = await getDocuemntCount(mongoClient, TITLE_COLLECTION);

    const titles = await this.fetchFromLastPage(documentCount);

    await upsertManyById(mongoClient, TITLE_COLLECTION, titles);
  }

  @FetchApiAction
  @LogAsyncDocumentCount
  private static async fetchFromLastPage(
    documentCount: number,
  ): Promise<Title[]> {
    const titlesUserDtos = await pagedRequestByCount(
      TITLE_EP.FROM_LAST_PAGE(),
      documentCount,
      100,
    );

    return parseTitles(titlesUserDtos);
  }
}
