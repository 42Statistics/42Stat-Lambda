import {
  scaleTeamBaseSchema,
  scaleTeamBaseSchema_,
} from '#lambda/scaleTeam/api/scaleTeam.schema.base.js';
import { userSchema } from '#lambda/user/api/user.schema.js';
import { z } from 'zod';

const teamUserSchema = userSchema
  .pick({
    id: true,
    login: true,
    url: true,
  })
  .extend({
    leader: z.boolean(),
    occurrence: z.number(),
    validated: z.boolean(),
    projectsUserId: z.number(),
  });

const teamUploadSchema = z.object({
  id: z.number(),
  finalMark: z.number(),
  comment: z.string(),
  createdAt: z.coerce.date(),
  uploadId: z.number(),
});

export const teamBaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  finalMark: z.number().nullable(),
  projectId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  status: z.union([
    z.literal('creating_group'),
    z.literal('in_progress'),
    z.literal('waiting_for_correction'),
    z.literal('finished'),
  ]),
  terminatingAt: z.coerce.date().nullable(),
  'locked?': z.boolean(),
  'validated?': z.boolean().nullable(),
  'closed?': z.boolean(),
  // repoUrl: z.string(),
  // repoUuid: z.string(),
  lockedAt: z.coerce.date().nullable(),
  closedAt: z.coerce.date().nullable(),
  projectSessionId: z.number(),
  // projectGitlabPath: z.string().nullable(),
  users: teamUserSchema.array(),
});

export const teamBaseSchema_ = teamBaseSchema.passthrough();

export const teamSchema = teamBaseSchema.extend({
  teamsUploads: teamUploadSchema.array(),
  scaleTeams: scaleTeamBaseSchema.array(),
});

export const teamSchema_ = teamBaseSchema_
  .extend({
    teamsUploads: teamUploadSchema.array(),
    scaleTeams: scaleTeamBaseSchema_.array(),
  })
  .passthrough();
