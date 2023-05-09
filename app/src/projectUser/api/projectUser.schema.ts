import { z } from 'zod';
import {
  userSchema,
  userSchema_,
} from '../../cursusUser/api/cursusUser.schema.js';
import {
  projectBaseSchema,
  projectBaseSchema_,
} from '../../project/api/project.schema.js';
import { teamBaseSchema, teamBaseSchema_ } from '../../team/api/team.schema.js';

export const projectUserSchema = z.object({
  id: z.number(),
  occurrence: z.number(),
  finalMark: z.number().nullable(),
  status: z.string(),
  'validated?': z.boolean().nullable(),
  currentTeamId: z.number().nullable(),
  project: projectBaseSchema,
  cursusIds: z.number().array(),
  markedAt: z.coerce.date(),
  marked: z.boolean(),
  retriableAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  user: userSchema,
  teams: teamBaseSchema.array(),
});

export const projectUserSchema_ = projectUserSchema
  .omit({
    project: true,
    user: true,
    teams: true,
  })
  .extend({
    project: projectBaseSchema_,
    user: userSchema_,
    teams: teamBaseSchema_.array(),
  });
