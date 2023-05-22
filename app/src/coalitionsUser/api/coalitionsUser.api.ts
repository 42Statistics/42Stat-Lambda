import { z } from 'zod';
import {
  coalitionsUserSchema,
  coalitionsUserSchema_,
} from './coalitionsUser.schema.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import { SEOUL_COALITION_ID } from '../../coalition/api/coalition.api.js';

export type CoalitionsUser = z.infer<typeof coalitionsUserSchema>;

const CREATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/coalitions_users?filter[coalition_id]=${SEOUL_COALITION_ID.join(
      ',',
    )}&sort=created_at&range[created_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const COALITIONS_USER_EP = {
  CREATED,
} as const;

export const parseCoalitionsUsers = (dtos: object[]): CoalitionsUser[] =>
  parseFromDtoMany(dtos, coalitionsUserSchema_, 'coalitions_users');
