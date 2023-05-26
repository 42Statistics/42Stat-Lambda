import { languageSchema } from '#lambda/language/api/language.schema.js';
import { z } from 'zod';

export const campusSchema = z.object({
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

export const campusSchema_ = campusSchema.passthrough();
