import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';
import { skillSchema, skillSchema_ } from './skill.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';

export type Skill = z.infer<typeof skillSchema>;

export const SKILL_EP = 'skills';

const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(SKILL_EP)
    .addSort('updated_at', FtApiURLBuilder.SortOrder.ASC)
    .addRange('updated_at', start, end)
    .toURL();

export const SKILL_API = {
  UPDATED,
} as const;

export const parseSkills = (dtos: object[]): Skill[] =>
  parseFromDtoMany(dtos, skillSchema_, 'skills');
