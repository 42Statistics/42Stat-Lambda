import { z } from 'zod';
import { zodToCamelCase } from '../../util/toCamelCase.js';

export const userImageSchema = z
  .object({
    link: z.string().nullable(),
    versions: z.object({
      large: z.string().nullable(),
      medium: z.string().nullable(),
      small: z.string().nullable(),
      micro: z.string().nullable(),
    }),
  })
  .passthrough();

export const userSchema = z
  .object({
    id: z.number(),
    email: z.string(),
    login: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    url: z.string(),
    displayname: z.string(),
    kind: z.string(),
    image: userImageSchema.nullable(),
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
  })
  .passthrough();

export const cursusSchema = z
  .object({
    id: z.number(),
    created_at: z.coerce.date(),
    name: z.string(),
    slug: z.string(),
    kind: z.string(),
  })
  .passthrough();

export const cursusUserSchema = zodToCamelCase(
  z
    .object({
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
      user: userSchema,
      cursus: cursusSchema,
    })
    .passthrough(),
);
