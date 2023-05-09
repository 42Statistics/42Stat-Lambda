import { z } from 'zod';

const userImageSchema = z.object({
  link: z.string().nullable(),
  versions: z
    .object({
      large: z.string().nullable(),
      medium: z.string().nullable(),
      small: z.string().nullable(),
      micro: z.string().nullable(),
    })
    .passthrough(),
});

export const userSchema = z
  .object({
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
  })
  .passthrough();

const cursusSchema = z
  .object({
    id: z.number(),
    createdAt: z.coerce.date(),
    name: z.string(),
    slug: z.string(),
    kind: z.string(),
  })
  .passthrough();

// 언젠가 passthrough 정리...
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
