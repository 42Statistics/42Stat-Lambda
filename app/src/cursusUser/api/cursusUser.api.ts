import camelcaseKeys from 'camelcase-keys';
import { z } from 'zod';
import type { CursusUserCache } from '../dto/cursusUser.redis.js';
import { cursusUserSchema } from './cursusUser.schema.js';

export type CursusUser = z.infer<typeof cursusUserSchema>;

const CURSUS_CHANGED = (start: Date, end: Date): string =>
  `https://api.intra.42.fr/v2/cursus/21/cursus_users?filter[campus_id]=29&filter[has_coalition]=true&range[updated_at]=${start.toISOString()},${end.toISOString()}&sort=created_at`;

const ACTIVATED = (): string =>
  `https://api.intra.42.fr/v2/cursus/21/cursus_users?filter[campus_id]=29&filter[has_coalition]=true&filter[end]=false&sort=created_at`;

export const CURSUS_USER_EP = {
  CURSUS_CHANGED,
  ACTIVATED,
} as const;

export const parseFromDto = (
  dtos: object[],
): z.SafeParseReturnType<
  object[],
  z.infer<ReturnType<typeof cursusUserSchema.passthrough>>[]
> =>
  cursusUserSchema
    .passthrough()
    .array()
    .safeParse(dtos.map((dto) => camelcaseKeys(dto, { deep: true })));

// 무조건 제외해야하지만 포함된 user. 잘못된 api 데이터 생성으로 인해 발생.
const weirdUserIds = [
  74123, 82675, 85493, 103787, 70836, 74116, 74119, 74122, 74209, 74368, 75353,
  75665, 78719, 84333, 90424, 103499, 108454, 141708, 143584, 148890, 70836,
  74116, 74119, 74122, 74209, 74368, 75353, 75665, 78719, 111867, 142051,
  111064,
] as const;

// 무조건 포함해야하지만 제외된 user.
const wildcardUserIds = [
  68891, // 1기 중 버그 있어보이지만 피신 평가 내역은 존재함.
  68857, // 파리로 transfer, login: sucho
  69000, // hyulim
] as const;

const isWeirdUserId = (userId: number): boolean => {
  return weirdUserIds.find((id) => id === userId) !== undefined;
};

export const isStudent = (cursusUser: CursusUser): boolean =>
  !cursusUser.user['staff?'] &&
  cursusUser.user.kind === 'student' &&
  cursusUser.hasCoalition &&
  cursusUser.user.firstName !== 'Hyundong' &&
  !isWeirdUserId(cursusUser.user.id);

// active? 는 다른 의미의 값이라는게 문제...
export const isActive = (cursusUser: CursusUser | CursusUserCache): boolean =>
  !cursusUser.endAt &&
  (!cursusUser.blackholedAt ||
    new Date(cursusUser.blackholedAt).getTime() > new Date().getTime() ||
    cursusUser.grade === 'Member');
