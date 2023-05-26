import { titleSchema } from '#lambda/title/api/title.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Title = z.infer<typeof titleSchema>;

/**
 *
 * @description
 * 아무런 필터를 사용할 수 없기 때문에 그냥 보내야 합니다.
 */
const ALL = (): URL => new URL('https://api.intra.42.fr/v2/titles');

export const TITLE_EP = {
  ALL,
} as const;

export const parseTitles = (dtos: object[]): Title[] =>
  parseFromDtoMany(dtos, titleSchema, 'titles');
