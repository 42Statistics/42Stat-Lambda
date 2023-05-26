import { userSchema } from '#lambda/cursusUser/api/cursusUser.schema.js';
import { z } from 'zod';

export const flagSchema = z.object({
  id: z.number(),
  name: z.string(),
  positive: z.boolean(),
  icon: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const scaleTeamUserSchema = userSchema.pick({
  id: true,
  login: true,
  url: true,
});

const correctedsSchema = z.union([scaleTeamUserSchema.array(), z.string()]);
const correctorSchema = z.union([scaleTeamUserSchema, z.string()]);

export const scaleTeamBaseSchema = z.object({
  id: z.number(),
  scaleId: z.number(),
  comment: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  feedback: z.string().nullable(),
  finalMark: z.number().nullable(),
  flag: flagSchema,
  beginAt: z.coerce.date(),
  correcteds: correctedsSchema,
  corrector: correctorSchema,
  truant: z.union([scaleTeamUserSchema, z.object({})]),
  filledAt: z.coerce.date().nullable(),
  // questionsWithAnswers: [],
});

export const scaleTeamBaseSchema_ = scaleTeamBaseSchema.passthrough();
