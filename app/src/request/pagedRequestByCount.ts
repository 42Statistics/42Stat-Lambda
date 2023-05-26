import seine, { SeineResult, SeineSuccess } from 'la-seine';
import { LambdaError } from '../util/error.js';
import { getPagedResults } from './pagedRequest.js';

type StartPageInfo = {
  totalCount: number;
  dtos: object[];
};

export const pagedRequestByCount = async (
  endpoint: URL,
  startPage: number,
  pageSize = 100,
): Promise<object[]> => {
  const startPageInfo = await fetchStartPage(endpoint, startPage, pageSize);
  const count = 1 + startPageInfo.totalCount / pageSize - startPage;

  console.info('pageInfo', startPageInfo.totalCount, count);

  if (!count) {
    return startPageInfo.dtos;
  }

  const seineResult = await getPagedResults(
    startPage + 1,
    count,
    endpoint,
    pageSize,
  );

  assertsSeineSuccess(seineResult);

  const docs = await Promise.all(
    seineResult.responses.map(
      (response) => response.json() as Promise<object[]>,
    ),
  );

  console.log('fetched', docs.length + 1);

  return docs.reduce((acc, doc) => {
    acc.push(...doc);
    return acc;
  }, startPageInfo.dtos);
};

const fetchStartPage = async (
  endpoint: URL,
  startPage: number,
  pageSize: number,
): Promise<StartPageInfo> => {
  const currEndpoint = new URL(endpoint);
  currEndpoint.searchParams.append('page[number]', startPage.toString());
  currEndpoint.searchParams.append('page[size]', pageSize.toString());

  seine.addRequest(currEndpoint);

  const seineResult = await seine.getResult();
  assertsSeineSuccess(seineResult);

  const response = seineResult.responses[0];

  const xTotalHeader = response.headers.get('X-Total');
  if (!xTotalHeader) {
    throw new LambdaError('X-Total not exist in url: ' + String(endpoint));
  }

  const totalCount = parseInt(xTotalHeader);
  const dtos = (await response.json()) as object[];

  return {
    totalCount,
    dtos,
  };
};

function assertsSeineSuccess(
  seineResult: SeineResult,
): asserts seineResult is SeineSuccess {
  if (seineResult.status === 'fail') {
    throw new LambdaError(
      'pagedRequestByCount failed. url: ' +
        String(seineResult.failedRequests[0].url),
      seineResult.failedRequests,
    );
  }
}
