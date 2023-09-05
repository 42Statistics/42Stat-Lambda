import {
  questsUserSchema,
  questsUserSchema_,
} from '#lambda/questsUser/api/questsUser.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type QuestsUser = z.infer<typeof questsUserSchema>;

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/quests_users?filter[campus_id]=29&sort=updated_at&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const QUESTS_USER_EP = {
  UPDATED,
} as const;

export const parseQuestsUsers = (dtos: object[]): QuestsUser[] =>
  parseFromDtoMany(dtos, questsUserSchema_, 'quests_user');
