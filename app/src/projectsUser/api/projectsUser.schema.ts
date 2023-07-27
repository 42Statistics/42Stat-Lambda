import {
  projectBaseSchema,
  projectBaseSchema_,
} from '#lambda/project/api/project.schema.js';
import {
  teamBaseSchema,
  teamBaseSchema_,
} from '#lambda/team/api/team.schema.js';
import { userSchema } from '#lambda/user/api/user.schema.js';
import { z } from 'zod';

export const projectsUserSchema = z.object({
  id: z.number(),
  occurrence: z.number(),
  finalMark: z.number().nullable(),
  status: z.string(),
  'validated?': z.boolean().nullable(),
  currentTeamId: z.number().nullable(),
  project: projectBaseSchema,
  cursusIds: z.number().array(),
  markedAt: z.coerce.date().nullable(),
  marked: z.boolean(),
  retriableAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  user: userSchema,
  teams: teamBaseSchema.array(),
});

export const projectsUserSchema_ = projectsUserSchema
  .omit({
    project: true,
    teams: true,
  })
  .extend({
    project: projectBaseSchema_,
    teams: teamBaseSchema_.array(),
  });
