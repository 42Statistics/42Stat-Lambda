import { z } from 'zod';

export const campusUserSchema = z.object({
  id: z.number(),
  userId: z.number(),
  campusId: z.number(),
  isPrimary: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const campusUserSchema_ = campusUserSchema.passthrough();
