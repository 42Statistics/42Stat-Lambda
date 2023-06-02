import {
  projectSessionSchema,
  projectSessionSchema_,
} from '#lambda/projectSession/api/projectSessions.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type ProjectSession = z.infer<typeof projectSessionSchema>;

export const parseProjectSessions = (dtos: object[]): ProjectSession[] =>
  parseFromDtoMany(dtos, projectSessionSchema_, 'project_sessions');

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/project_sessions?sort=updated_at&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const PROJECT_SESSION_EP = {
  UPDATED,
} as const;
