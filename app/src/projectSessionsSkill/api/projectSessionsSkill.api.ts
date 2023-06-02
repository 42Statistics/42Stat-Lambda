import {
  projectSessionsSkillSchema,
  projectSessionsSkillSchema_,
} from '#lambda/projectSessionsSkill/api/projectSessionsSkill.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type ProjectSessionsSkill = z.infer<typeof projectSessionsSkillSchema>;

export const parseProjectSessionsSkills = (
  dtos: object[],
): ProjectSessionsSkill[] =>
  parseFromDtoMany(
    dtos,
    projectSessionsSkillSchema_,
    'project_sessions_skills',
  );

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/project_sessions_skills?sort=updated_at&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const PROJECT_SESSIONS_SKILL_EP = {
  UPDATED,
} as const;
