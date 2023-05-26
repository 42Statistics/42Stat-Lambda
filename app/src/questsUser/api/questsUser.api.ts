import { wildcardUserIds } from '#lambda/cursusUser/api/cursusUser.api.js';
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

/**
 *
 * @description
 * 통상적으로 wildcard user 는 transfer 간 사람일 가능성이 높고, 해당 시점에는 이미 Member 일
 * 것이라 추측할 수 있습니다. 때문에 quests user 는 특별히 더 추가되지 않을 것으로 보이는데요,
 * 추후 이 로직을 람다가 실행될때마다 매번 같이 실행할지, 아니면 더 긴 주기로 실행할지 정해야할 것으로
 * 보입니다.
 */
const WILDCARD = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/quests_users?filter[user_id]=${wildcardUserIds.join(
      ',',
    )}&sort=updated_at&range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const QUESTS_USER_EP = {
  UPDATED,
  WILDCARD,
} as const;

export const parseQuestsUsers = (dtos: object[]): QuestsUser[] =>
  parseFromDtoMany(dtos, questsUserSchema_, 'quests_user');
