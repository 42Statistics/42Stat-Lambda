import { userSchema } from '#lambda/cursusUser/api/cursusUser.schema.js';
import { eventSchema, eventSchema_ } from '#lambda/event/api/event.schema.js';
import { z } from 'zod';

export const eventsUserSchema = z.object({
  id: z.number(),
  eventId: z.number(),
  userId: z.number(),
  user: userSchema,
  event: eventSchema,
});

export const eventsUserSchema_ = eventsUserSchema
  .omit({ event: true })
  .extend({ event: eventSchema_ })
  .passthrough();
