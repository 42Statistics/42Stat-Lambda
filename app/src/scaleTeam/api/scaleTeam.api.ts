import { z } from 'zod';
import { scaleTeamSchema, scaleTeamSchema_ } from './scaleTeam.schema.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';

export type ScaleTeam = z.infer<typeof scaleTeamSchema>;

export const parseScaleTeams = (dtos: object[]): ScaleTeam[] =>
  parseFromDtoMany(dtos, scaleTeamSchema_, 'scale_teams');
