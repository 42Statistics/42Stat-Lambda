import {
  eventsUserSchema,
  eventsUserSchema_,
} from '#lambda/eventsUser/api/eventsUser.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type EventsUser = z.infer<typeof eventsUserSchema>;

export const EVENTS_USER_EP = 'events_users';

const BY_EVENT = (eventIds: number[]): URL =>
  new FtApiURLBuilder(EVENTS_USER_EP)
    .addFilter('event_id', eventIds.join(','))
    .toURL();

export const EVENTS_USER_API = {
  BY_EVENT,
} as const;

export const parseEventsUsers = (dtos: object[]): EventsUser[] =>
  parseFromDtoMany(dtos, eventsUserSchema_, 'events_users');
