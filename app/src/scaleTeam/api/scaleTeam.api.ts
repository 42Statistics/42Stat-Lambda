import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  scaleTeamSchema,
  scaleTeamSchema_,
} from '#lambda/scaleTeam/api/scaleTeam.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

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
