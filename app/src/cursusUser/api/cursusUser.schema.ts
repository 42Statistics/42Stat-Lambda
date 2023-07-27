import { userSchema } from '#lambda/user/api/user.schema.js';
import { z } from 'zod';

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
