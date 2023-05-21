import { z } from 'zod';

export const languageSchema = z.object({
  id: z.number(),
  name: z.string(),
  identifier: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
