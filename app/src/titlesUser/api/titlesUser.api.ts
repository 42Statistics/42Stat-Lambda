import { z } from 'zod';
import { titlesUserSchema } from './titlesUser.schema.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';

export type TitlesUser = z.infer<typeof titlesUserSchema>;

/**
 *
 * @description
 * 아무런 필터를 사용할 수 없기 때문에 그냥 보내야 합니다.
 */
const FROM_LAST_PAGE = (): URL =>
  new URL('https://api.intra.42.fr/v2/titles_users');

export const TITLES_USER_EP = {
  FROM_LAST_PAGE,
} as const;

export const parseTitlesUsers = (dtos: object[]): TitlesUser[] =>
  parseFromDtoMany(dtos, titlesUserSchema, 'titles_users');
