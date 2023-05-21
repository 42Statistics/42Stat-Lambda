import { z } from 'zod';
import { eventSchema, eventSchema_ } from '../../event/api/event.schema.js';
import { userSchema } from '../../cursusUser/api/cursusUser.schema.js';

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
