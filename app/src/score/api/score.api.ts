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
