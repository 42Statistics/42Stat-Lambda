import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  projectsUserSchema,
  projectsUserSchema_,
} from '#lambda/projectsUser/api/projectsUser.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type ProjectsUser = z.infer<typeof projectsUserSchema>;

export const PROJECTS_USER_EP = 'projects_users';

/**
 *
 * @description
 * cursus 인자를 같이 보내도, 실제로는 아무 cursus 나 반환되기 때문에, 받아온 후 직접 처리할 필요가
 * 있습니다.
 */
const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(PROJECTS_USER_EP)
    .addFilter('campus', SEOUL_CAMPUS_ID.toString())
    .addFilter('cursus', FT_CURSUS_ID.toString())
    .addRange('updated_at', start, end)
    .toURL();

const BY_IDS = (ids: number[]): URL =>
  new FtApiURLBuilder(PROJECTS_USER_EP).addFilter('id', ids.join(',')).toURL();

export const PROJECTS_USER_API = {
  UPDATED,
  BY_IDS,
} as const;

export const parseProjectsUsers = (dtos: object[]): ProjectsUser[] =>
  parseFromDtoMany(dtos, projectsUserSchema_, 'projects_users');
