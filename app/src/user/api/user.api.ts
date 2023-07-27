import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';
import { userSchema_, type userSchema } from './user.schema.js';

export type User = z.infer<typeof userSchema>;

const IS_SEOUL = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/campus/${SEOUL_CAMPUS_ID}/users?range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const USER_EP = {
  IS_SEOUL,
};

export const parseUsers = (dtos: object[]): User[] =>
  parseFromDtoMany(dtos, userSchema_, 'users');
