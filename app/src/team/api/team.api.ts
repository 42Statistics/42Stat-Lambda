import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  teamBaseSchema,
  teamSchema,
  teamSchema_,
} from '#lambda/team/api/team.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

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

const BY_IDS = (ids: number[]): URL =>
  new URL(`https://api.intra.42.fr/v2/teams?filter[id]=${ids.join(',')}`);

export const TEAM_EP = {
  UPDATED,
  BY_IDS,
} as const;

export const parseTeams = (dtos: object[]): Team[] =>
  parseFromDtoMany(dtos, teamSchema_, 'teams');

export const isValidatedTeam = (team: TeamBase): team is ValidatedTeam => {
  return team['validated?'] !== null;
};

export const isPassedTeam = (team: TeamBase): team is PassedTeam => {
  return team['validated?'] === true;
};
