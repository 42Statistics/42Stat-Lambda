import { z } from 'zod';
import { scaleTeamSchema, scaleTeamSchema_ } from './scaleTeam.schema.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import { SEOUL_CAMPUS_ID } from '../../campus/api/campus.api.js';
import { FT_CURSUS_ID } from '../../cursusUser/api/cursusUser.api.js';

export type ScaleTeam = z.infer<typeof scaleTeamSchema>;

const FILLED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/scale_teams?filter[campus_id]=${SEOUL_CAMPUS_ID}&filter[cursus_id]=${FT_CURSUS_ID}&filter[filled]=true&sort=created_at&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const SCALE_TEAM_EP = {
  FILLED,
} as const;

export const parseScaleTeams = (dtos: object[]): ScaleTeam[] =>
  parseFromDtoMany(dtos, scaleTeamSchema_, 'scale_teams');
