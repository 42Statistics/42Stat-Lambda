import { scoreSchema, scoreSchema_ } from '#lambda/score/api/score.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Score = z.infer<typeof scoreSchema>;

const BY_COALITION = (coalitionId: number): string =>
  `https://api.intra.42.fr/v2/coalitions/${coalitionId}/scores?sort=updated_at`;

// todo: coalition id 정의하기
export const SCORE_EP = {
  BY_COALITION,
} as const;

export const parseScores = (dtos: object[]): Score[] =>
  parseFromDtoMany(dtos, scoreSchema_, 'scores');

const COUNT_FILTER = {
  $or: [
    {
      coalitionsUserId: {
        $not: {
          $in: [69607, 69758, 69557, 69751, 69577, 69783, 69709],
        },
      },
    },
    { createdAt: { $gte: new Date('2023-05-23T14:00:00.000Z') } },
  ],
} as const;

/**
 *
 * 1. 2023년 05월 coalitions users 중복 삭제로 인해, 기존의 데이터 (n개) 대신 3개의 새로운 데이터가 생김.
 *    이를 대응하기 위해 기존 데이터는 ```COUNT_FILTER``` 를 통해 세고, 3개의 새로운 데이터를 삭제,
 *    이에 따라 ```COUNT_HINT``` 에 +3
 */
const COUNT_HINT = (coalitionId: number) =>
  [
    { coalitionId: 85, value: 1 },
    { coalitionId: 88, value: 2 },
  ].find((el) => el.coalitionId === coalitionId)?.value ?? 0;

// todo: 이런거 id 목록 받는 함수로 추상화 가능할듯
const IS_GOOD_IDS = <T extends { id: number }>(score: T) =>
  [2945871, 2945872, 2945873].find((weird) => weird === score.id) === undefined;

export const SCORE_EDGE_CASE = {
  /**
   *
   * @description
   * coalitions users 중복 버그 해결 과정 중 일어난 삭제로 인해 같이 사라진 score 들의 목록 입니다.
   * 이를 제외하고 count 한 후, fetchAllPages 를 호출해야 하기 때문에 이런 처리를 해야 합니다.
   */
  COUNT_FILTER,

  /**
   *
   * @description
   * score 수를 셀 때 더해줘야 하는 값 입니다.
   */
  COUNT_HINT,

  /**
   *
   * @description
   * score 를 가져올떄 무조건 제외해야 하는 id 입니다.
   */
  IS_GOOD_IDS,
} as const;
