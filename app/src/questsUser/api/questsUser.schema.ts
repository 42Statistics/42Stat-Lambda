import { z } from 'zod';
import { userSchema } from '../../cursusUser/api/cursusUser.schema.js';
import { userSchema_ } from '../../cursusUser/api/cursusUser.schema.js';

const questSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  kind: z.string(),
  internalName: z.string(),
  // description: z.string(),
  // cursusId: z.number(),
  // campusId: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // gradeId: z.number().nullable(),
  // position: z.number(),
});

const questSchema_ = questSchema.passthrough();

export const questsUserSchema = z.object({
  id: z.number(),
  endAt: z.coerce.date().nullable(),
  questId: z.number(),
  validatedAt: z.coerce.date().nullable(),
  // prct: null,
  // advancement: null,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  user: userSchema,
  quest: questSchema,
});

export const questsUserSchema_ = questsUserSchema
  .omit({ quest: true, user: true })
  .extend({ quest: questSchema_, user: userSchema_ })
  .passthrough();
