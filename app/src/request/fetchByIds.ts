import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { LambdaError } from '#lambda/util/error.js';
import { fetchAllPages } from './fetchAllPages.js';

/**
 *
 * @description
 * id 베열을 기반으로 42 api 요청을 보내어 반환합니다.
 * id 를 filter 에 지나치게 많이 넣는 경우 502 에러가 발생하기 때문에 이를 추상화 하는 함수 입니다.
 */
export const fetchByIds = async (
  endpoint: string,
  ids: number[],
): Promise<object[]> => {
  if (!ids.length) {
    throw new LambdaError('empty id array');
  }

  const accObjects: object[] = [];

  for (let i = 0; i < ids.length; i += 100) {
    const currIds = ids.slice(i, Math.min(ids.length, i + 100));
    const currUrl = new FtApiURLBuilder(endpoint);

    currUrl.addFilter('id', currIds.join(','));

    const currOjects = await fetchAllPages(currUrl.toURL());
    accObjects.push(...currOjects);
  }

  return accObjects;
};
