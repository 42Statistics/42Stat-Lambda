import { z } from 'zod';
import { eventSchema, eventSchema_ } from '../../event/api/event.schema.js';
import {
  userSchema,
  userSchema_,
} from '../../cursusUser/api/cursusUser.schema.js';

export const eventsUserSchema = z.object({
  id: z.number(),
  eventId: z.number(),
  userId: z.number(),
  user: userSchema,
  event: eventSchema,
});

export const eventsUserSchema_ = eventsUserSchema
  .omit({ user: true, event: true })
  .extend({ user: userSchema_, event: eventSchema_ })
  .passthrough();
