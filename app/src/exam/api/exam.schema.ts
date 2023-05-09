import { z } from 'zod';
import {
  cursusSchema,
  cursusSchema_,
} from '../../cursusUser/api/cursusUser.schema.js';

const languageSchema = z.object({
  id: z.number(),
  name: z.string(),
  identifier: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const languageSchema_ = languageSchema.passthrough();

const campusSchema = z.object({
  id: z.number(),
  name: z.string(),
  timeZone: z.string(),
  language: languageSchema,
  usersCount: z.number(),
  // vogsphereId: z.number(),
  // country: z.string(),
  // address: 'Gaepo Digital Innovation Park, 416, Gaepo-ro, Gangnam-gu,',
  // zip: '06324',
  // city: 'Seoul',
  // website: 'https://www.42seoul.kr',
  // facebook: 'https://www.facebook.com/inno.aca/  ',
  // twitter: '',
  // active: true,
  // public: true,
  // emailExtension: '42seoul.kr',
  // defaultHiddenPhone: false,
});

const campusSchema_ = campusSchema
  .omit({ language: true })
  .extend({ language: languageSchema_ })
  .passthrough();

const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  difficulty: z.number(),
  // parent: z.string,
  // children: [],
  // attachments: [],
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  exam: z.boolean(),
  // gitId: z.,
  // repository: null,
});

const projectSchema_ = projectSchema.passthrough();

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
