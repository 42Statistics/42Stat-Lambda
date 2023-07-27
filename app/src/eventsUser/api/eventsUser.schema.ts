import { eventSchema, eventSchema_ } from '#lambda/event/api/event.schema.js';
import { userSchema } from '#lambda/user/api/user.schema.js';
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
