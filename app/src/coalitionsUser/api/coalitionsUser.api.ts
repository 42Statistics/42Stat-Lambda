import { SEOUL_COALITION_IDS } from '#lambda/coalition/api/coalition.api.js';
import {
  coalitionsUserSchema,
  coalitionsUserSchema_,
} from '#lambda/coalitionsUser/api/coalitionsUser.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type CoalitionsUser = z.infer<typeof coalitionsUserSchema>;

export const COALITIONS_USER_EP = 'coalitions_users';

const CREATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(COALITIONS_USER_EP)
    .addFilter('coalition_id', SEOUL_COALITION_IDS.join(','))
    .addSort('created_at', FtApiURLBuilder.SortOrder.ASC)
    .addRange('created_at', start, end)
    .toURL();

export const COALITIONS_USER_API = {
  CREATED,
} as const;

export const parseCoalitionsUsers = (dtos: object[]): CoalitionsUser[] =>
  parseFromDtoMany(dtos, coalitionsUserSchema_, 'coalitions_users');
