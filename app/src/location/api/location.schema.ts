import { z } from 'zod';
import { userSchema } from '../../cursusUser/api/cursusUser.schema.js';

export const locationSchema = z.object({
  endAt: z.coerce.date().nullable(),
  id: z.number(),
  beginAt: z.coerce.date(),
  primary: z.boolean(),
  host: z.string(),
  campusId: z.number(),
  user: userSchema,
});
