import {
  projectSessionsSkillSchema,
  projectSessionsSkillSchema_,
} from '#lambda/projectSessionsSkill/api/projectSessionsSkill.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type ProjectSessionsSkill = z.infer<typeof projectSessionsSkillSchema>;

export const PROJECT_SESSIONS_SKILL_EP = 'project_sessions_skills';

const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(PROJECT_SESSIONS_SKILL_EP)
    .addSort('updated_at', FtApiURLBuilder.SortOrder.ASC)
    .addRange('updated_at', start, end)
    .toURL();

export const PROJECT_SESSIONS_SKILL_API = {
  UPDATED,
} as const;

export const parseProjectSessionsSkills = (
  dtos: object[],
): ProjectSessionsSkill[] =>
  parseFromDtoMany(
    dtos,
    projectSessionsSkillSchema_,
    'project_sessions_skills',
  );
