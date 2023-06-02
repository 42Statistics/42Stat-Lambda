import { z } from 'zod';

export const skillSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
});

export const skillSchema_ = skillSchema.passthrough();
