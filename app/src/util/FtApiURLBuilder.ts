import { LambdaError } from './error.js';

// todo
// eslint-disable-next-line
export namespace FtApiURLBuilder {
  export const enum SortOrder {
    ASC,
    DESC,
  }
}

export class FtApiURLBuilder {
  private readonly url: URL;

  private static readonly HOST = 'https://api.intra.42.fr/v2';

  private static readonly FILTER = 'filter';
  private static readonly RANGE = 'range';
  private static readonly SORT = 'sort';

  constructor(endpoint: string) {
    this.url = new URL(
      `${FtApiURLBuilder.HOST}${endpoint.at(0) === '/' ? '' : '/'}${endpoint}`,
    );
  }

  addFilter(key: string, value: string): this {
    if (key === '' || value === '') {
      FtApiURLBuilder.throwError('Wrong filter value');
    }

    this.url.searchParams.append(`${FtApiURLBuilder.FILTER}[${key}]`, value);

    return this;
  }

  addRange(key: string, start: Date, end: Date): this {
    if (key === '' || end.getTime() < start.getTime()) {
      FtApiURLBuilder.throwError('Wrong range value');
    }

    this.url.searchParams.append(
      `${FtApiURLBuilder.RANGE}[${key}]`,
      `${start.toISOString()},${end.toISOString()}`,
    );

    return this;
  }

  addSort(key: string, sortOrder: FtApiURLBuilder.SortOrder): this {
    if (key === '') {
      FtApiURLBuilder.throwError('Wrong sort key');
    }

    this.url.searchParams.append(
      FtApiURLBuilder.SORT,
      `${sortOrder === FtApiURLBuilder.SortOrder.ASC ? '' : '-'}${key}`,
    );

    return this;
  }

  toURL(): URL {
    return this.url;
  }

  private static throwError(message: string): never {
    throw new LambdaError(`${FtApiURLBuilder.name}: ${message}`);
  }
}
