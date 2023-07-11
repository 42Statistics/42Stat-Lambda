import { z } from 'zod';
import { campusUserSchema, campusUserSchema_ } from './campusUser.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';

export type CampusUser = z.infer<typeof campusUserSchema>;

const UPDATED_NOT_PRIMARY = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/campus_users?filter[is_primary]=false&filter[campus_id]=${SEOUL_CAMPUS_ID}&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const CAMPUS_USER_EP = {
  UPDATED_NOT_PRIMARY,
} as const;

export const parseCampusUsers = (dtos: object[]): CampusUser[] =>
  parseFromDtoMany(dtos, campusUserSchema_, 'campusUsers');
