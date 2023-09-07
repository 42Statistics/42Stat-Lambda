import { titlesUserSchema } from '#lambda/titlesUser/api/titlesUser.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type TitlesUser = z.infer<typeof titlesUserSchema>;

export const TITLES_USER_EP = 'titles_users';

/**
 *
 * @description
 * 아무런 필터를 사용할 수 없기 때문에 그냥 보내야 합니다.
 */
const ALL = (): URL => new FtApiURLBuilder(TITLES_USER_EP).toURL();

export const TITLES_USER_API = {
  ALL,
} as const;

export const parseTitlesUsers = (dtos: object[]): TitlesUser[] =>
  parseFromDtoMany(dtos, titlesUserSchema, 'titles_users');
