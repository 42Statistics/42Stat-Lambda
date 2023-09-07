import { beforeEach, describe, expect, it } from '@jest/globals';
import { FtApiURLBuilder } from '../FtApiURLBuilder.js';
import { LambdaError } from '../error.js';

describe('util - FtApiURLBuilder', () => {
  const HOST = 'https://api.intra.42.fr/v2';
  const endpoint = 'endpoint';

  let urlBuilder: FtApiURLBuilder;
  let testUrl: URL;

  beforeEach(() => {
    urlBuilder = new FtApiURLBuilder(endpoint);
    testUrl = new URL(`${HOST}/${endpoint}`);
  });

  it('without params', () => {
    expect(urlBuilder.toURL().toString()).toBe(testUrl.toString());
  });

  describe('filter', () => {
    const key = 'key';
    const value = 'value';

    it('empty filter key, value', () => {
      expect(() => {
        urlBuilder.addFilter(key, '');
      }).toThrowError(LambdaError);

      expect(() => {
        urlBuilder.addFilter('', value);
      }).toThrowError(LambdaError);
    });

    it('normal filter value', () => {
      testUrl.searchParams.append(`filter[${key}]`, value);

      expect(urlBuilder.addFilter(key, value).toURL().toString()).toBe(
        testUrl.toString(),
      );
    });
  });

  describe('range', () => {
    const key = 'key';

    it('normal range value', () => {
      const start = new Date(0);
      const end = new Date(1000);

      testUrl.searchParams.append(
        `range[${key}]`,
        `${start.toISOString()},${end.toISOString()}`,
      );

      expect(urlBuilder.addRange(key, start, end).toURL().toString()).toBe(
        testUrl.toString(),
      );
    });
  });

  describe('sort', () => {
    const key = 'key';

    it('normal sort asc', () => {
      testUrl.searchParams.append('sort', key);

      expect(
        urlBuilder
          .addSort(key, FtApiURLBuilder.SortOrder.ASC)
          .toURL()
          .toString(),
      ).toBe(testUrl.toString());
    });

    it('normal sort desc', () => {
      testUrl.searchParams.append('sort', `-${key}`);

      expect(
        urlBuilder
          .addSort(key, FtApiURLBuilder.SortOrder.DESC)
          .toURL()
          .toString(),
      ).toBe(testUrl.toString());
    });
  });
});
