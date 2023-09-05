import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  projectsUserSchema,
  projectsUserSchema_,
} from '#lambda/projectsUser/api/projectsUser.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { urlFilterJoin } from '#lambda/util/urlFilterJoin.js';
import { z } from 'zod';

export type ProjectsUser = z.infer<typeof projectsUserSchema>;

/**
 *
 * @description
 * cursus 인자를 같이 보내도, 실제로는 아무 cursus 나 반환되기 때문에, 받아온 후 직접 처리할 필요가
 * 있습니다.
 */
const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/projects_users?filter[campus]=29&filter[cursus]=${FT_CURSUS_ID}&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

const BY_IDS = (ids: number[]): URL =>
  new URL(
    `https://api.intra.42.fr/v2/projects_users?filter[id]=${urlFilterJoin(
      ids,
    )}`,
  );

export const PROJECTS_USER_EP = {
  UPDATED,
  BY_IDS,
} as const;

export const parseProjectsUsers = (dtos: object[]): ProjectsUser[] =>
  parseFromDtoMany(dtos, projectsUserSchema_, 'projects_users');
