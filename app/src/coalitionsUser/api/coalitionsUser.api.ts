import { SEOUL_COALITION_ID } from '#lambda/coalition/api/coalition.api.js';
import {
  coalitionsUserSchema,
  coalitionsUserSchema_,
} from '#lambda/coalitionsUser/api/coalitionsUser.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { urlFilterJoin } from '#lambda/util/urlFilterJoin.js';
import { z } from 'zod';

export type CoalitionsUser = z.infer<typeof coalitionsUserSchema>;

const CREATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/coalitions_users?filter[coalition_id]=${urlFilterJoin(
      SEOUL_COALITION_ID,
    )}&sort=created_at&range[created_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const COALITIONS_USER_EP = {
  CREATED,
} as const;

export const parseCoalitionsUsers = (dtos: object[]): CoalitionsUser[] =>
  parseFromDtoMany(dtos, coalitionsUserSchema_, 'coalitions_users');
