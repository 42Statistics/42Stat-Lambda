import { LambdaError } from '#lambda/util/error.js';
import seine, { SeineResult } from 'la-seine';

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
  for (let i = start; i < end; i++) {
    const currEndpoint = new URL(endpoint);

    currEndpoint.searchParams.append('page[size]', pageSize.toString());
    currEndpoint.searchParams.append('page[number]', i.toString());

    seine.addRequest(currEndpoint);
  }

  return await seine.getResult();
};
