import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  projectSchema,
  projectSchema_,
} from '#lambda/project/api/project.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Project = z.infer<typeof projectSchema>;

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/cursus/${FT_CURSUS_ID}/projects?sort=created_at&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const PROJECT_EP = {
  UPDATED,
} as const;

export const parseProjects = (dtos: object[]): Project[] =>
  parseFromDtoMany(dtos, projectSchema_, 'projects');
