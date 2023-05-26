import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { pagedRequestByCount } from '#lambda/request/pagedRequestByCount.js';
import {
  TITLES_USER_EP,
  TitlesUser,
  parseTitlesUsers,
} from '#lambda/titlesUser/api/titlesUser.api.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';
export const TITLES_USER_COLLECTION = 'titles_users';

// eslint-disable-next-line
export class TitlesUserUpdator {
  /**
   *
   * @description
   * @see updateAll   A: 전체 titlesUser
   *
   * 2023-05 기준
   * 필요 요청 수: A(150 ~ )
   * 예상 소요 시간: 3분 이상
   *
   * 아무런 인자를 넘길 수 없기 때문에, 테스트 요청을 하나 보내어 받아와야 함.
   * 응답에 아무런 규칙성이 없기 때문에 처음부터 다 받아와야함.
   * 선형적으로 이 시간이 증가할텐데, 마땅한 대책이 없음. 별도의 람다 함수로 분리하는 것도 고려해야할 듯.
   */
  static async update(mongo: LambdaMongo): Promise<void> {
    await TitlesUserUpdator.updateAll(mongo);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateAll(mongo: LambdaMongo): Promise<void> {
    const titlesUsers = await TitlesUserUpdator.fetchAll();

    await mongo.upsertManyById(TITLES_USER_COLLECTION, titlesUsers);
  }

  @FetchApiAction
  private static async fetchAll(): Promise<TitlesUser[]> {
    const titlesUserDtos = await pagedRequestByCount(
      TITLES_USER_EP.ALL(),
      1,
      100,
    );

    return parseTitlesUsers(titlesUserDtos);
  }
}
