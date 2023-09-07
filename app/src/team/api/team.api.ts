import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  teamBaseSchema,
  teamSchema,
  teamSchema_,
} from '#lambda/team/api/team.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
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

// todo: 다른 곳에도 이런 이름 적용
export const FT_CURSUS_TEAM_EP = `cursus/${FT_CURSUS_ID}/teams`;
export const TEAM_EP = 'teams';

const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(FT_CURSUS_TEAM_EP)
    .addFilter('campus', SEOUL_CAMPUS_ID.toString())
    .addRange('updated_at', start, end)
    .addSort('created_at', FtApiURLBuilder.SortOrder.ASC)
    .toURL();

const BY_IDS = (ids: number[]): URL =>
  new FtApiURLBuilder(TEAM_EP).addFilter('id', ids.join(',')).toURL();

export const TEAM_API = {
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
