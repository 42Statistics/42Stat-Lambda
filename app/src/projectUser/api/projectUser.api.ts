import { z } from 'zod';
import { FT_CURSUS_ID } from '../../cursusUser/api/cursusUser.api.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import { projectUserSchema, projectUserSchema_ } from './projectUser.schema.js';

export type ProjectsUser = z.infer<typeof projectUserSchema>;

const UPDATED = (start: Date, end: Date): string =>
  `https://api.intra.42.fr/v2/projects_users?filter[campus]=29&filter[cursus]=${FT_CURSUS_ID}&range[updated_at]=${start.toISOString()},${end.toISOString()}`;

export const PROJECTS_USER_EP = {
  UPDATED,
} as const;

export const parseProjectsUsers = (
  dtos: object[],
): z.infer<typeof projectUserSchema_>[] =>
  parseFromDtoMany(dtos, projectUserSchema_, 'projects_users');
