import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import {
  questsUserSchema,
  questsUserSchema_,
} from '#lambda/questsUser/api/questsUser.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type QuestsUser = z.infer<typeof questsUserSchema>;

export const QUESTS_USER_EP = 'quests_users';

const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(QUESTS_USER_EP)
    .addFilter('campus_id', SEOUL_CAMPUS_ID.toString())
    .addSort('updated_at', FtApiURLBuilder.SortOrder.ASC)
    .addRange('updated_at', start, end)
    .toURL();

export const QUESTS_USER_API = {
  UPDATED,
} as const;

export const parseQuestsUsers = (dtos: object[]): QuestsUser[] =>
  parseFromDtoMany(dtos, questsUserSchema_, 'quests_user');
