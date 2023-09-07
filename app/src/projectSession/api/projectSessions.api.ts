import {
  projectSessionSchema,
  projectSessionSchema_,
} from '#lambda/projectSession/api/projectSessions.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type ProjectSession = z.infer<typeof projectSessionSchema>;

export const PROJECT_SESSION_EP = 'project_sessions';

const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(PROJECT_SESSION_EP)
    .addSort('updated_at', FtApiURLBuilder.SortOrder.ASC)
    .addRange('updated_at', start, end)
    .toURL();

export const PROJECT_SESSION_API = {
  UPDATED,
} as const;

export const parseProjectSessions = (dtos: object[]): ProjectSession[] =>
  parseFromDtoMany(dtos, projectSessionSchema_, 'project_sessions');
