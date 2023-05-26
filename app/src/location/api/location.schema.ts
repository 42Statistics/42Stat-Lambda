import { userSchema } from '#lambda/cursusUser/api/cursusUser.schema.js';
import { z } from 'zod';

export const locationSchema = z.object({
  endAt: z.coerce.date().nullable(),
  id: z.number(),
  beginAt: z.coerce.date(),
  primary: z.boolean(),
  host: z.string(),
  campusId: z.number(),
  user: userSchema,
});
