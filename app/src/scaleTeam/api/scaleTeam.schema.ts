import { languageSchema } from '#lambda/language/api/language.schema.js';
import {
  flagSchema,
  scaleTeamBaseSchema,
} from '#lambda/scaleTeam/api/scaleTeam.schema.base.js';
import {
  teamBaseSchema,
  teamBaseSchema_,
} from '#lambda/team/api/team.schema.js';
import { userSchema } from '#lambda/user/api/user.schema.js';
import { z } from 'zod';

const scaleSchema = z.object({
  id: z.number(),
  evaluationId: z.number(),
  name: z.string(),
  isPrimary: z.boolean(),
  comment: z.string(),
  introductionMd: z.string(),
  disclaimerMd: z.string(),
  guidelinesMd: z.string(),
  createdAt: z.coerce.date(),
  correctionNumber: z.number(),
  duration: z.number(),
  manualSubscription: z.boolean(),
  languages: languageSchema.array(),
  flags: flagSchema.array(),
  free: z.boolean(),
});

const feedbackSchema = z.object({
  id: z.number(),
  user: userSchema.pick({ id: true, login: true, url: true }).nullable(),
  feedbackableType: z.string(),
  feedbackableId: z.number(),
  comment: z.string(),
  rating: z.number().nullable(),
  createdAt: z.coerce.date(),
});

export const scaleTeamSchema = scaleTeamBaseSchema.extend({
  scale: scaleSchema,
  team: teamBaseSchema,
  feedbacks: feedbackSchema.array(),
});

export const scaleTeamSchema_ = scaleTeamSchema
  .omit({ team: true })
  .extend({ team: teamBaseSchema_ })
  .passthrough();
