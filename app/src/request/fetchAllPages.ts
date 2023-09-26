import { LambdaError } from '#lambda/util/error.js';
import seine, { SeineResult } from 'la-seine';

type StartPageInfo = {
  totalCount: number;
  dtos: object[];
};

/**
 *
 * @description
 * 42 api 로 요청을 한번 보내어 총 몇개의 데이터를 받아와야 하는지 확인하고, 필요한 만큼 요청을 추가로
 * 보내어 데이터를 받아와 반환합니다.
 *
 * @param startPage 1 이상의 정수. 처음부터 모든 데이터를 받아와야 하는 경우 1을 인자로 넘길 수
 * 있고, 이것이 기본값 입니다.
 * @param pageSize 1 ~ 100 사이의 정수. 100이 기본값 입니다.
 *
 * @example
 * ```ts
 * // 처음부터 모든 데이터를 받아오고 싶은 경우, 기본값을 사용하면 됨.
 * const dtos = await fecthAllPages(endpoint);
 *
 * // 특정 페이지부터 모든 데이터를 받아오고 싶은 경우
 * const currDocCount = await mongo.db().collection('test').estimatedDocumentCount();
 * const startPage = Math.floor(currDocCount / 100);
 * const dtos = await fecthAllPages(endpoint, startPage);
 * ```
 */
export const fetchAllPages = async (
  endpoint: URL,
  startPage = 1,
  pageSize = 100,
): Promise<object[]> => {
  const startPageInfo = await fetchStartPage(endpoint, startPage, pageSize);
  const count = 1 + Math.floor(startPageInfo.totalCount / pageSize) - startPage;

  if (!count) {
    return startPageInfo.dtos;
  }

  const seineResult = await fetchRestPages(
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

  try {
    return docs.reduce((acc, doc) => {
      acc.push(...doc);
      return acc;
    }, startPageInfo.dtos);
  } catch (e) {
    console.error('startPage', JSON.stringify(startPageInfo.dtos, null, '  '));
    console.error('doc', JSON.stringify(docs, null, '  '));

    throw e;
  }
};

const fetchStartPage = async (
  endpoint: URL,
  startPage: number,
  pageSize: number,
): Promise<StartPageInfo> => {
  const currEndpoint = new URL(endpoint);

  currEndpoint.searchParams.append('page[size]', pageSize.toString());
  currEndpoint.searchParams.append('page[number]', startPage.toString());

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

const fetchRestPages = async (
  start: number,
  count: number,
  endpoint: URL,
  pageSize: number,
): Promise<SeineResult> => {
  for (let i = 0; i < count; i++) {
    const currEndpoint = new URL(endpoint);

    currEndpoint.searchParams.append('page[size]', pageSize.toString());
    currEndpoint.searchParams.append('page[number]', (start + i).toString());

    seine.addRequest(currEndpoint);
  }

  return await seine.getResult();
};

function assertsSeineSuccess(seineResult: SeineResult): void {
  if (seineResult.status === 'fail') {
    throw new LambdaError(
      'fecthAllPages failed. url: ' + String(seineResult.failedRequests[0].url),
      seineResult.failedRequests,
    );
  }
}
