import seine from 'la-seine';
import { LambdaError } from './error.js';
import { getPagedResults } from './pagedRequest.js';

export const pagedRequestByCount = async (
  endpoint: URL,
  currDocCount: number,
  pageSize = 100,
): Promise<object[]> => {
  const intraDocCount = await fetchIntraDocCount(endpoint);

  if (intraDocCount === currDocCount) {
    return [];
  }

  const startPage = 1 + Math.floor(currDocCount / pageSize);
  const count =
    1 +
    Math.floor(
      (intraDocCount - Math.floor(currDocCount / pageSize) * pageSize) /
        pageSize,
    );

  const result = await getPagedResults(
    startPage,
    startPage + count,
    endpoint,
    pageSize,
  );

  if (result.status === 'fail') {
    throw new LambdaError(
      'pagedRequestByCount failed. url: ' + String(endpoint),
      result.failedRequests,
    );
  }

  const docs = await Promise.all(
    result.responses.map((response) => response.json() as Promise<object[]>),
  );

  return docs.reduce((acc, doc) => {
    acc.push(...doc);
    return acc;
  }, []);
};

const fetchIntraDocCount = async (endpoint: URL): Promise<number> => {
  seine.addRequest(endpoint);
  const result = await seine.getResult();

  if (result.status !== 'success') {
    throw new LambdaError(
      'fetch intra doc count failed. url: ' + String(endpoint),
      result.failedRequests,
    );
  }

  const xTotalHeader = result.responses[0].headers.get('X-Total');
  if (!xTotalHeader) {
    throw new LambdaError('X-Total not exist in url: ' + String(endpoint));
  }

  // 현실적으로 exception 발생 안할거라 추정 중
  return parseInt(xTotalHeader);
};
