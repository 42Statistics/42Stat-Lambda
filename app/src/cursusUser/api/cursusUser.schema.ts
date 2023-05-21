import { z } from 'zod';

const userImageSchema = z.object({
  link: z.string().nullable(),
  versions: z.object({
    large: z.string().nullable(),
    medium: z.string().nullable(),
    small: z.string().nullable(),
    micro: z.string().nullable(),
  }),
});

export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  login: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  url: z.string(),
  displayname: z.string(),
  kind: z.string(),
  image: userImageSchema.nullable(),
  'staff?': z.boolean(),
  correctionPoint: z.number(),
  poolMonth: z.string().nullable(),
  poolYear: z.string().nullable(),
  location: z.string().nullable(),
  wallet: z.number(),
  anonymizeDate: z.coerce.date().nullable(),
  dataErasureDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  alumnizedAt: z.coerce.date().nullable(),
  'alumni?': z.boolean(),
  'active?': z.boolean(),
});

export const cursusSchema = z.object({
  id: z.number(),
  createdAt: z.coerce.date(),
  name: z.string(),
  slug: z.string(),
  kind: z.string(),
});

export const cursusSchema_ = cursusSchema.passthrough();

export const cursusUserSchema = z.object({
  id: z.number(),
  grade: z.string().nullable(),
  level: z.number(),
  blackholedAt: z.coerce.date().nullable(),
  beginAt: z.coerce.date(),
  endAt: z.coerce.date().nullable(),
  cursusId: z.number(),
  hasCoalition: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  user: userSchema,
  cursus: cursusSchema,
});

export const cursusUserSchema_ = cursusUserSchema
  .omit({ cursus: true })
  .extend({ cursus: cursusSchema_ })
  .passthrough();
