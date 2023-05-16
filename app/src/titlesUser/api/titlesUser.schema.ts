import { z } from 'zod';

export const titlesUserSchema = z.object({
  id: z.number(),
  userId: z.number(),
  titleId: z.number(),
  selected: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
