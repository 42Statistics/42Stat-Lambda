import { z } from 'zod';

export const scoreSchema = z.object({
  id: z.number(),
  coalitionId: z.number(),
  // scoreable_id: z.nullable(z.coerce.string()),
  // scoreable_type: z.nullable(z.string()),
  coalitionsUserId: z.nullable(z.number()),
  // calculation_id: z.nullable(z.coerce.string()),
  value: z.number(),
  // reason: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const scoreSchema_ = scoreSchema.passthrough();
