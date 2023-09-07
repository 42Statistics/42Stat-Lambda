import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import { eventSchema, eventSchema_ } from '#lambda/event/api/event.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Event = z.infer<typeof eventSchema>;

export const EVENT_EP = `campus/${SEOUL_CAMPUS_ID}/cursus/${FT_CURSUS_ID}/events`;

const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(EVENT_EP).addRange('updated_at', start, end).toURL();

export const EVENT_API = {
  UPDATED,
} as const;

export const parseEvents = (dtos: object[]): Event[] =>
  parseFromDtoMany(dtos, eventSchema_, 'events');
