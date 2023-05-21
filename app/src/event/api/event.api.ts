import { z } from 'zod';
import { eventSchema, eventSchema_ } from './event.schema.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';

export type Event = z.infer<typeof eventSchema>;

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/campus/29/cursus/21/events?range[updated_at]=${start.toISOString()},${end.toISOString()}`,
  );

export const EVENT_EP = {
  UPDATED,
} as const;

export const parseEvents = (dtos: object[]): Event[] =>
  parseFromDtoMany(dtos, eventSchema_, 'events');
