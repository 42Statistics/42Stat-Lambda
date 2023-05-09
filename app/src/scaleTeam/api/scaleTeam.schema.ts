import { z } from 'zod';
import { userSchema } from '../../cursusUser/api/cursusUser.schema.js';

const flagSchema = z.object({
  id: z.number(),
  name: z.string(),
  positive: z.boolean(),
  // icon: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const scaleTeamUserSchema = userSchema.pick({
  id: true,
  login: true,
  url: true,
});

export const scaleTeamBaseSchema = z.object({
  id: z.number(),
  scaleId: z.number(),
  comment: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  feedback: z.string().nullable(),
  final_mark: z.number().nullable(),
  flag: flagSchema, // todo: nullable?
  beginAt: z.coerce.date(),
  correcteds: z.union([scaleTeamUserSchema.array(), z.string()]),
  corrector: z.union([scaleTeamUserSchema, z.string()]),
  truant: z.union([scaleTeamUserSchema, z.object({})]),
  filledAt: z.coerce.date().nullable(),
  // questionsWithAnswers: [],
});

export const scaleTeamBaseSchema_ = scaleTeamBaseSchema
  .omit({
    flag: true,
    correcteds: true,
    corrector: true,
  })
  .extend({
    flag: flagSchema.passthrough(),
    correcteds: z.union([scaleTeamUserSchema.passthrough(), z.string()]),
    corrector: z.union([scaleTeamUserSchema.passthrough(), z.string()]),
  })
  .passthrough();
