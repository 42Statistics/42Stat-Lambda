import { z } from 'zod';

export const projectBaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  // parent_id: null,
});

export const projectBaseSchema_ = projectBaseSchema.passthrough();

export const projectSchema = projectBaseSchema.extend({
  difficulty: z.number().nullable(),
  // children: [],
  // attachments: [],
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  exam: z.boolean(),
  // gitId: z.,
  // repository: null,
});

export const projectSchema_ = projectSchema.passthrough();
