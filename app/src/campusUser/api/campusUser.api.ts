import { z } from 'zod';
import { campusUserSchema, campusUserSchema_ } from './campusUser.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';

export type CampusUser = z.infer<typeof campusUserSchema>;

export const CAMPUS_USER_EP = 'campus_users';

const UPDATED_NOT_PRIMARY = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(CAMPUS_USER_EP)
    .addFilter('is_primary', 'false')
    .addFilter('campus_id', SEOUL_CAMPUS_ID.toString())
    .addRange('updated_at', start, end)
    .toURL();

export const CAMPUS_USER_API = {
  UPDATED_NOT_PRIMARY,
} as const;

export const parseCampusUsers = (dtos: object[]): CampusUser[] =>
  parseFromDtoMany(dtos, campusUserSchema_, 'campusUsers');
