import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  scaleTeamSchema,
  scaleTeamSchema_,
} from '#lambda/scaleTeam/api/scaleTeam.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type ScaleTeam = z.infer<typeof scaleTeamSchema>;

export const SCALE_TEAM_EP = 'scale_teams';

const FILLED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(SCALE_TEAM_EP)
    .addFilter('campus_id', SEOUL_CAMPUS_ID.toString())
    .addFilter('cursus_id', FT_CURSUS_ID.toString())
    .addFilter('filled', 'true')
    .addSort('created_at', FtApiURLBuilder.SortOrder.ASC)
    .addRange('updated_at', start, end)
    .toURL();

export const SCALE_TEAM_API = {
  FILLED,
} as const;

export const parseScaleTeams = (dtos: object[]): ScaleTeam[] =>
  parseFromDtoMany(dtos, scaleTeamSchema_, 'scale_teams');
