import { z } from 'zod';
import { projectUserSchema, projectUserSchema_ } from './projectUser.schema.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';

export type ProjectsUser = z.infer<typeof projectUserSchema>;

const UPDATED = (start: Date, end: Date): string =>
  `https://api.intra.42.fr/v2/projects_users?filter[campus]=29&filter[cursus]=21&range[updated_at]=${start.toISOString()},${end.toISOString()}`;

export const PROJECTS_USER_EP = {
  UPDATED,
} as const;

export const parseProjectsUsers = (
  dtos: object[],
): z.infer<typeof projectUserSchema_>[] =>
  parseFromDtoMany(dtos, projectUserSchema_, 'projects_users');
