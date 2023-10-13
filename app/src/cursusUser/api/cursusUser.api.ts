import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import {
  cursusUserSchema,
  cursusUserSchema_,
} from '#lambda/cursusUser/api/cursusUser.schema.js';
import type { CursusUserCache } from '#lambda/cursusUser/dto/cursusUser.redis.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type CursusUser = z.infer<typeof cursusUserSchema>;

export const FT_CURSUS_ID = 21;

export const CURSUS_USER_EP = `cursus/${FT_CURSUS_ID}/cursus_users`;

const CURSUS_CHANGED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(CURSUS_USER_EP)
    .addFilter('campus_id', SEOUL_CAMPUS_ID.toString())
    .addFilter('has_coalition', 'true')
    .addRange('updated_at', start, end)
    .addSort('created_at', FtApiURLBuilder.SortOrder.ASC)
    .toURL();

const ACTIVATED = (): URL =>
  new FtApiURLBuilder(CURSUS_USER_EP)
    .addFilter('campus_id', SEOUL_CAMPUS_ID.toString())
    .addFilter('has_coalition', 'true')
    .addFilter('end', 'false')
    .addSort('created_at', FtApiURLBuilder.SortOrder.ASC)
    .toURL();

export const CURSUS_USER_API = {
  CURSUS_CHANGED,
  ACTIVATED,
} as const;

export const parseCursusUsers = (dtos: object[]): CursusUser[] =>
  parseFromDtoMany(dtos, cursusUserSchema_, 'cursusUsers');

// 무조건 제외해야하지만 포함된 user. 잘못된 api 데이터 생성으로 인해 발생.
const weirdUserIds = [
  74123, 82675, 85493, 103787, 70836, 74116, 74119, 74122, 74209, 74368, 75353,
  75665, 78719, 84333, 90424, 103499, 108454, 141708, 143584, 148890, 70836,
  74116, 74119, 74122, 74209, 74368, 75353, 75665, 78719, 111867, 142051,
  111064, 158192, 158191,
] as const;

// 무조건 포함해야하지만 제외된 user.
// 더이상 이를 강제로 보낼 필요는 없지만, 예외를 기록해두는 의도로 보존.
// export const wildcardUserIds = [
// 68891, // 1기 중 버그 있어보이지만 피신 평가 내역은 존재함.
// 68857, // 파리로 transfer, login: sucho
// 69000, // hyulim
// ] as const;

export const HYULIM = 69000;

const isWeirdUserId = (userId: number): boolean => {
  return weirdUserIds.find((id) => id === userId) !== undefined;
};

export const isStudent = (cursusUser: CursusUser): boolean =>
  !cursusUser.user['staff?'] &&
  cursusUser.user.kind === 'student' &&
  cursusUser.hasCoalition &&
  !(
    cursusUser.user.id !== HYULIM && cursusUser.user.firstName === 'Hyundong'
  ) &&
  !isWeirdUserId(cursusUser.user.id);

// active? 는 다른 의미의 값이라는게 문제...
export const isActive = (cursusUser: CursusUser | CursusUserCache): boolean =>
  !cursusUser.endAt &&
  (!cursusUser.blackholedAt ||
    new Date(cursusUser.blackholedAt).getTime() > new Date().getTime() ||
    cursusUser.grade === 'Member');
