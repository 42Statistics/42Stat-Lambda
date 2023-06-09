import {
  campusSchema,
  campusSchema_,
} from '#lambda/campus/api/campus.schema.js';
import {
  cursusSchema,
  cursusSchema_,
} from '#lambda/cursusUser/api/cursusUser.schema.js';
import {
  projectSchema,
  projectSchema_,
} from '#lambda/project/api/project.schema.js';
import { z } from 'zod';

export const examSchema = z.object({
  id: z.number(),
  ipRange: z.string(),
  beginAt: z.coerce.date(),
  endAt: z.coerce.date(),
  location: z.string(),
  maxPeople: z.number().nullable(),
  nbrSubscribers: z.number(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  campus: campusSchema,
  cursus: cursusSchema.array(),
  projects: projectSchema.array(),
});

export const examSchema_ = examSchema
  .omit({
    campus: true,
    cursus: true,
    projects: true,
  })
  .extend({
    campus: campusSchema_,
    cursus: cursusSchema_.array(),
    projects: projectSchema_.array(),
  })
  .passthrough();
