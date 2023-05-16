import { z } from 'zod';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import { locationSchema, locationSchema_ } from './location.schema.js';

export type Location = z.infer<typeof locationSchema>;

/**
 *
 * @description
 * 어차피 지금 시점에서 로그인 한 사람들이기 때문에, 추가적인 인자가 필요 없음.
 */
const ONGOING = (): URL =>
  new URL(
    `https://api.intra.42.fr/v2/campus/29?filter[campus_id]=29&filter[end]=false`,
  );

const ENDED = (start: Date, end: Date): URL =>
  new URL(
    // todo: campus id 분리
    `https://api.intra.42.fr/v2/campus/29?filter[campus_id]=29&filter[end]=true&range[end_at]=${start.toISOString()},${end.toISOString()}&sort=begin_at`,
  );

export const LOCATION_EP = {
  ONGOING,
  ENDED,
} as const;

export const parseLocations = (dtos: object[]): Location[] =>
  parseFromDtoMany(dtos, locationSchema_, 'locations');
