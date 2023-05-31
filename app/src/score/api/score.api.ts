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

export const SCORE_EXCEPTION = {
  /**
   *
   * @description
   * coalitions users 중복 버그 해결 과정 중 일어난 삭제로 인해 같이 사라진 score 들의 목록 입니다.
   * 이를 제외하고 count 한 후, fetchAllPages 를 호출해야 하기 때문에 이런 처리를 해야 합니다.
   */
  COUNT_FILTER,
} as const;
