import seine from 'la-seine';
import { LambdaError } from '../util/error.js';

/**
 *
 * @description
 * 요청 한개만 보내기 위한 함수 입니다.
 * generic 을 사용하여 마지막에 json 결과물을 type assertion 합니다.
 */
export const singleRequest = async <Dto>(endpoint: URL): Promise<Dto> => {
  seine.addRequest(endpoint);

  const result = await seine.getResult();

  if (result.status === 'fail') {
    throw new LambdaError(
      'request failed. url: ' + endpoint.toString(),
      result.failedRequests,
    );
  }

  const dto = (await result.responses[0].json()) as Dto;

  return dto;
};
