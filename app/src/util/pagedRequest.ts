import seine, { SeineResult } from 'la-seine';
import { MongoClient } from 'mongodb';
import { logError } from './logError.js';

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
  client: MongoClient,
  endpoint: RequestInfo | URL,
  pageSize: number,
): Promise<unknown[]> => {
  const docs: unknown[] = [];
  const JUMP = 10;

  for (let start = 1; ; start += JUMP) {
    const currResult = await getPagedResults(
      start,
      start + JUMP,
      endpoint,
      pageSize,
    );

    if (currResult.status === 'fail') {
      await logError(client, currResult.failedRequests);
    }

    if (currResult.responses) {
      const jsons: unknown[][] = await Promise.all(
        currResult.responses.map((response) => response.json()),
      );

      docs.push(...jsons.flat());

      if (!jsons[jsons.length - 1].length) {
        break;
      }
    }

    if (currResult.status === 'fail') {
      break;
    }
  }

  return docs;
};
