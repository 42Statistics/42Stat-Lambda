import { z } from 'zod';
import {
  userSchema,
  userSchema_,
} from '../../cursusUser/api/cursusUser.schema.js';

export const locationSchema = z.object({
  endAt: z.coerce.date().nullable(),
  id: z.number(),
  beginAt: z.coerce.date(),
  primary: z.boolean(),
  host: z.string(),
  campusId: z.number(),
  user: userSchema,
});

export const locationSchema_ = locationSchema
  .omit({ user: true })
  .extend({ user: userSchema_ })
  .passthrough();
