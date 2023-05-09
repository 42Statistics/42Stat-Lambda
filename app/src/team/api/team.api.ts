import { z } from 'zod';
import { teamSchema, teamSchema_ } from './team.schema.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';

export type Team = z.infer<typeof teamSchema>;

const UPDATED = (start: Date, end: Date): string =>
  `https://api.intra.42.fr/v2/cursus/21/teams?filter[campus]=29&range[updated_at]=${start.toISOString()},${end.toISOString()}`;

export const TEAM_EP = {
  UPDATED,
} as const;

export const parseTeams = (dtos: object[]): z.infer<typeof teamSchema_>[] =>
  parseFromDtoMany(dtos, teamSchema_, 'teams');
