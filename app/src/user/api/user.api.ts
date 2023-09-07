import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';
import { userSchema_, type userSchema } from './user.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';

export type User = z.infer<typeof userSchema>;

export const SEOUL_CAMPUS_USER_EP = `campus/${SEOUL_CAMPUS_ID}/users`;

const IS_SEOUL = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(SEOUL_CAMPUS_USER_EP)
    .addRange('updated_at', start, end)
    .toURL();

export const USER_API = {
  IS_SEOUL,
};

export const parseUsers = (dtos: object[]): User[] =>
  parseFromDtoMany(dtos, userSchema_, 'users');
