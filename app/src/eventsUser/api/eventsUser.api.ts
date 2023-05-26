import {
  eventsUserSchema,
  eventsUserSchema_,
} from '#lambda/eventsUser/api/eventsUser.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type EventsUser = z.infer<typeof eventsUserSchema>;

const BY_EVENT = (eventIds: number[]): URL =>
  new URL(
    `https://api.intra.42.fr/v2/events_users?filter[event_id]=${eventIds.join(
      ',',
    )}`,
  );

export const EVENTS_USER_EP = {
  BY_EVENT,
} as const;

export const parseEventsUsers = (dtos: object[]): EventsUser[] =>
  parseFromDtoMany(dtos, eventsUserSchema_, 'events_users');
