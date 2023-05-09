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

const flagSchema_ = flagSchema.passthrough();

const scaleTeamUserSchema = userSchema.pick({
  id: true,
  login: true,
  url: true,
});

const scaleTeamUserSchema_ = scaleTeamUserSchema.passthrough();

const correctedsSchema = z.union([scaleTeamUserSchema.array(), z.string()]);
const correctedsSchema_ = z.union([scaleTeamUserSchema_.array(), z.string()]);

const correctorSchema = z.union([scaleTeamUserSchema, z.string()]);
const correctorSchema_ = z.union([scaleTeamUserSchema_, z.string()]);

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

export const scaleTeamBaseSchema_ = scaleTeamBaseSchema
  .omit({
    flag: true,
    correcteds: true,
    corrector: true,
  })
  .extend({
    flag: flagSchema_,
    correcteds: correctedsSchema_,
    corrector: correctorSchema_,
  })
  .passthrough();
