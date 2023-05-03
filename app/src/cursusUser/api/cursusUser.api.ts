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

const isWeirdUser = (userId: number): boolean => {
  return (
    [74123, 82675, 85493, 103787].find((el) => el === userId) !== undefined
  );
};

export const isStudent = (cursusUser: CursusUser): boolean =>
  !cursusUser.user['staff?'] &&
  cursusUser.user.kind === 'student' &&
  cursusUser.hasCoalition &&
  !isWeirdUser(cursusUser.user.id);

// active? 는 다른 의미의 값이라는게 문제...
export const isActive = (cursusUser: CursusUser | CursusUserCache): boolean =>
  !cursusUser.endAt &&
  (!cursusUser.blackholedAt ||
    new Date(cursusUser.blackholedAt).getTime() > new Date().getTime() ||
    cursusUser.grade === 'Member');
