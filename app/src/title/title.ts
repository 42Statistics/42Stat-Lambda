import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import { TITLE_API, Title, parseTitles } from '#lambda/title/api/title.api.js';
// eslint-disable-next-line
import type { TitlesUserUpdator } from '#lambda/titlesUser/titlesUser.js';
import {
  At_00_Action,
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const TITLE_COLLECTION = 'titles';

// eslint-disable-next-line
export class TitleUpdator {
  /**
   *
   * @description
   * @see updateAll   A: title 전체
   *
   * 2023-05 기준
   * 필요 요청 수: A(15 ~)
   * 예상 소요 시간: 20초 이상
   *
   * 아무런 인자를 넘길 수 없기 때문에, 테스트 요청을 하나 보내어 받아와야 함.
   * 응답에 규칙성이 없기 때문에 처음부터 다 받아와야함.
   *
   * @see TitlesUserUpdator.update
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await TitleUpdator.updateAll(mongo);
  }

  @At_00_Action
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateAll(mongo: LambdaMongo): Promise<void> {
    const titles = await TitleUpdator.fetchAll();

    await mongo.upsertManyById(TITLE_COLLECTION, titles);
  }

  @FetchApiAction
  private static async fetchAll(): Promise<Title[]> {
    const titlesUserDtos = await fetchAllPages(TITLE_API.ALL(), 1, 100);

    return parseTitles(titlesUserDtos);
  }
}
