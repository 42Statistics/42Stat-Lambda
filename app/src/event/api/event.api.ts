import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { eventSchema, eventSchema_ } from '#lambda/event/api/event.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Event = z.infer<typeof eventSchema>;

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/campus/${SEOUL_CAMPUS_ID}/cursus/21/events?range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const EVENT_EP = {
  UPDATED,
} as const;

export const parseEvents = (dtos: object[]): Event[] =>
  parseFromDtoMany(dtos, eventSchema_, 'events');
