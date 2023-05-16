import { z } from 'zod';
import { FT_CURSUS_ID } from '../../cursusUser/api/cursusUser.api.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import { teamBaseSchema, teamSchema, teamSchema_ } from './team.schema.js';

export type TeamBase = z.infer<typeof teamBaseSchema>;
export type Team = z.infer<typeof teamSchema>;
export type ValidatedTeam = Omit<
  Team,
  'finalMark' | 'locked?' | 'validated?' | 'lockedAt'
> & {
  finalMark: number;
  'locked?': true;
  'validated?': boolean;
  lockedAt: Date;
};

export type PassedTeam = Omit<
  Team,
  'finalMark' | 'locked?' | 'validated?' | 'lockedAt'
> & {
  finalMark: number;
  'locked?': true;
  'validated?': true;
  lockedAt: Date;
};

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/cursus/${FT_CURSUS_ID}/teams?filter[campus]=29&range[updated_at]=${start.toISOString()},${end.toISOString()}&sort=created_at`,
  );

export const TEAM_EP = {
  UPDATED,
} as const;

export const parseTeams = (dtos: object[]): z.infer<typeof teamSchema_>[] =>
  parseFromDtoMany(dtos, teamSchema_, 'teams');

export const isValidatedTeam = (team: TeamBase): team is ValidatedTeam => {
  return team['validated?'] !== null;
};

export const isPassedTeam = (team: TeamBase): team is PassedTeam => {
  return team['validated?'] === true;
};
