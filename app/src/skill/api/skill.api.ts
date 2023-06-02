import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';
import { skillSchema, skillSchema_ } from './skill.schema.js';

export type Skill = z.infer<typeof skillSchema>;

export const parseSkills = (dtos: object[]): Skill[] =>
  parseFromDtoMany(dtos, skillSchema_, 'skills');

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/skills?sort=updated_at&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const SKILL_EP = {
  UPDATED,
} as const;
