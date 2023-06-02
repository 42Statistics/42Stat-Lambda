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

const projectSessionScaleSchema = z.object({
  id: z.number(),
  correctionNumber: z.number().nullable(),
  isPrimary: z.boolean(),
});

const projectSessionUploadSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const projectSessionEvaluationSchema = z.object({
  id: z.number(),
  kind: z.string(),
});

const projectSessionRuleParamSchema = z.object({
  id: z.number(),
  paramId: z.number(),
  projectSessionsRuleId: z.number(),
  value: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const projectSessionRuleSchema = z.object({
  id: z.number(),
  required: z.boolean(),
  position: z.number(),
  params: projectSessionRuleParamSchema.array(),
  rule: z.object({
    id: z.number(),
    kind: z.string(),
    name: z.string(),
    description: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    slug: z.string(),
    internalName: z.string(),
  }),
});

const projectSessionRuleSchema_ = projectSessionRuleSchema
  .omit({ params: true })
  .extend({ params: projectSessionRuleParamSchema.passthrough().array() })
  .passthrough();

export const projectSessionSchema = z.object({
  id: z.number(),
  solo: z.boolean().nullable(),
  beginAt: z.coerce.date().nullable(),
  endAt: z.coerce.date().nullable(),
  estimateTime: z.string().nullable(),
  difficulty: z.number().nullable(),
  objectives: z.string().array().nullable(),
  description: z.string().nullable(),
  durationDays: z.number().nullable(),
  terminatingAfter: z.number().nullable(),
  projectId: z.number(),
  campusId: z.number().nullable(),
  cursusId: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  maxPeople: z.number().nullable(),
  isSubscriptable: z.boolean().nullable(),
  scales: projectSessionScaleSchema.array(),
  uploads: projectSessionUploadSchema.array(),
  teamBehaviour: z.string(),
  commit: z.string().nullable(),
  project: projectSchema,
  campus: campusSchema.nullable(),
  cursus: cursusSchema.nullable(),
  evaluations: projectSessionEvaluationSchema.array(),
  projectSessionsRules: projectSessionRuleSchema.array(),
});

export const projectSessionSchema_ = projectSessionSchema
  .omit({
    scales: true,
    uploads: true,
    project: true,
    campus: true,
    cursus: true,
    evaluations: true,
    projectSessionsRules: true,
  })
  .extend({
    scales: projectSessionScaleSchema.passthrough().array(),
    uploads: projectSessionUploadSchema.passthrough().array(),
    project: projectSchema_,
    campus: campusSchema_.nullable(),
    cursus: cursusSchema_.nullable(),
    evaluations: projectSessionEvaluationSchema.passthrough().array(),
    projectSessionsRules: projectSessionRuleSchema_.array(),
  })
  .passthrough();
