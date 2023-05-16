import { z } from 'zod';
import { titleSchema } from './title.schema.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';

export type Title = z.infer<typeof titleSchema>;

/**
 *
 * @description
 * 아무런 필터를 사용할 수 없기 때문에 그냥 보내야 합니다.
 */
const FROM_LAST_PAGE = (): URL => new URL('https://api.intra.42.fr/v2/titles');

export const TITLE_EP = {
  FROM_LAST_PAGE,
} as const;

export const parseTitles = (dtos: object[]): Title[] =>
  parseFromDtoMany(dtos, titleSchema, 'titles');
