import seine, { SeineResult } from 'la-seine';
import { LambdaError } from './error.js';

const getPagedResults = async (
  start: number,
  count: number,
  endpoint: RequestInfo | URL,
  pageSize: number,
): Promise<SeineResult> => {
  for (let i = start; i < count; i++) {
    seine.addRequest(
      `${endpoint.toString()}&page[size]=${pageSize}&page[number]=${i}`,
    );
  }

  return await seine.getResult();
};

export const pagedRequest = async (
  endpoint: RequestInfo | URL,
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

    if (!jsons[jsons.length - 1].length) {
      break;
    }
  }

  return docs;
};
