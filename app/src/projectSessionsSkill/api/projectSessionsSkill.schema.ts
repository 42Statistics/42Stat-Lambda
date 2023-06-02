import { z } from 'zod';

export const projectSessionsSkillSchema = z.object({
  id: z.number(),
  projectSessionId: z.number(),
  skillId: z.number(),
  value: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const projectSessionsSkillSchema_ =
  projectSessionsSkillSchema.passthrough();
