import { titleSchema } from '#lambda/title/api/title.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Title = z.infer<typeof titleSchema>;

export const TITLE_EP = 'titles';

/**
 *
 * @description
 * 아무런 필터를 사용할 수 없기 때문에 그냥 보내야 합니다.
 */
const ALL = (): URL => new FtApiURLBuilder(TITLE_EP).toURL();

export const TITLE_API = {
  ALL,
} as const;

export const parseTitles = (dtos: object[]): Title[] =>
  parseFromDtoMany(dtos, titleSchema, 'titles');
