import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { locationSchema } from '#lambda/location/api/location.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Location = z.infer<typeof locationSchema>;

export const LOCATION_EP = `campus/${SEOUL_CAMPUS_ID}/locations`;

/**
 *
 * @description
 * 어차피 지금 시점에서 로그인 한 사람들이기 때문에, 추가적인 인자가 필요 없음.
 */
const ONGOING = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(LOCATION_EP)
    .addFilter('campus_id', SEOUL_CAMPUS_ID.toString())
    .addFilter('end', 'false')
    .addRange('begin_at', start, end)
    .addSort('begin_at', FtApiURLBuilder.SortOrder.ASC)
    .toURL();

/**
 *
 * @description
 * 갱신 주기보다 짧게 로그가 남을 수 있기 때문에 id 로 endAt null 인 데이터들 받아오는 것과
 * 관계없이 사용해야 함
 */
const ENDED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(LOCATION_EP)
    .addFilter('campus_id', SEOUL_CAMPUS_ID.toString())
    .addFilter('end', 'true')
    .addRange('end_at', start, end)
    .addSort('begin_at', FtApiURLBuilder.SortOrder.ASC)
    .toURL();

export const LOCATION_API = {
  ONGOING,
  ENDED,
} as const;

export const parseLocations = (dtos: object[]): Location[] =>
  parseFromDtoMany(dtos, locationSchema, 'locations');

export const isCluster = (location: Location): boolean =>
  location.host.includes('c') &&
  location.host.includes('r') &&
  location.host.includes('s');
