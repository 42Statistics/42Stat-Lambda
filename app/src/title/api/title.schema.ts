import { z } from 'zod';

export const titleSchema = z.object({
  id: z.number(),
  name: z.string(),
});
