import { z } from 'zod';
import { FT_CURSUS_ID } from '../../cursusUser/api/cursusUser.api.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import {
  projectsUserSchema,
  projectsUserSchema_,
} from './projectsUser.schema.js';

export type ProjectsUser = z.infer<typeof projectsUserSchema>;

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/projects_users?filter[campus]=29&filter[cursus]=${FT_CURSUS_ID}&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const PROJECTS_USER_EP = {
  UPDATED,
} as const;

export const parseProjectsUsers = (
  dtos: object[],
): z.infer<typeof projectsUserSchema_>[] =>
  parseFromDtoMany(dtos, projectsUserSchema_, 'projects_users');
