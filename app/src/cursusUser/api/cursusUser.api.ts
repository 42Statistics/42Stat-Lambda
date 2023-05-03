import { z } from 'zod';
import { zodToCamelCase } from '../../util/toCamelCase.js';

const CURSUS_CHANGED = (start: Date, end: Date): string =>
  `https://api.intra.42.fr/v2/cursus/21/cursus_users?filter[campus_id]=29&filter[has_coalition]=true&range[updated_at]=${start.toISOString()},${end.toISOString()}&sort=created_at`;

const ACTIVATED = (): string =>
  `https://api.intra.42.fr/v2/cursus/21/cursus_users?filter[campus_id]=29&filter[has_coalition]=true&filter[end]=false&sort=created_at`;

export const CURSUS_USER_EP = {
  CURSUS_CHANGED,
  ACTIVATED,
} as const;

export const parseFromDto = (
  dtos: unknown[],
): z.SafeParseReturnType<unknown[], z.infer<typeof cursusUserSchema>[]> =>
  cursusUserSchemaPassthrough.array().safeParse(dtos);

export const isStudent = (cursusUser: CursusUser): boolean =>
  cursusUser.user['staff?'] === false &&
  cursusUser.user.kind === 'student' &&
  cursusUser.user.login !== 'polarbear';

// active? 는 다른 의미의 값이라는게 문제...
export const isActive = (cursusUser: CursusUser): boolean =>
  cursusUser.endAt === null &&
  (cursusUser.blackholedAt === null ||
    new Date(cursusUser.blackholedAt).getTime() > new Date().getTime() ||
    cursusUser.grade === 'Member');

const user_image_schema = z.object({
  link: z.string().nullable(),
  versions: z.object({
    large: z.string().nullable(),
    medium: z.string().nullable(),
    small: z.string().nullable(),
    micro: z.string().nullable(),
  }),
});

const user_schema = z.object({
  id: z.number(),
  email: z.string(),
  login: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  url: z.string(),
  displayname: z.string(),
  kind: z.string(),
  image: user_image_schema.nullable(),
  'staff?': z.boolean(),
  correction_point: z.number(),
  pool_month: z.string().nullable(),
  pool_year: z.string().nullable(),
  location: z.string().nullable(),
  wallet: z.number(),
  anonymize_date: z.coerce.date().nullable(),
  data_erasure_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  alumnized_at: z.coerce.date().nullable(),
  'alumni?': z.boolean(),
  'active?': z.boolean(),
});

const user_schema_passthrough = user_schema
  .omit({ image: true })
  .extend({
    image: user_image_schema.passthrough().nullable(),
  })
  .passthrough();

const cursus_schema = z.object({
  id: z.number(),
  created_at: z.coerce.date(),
  name: z.string(),
  slug: z.string(),
  kind: z.string(),
});

const cursus_user_schema = z.object({
  grade: z.string().nullable(),
  level: z.number(),
  blackholed_at: z.coerce.date().nullable(),
  id: z.number(),
  begin_at: z.coerce.date(),
  end_at: z.coerce.date().nullable(),
  cursus_id: z.number(),
  has_coalition: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  user: user_schema,
  cursus: cursus_schema,
});

export const cursusUserSchema = zodToCamelCase(cursus_user_schema);
export type CursusUser = z.infer<typeof cursusUserSchema>;

export const cursusUserSchemaPassthrough = zodToCamelCase(
  cursus_user_schema
    .omit({ user: true, cursus: true })
    .extend({
      user: user_schema_passthrough,
      cursus: cursus_schema.passthrough(),
    })
    .passthrough(),
);
