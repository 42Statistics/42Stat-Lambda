import { z } from 'zod';

export const eventSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  location: z.string(),
  kind: z.string(),
  maxPeople: z.number().nullable(),
  // 믿으면 안되는 값
  // nbrSubscribers: z.number(),
  beginAt: z.coerce.date(),
  endAt: z.coerce.date(),
  campusIds: z.number().array(),
  cursusIds: z.number().array(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // prohibition_of_cancellation: z.number().nullable(),
  // waitlist: null,
  // themes: themeSchema,
});

export const eventSchema_ = eventSchema.passthrough();
