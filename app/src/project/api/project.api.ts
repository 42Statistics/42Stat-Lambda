import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  projectSchema,
  projectSchema_,
} from '#lambda/project/api/project.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Project = z.infer<typeof projectSchema>;

export const PROJECT_EP = `cursus/${FT_CURSUS_ID}/projects`;

const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(PROJECT_EP)
    .addSort('created_at', FtApiURLBuilder.SortOrder.ASC)
    .addRange('updated_at', start, end)
    .toURL();

export const PROJECT_API = {
  UPDATED,
} as const;

export const parseProjects = (dtos: object[]): Project[] =>
  parseFromDtoMany(dtos, projectSchema_, 'projects');
