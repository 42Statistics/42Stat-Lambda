import seine, { SeineResult } from 'la-seine';
import { LambdaError } from './error.js';

export const pagedRequest = async (
  endpoint: URL,
  pageSize = 100,
  chunkSize = 10,
): Promise<object[]> => {
  const docs: object[] = [];

  for (let start = 1; ; start += chunkSize) {
    const currResult = await getPagedResults(
      start,
      start + chunkSize,
      endpoint,
      pageSize,
    );

    if (currResult.status === 'fail') {
      throw new LambdaError(
        'pagedRequest failed. url: ' + endpoint.toString(),
        currResult.failedRequests,
      );
    }

    const jsons: object[][] = await Promise.all(
      currResult.responses.map(
        (response) => response.json() as Promise<object[]>,
      ),
    );

    docs.push(...jsons.flat());

    if (jsons[jsons.length - 1].length < pageSize) {
      break;
    }
  }

  return docs;
};

export const getPagedResults = async (
  start: number,
  end: number,
  endpoint: URL,
  pageSize: number,
): Promise<SeineResult> => {
  const hasParams = endpoint.searchParams.keys().next().done !== true;

  for (let i = start; i < end; i++) {
    seine.addRequest(
      `${endpoint.toString()}${
        hasParams ? '&' : '?'
      }page[size]=${pageSize}&page[number]=${i}`,
    );
  }

  return await seine.getResult();
};
