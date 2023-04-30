import seine, { SeineFailedRequest } from 'la-seine';
import { MongoClient } from 'mongodb';
import { ParseParams } from 'zod';

const getPagedResults = async (
  start: number,
  count: number,
  endpoint: RequestInfo | URL,
) => {
  await fs.mkdir('./data', { recursive: true });

  for (let i = start; i < count; i++) {
    seine.addRequest(`${endpoint.toString()}&page[number]=${i}`);
  }

  const result = await seine.getResult();

  if (result.status === 'success') {
    console.log('success');
  } else {
    console.log('error occurred');
  }

  return result;
};

const insertPaged = async (
  client: MongoClient,
  collectionName: string,
  docs: Object[][],
) => {
  for (const doc of docs) {
    if (doc.length === 0) {
      console.log('page end reached');
      break;
    }

    try {
      await client.db().collection(collectionName).insertMany(doc);
      console.log('insert done');
    } catch {
      console.error('insert error');
      try {
        await fs.writeFile(
          `./data/insertFail-${new Date().getTime()}.json`,
          JSON.stringify(doc, null, '  '),
        );
      } catch {
        console.error('error log fail');
      }
    }
  }
};

const logError = async (
  client: MongoClient,
  failedRequests: SeineFailedRequest[],
): Promise<void> => {
  try {
    await client.db().collection('erros').insertMany(failedRequests);
  } catch {
    try {
      await client.db().collection('erros').insertMany(failedRequests);
    } catch {
      console.error('log failed');
    }
  }
};

export const pagedRequest = async <T extends Object>(
  client: MongoClient,
  collectionName: string,
  endpoint: RequestInfo | URL,
  validator: (data: unknown, param?: Partial<ParseParams>) => T[],
): Promise<T[]> => {
  const docs: T[] = [];
  const JUMP = 10;

  for (let start = 1; ; start += JUMP) {
    const currResult = await getPagedResults(start, start + JUMP, endpoint);

    if (currResult.status === 'fail') {
      await logError(client, currResult.failedRequests);
    }

    if (currResult.responses) {
      docs.push(
        ...(await Promise.all(
          currResult.responses.map((response) => response.json()),
        )),
      );
    }
  }

  for (let start = 1; ; start += hint) {
    const currResult = await getPagedResults(start, start + hint, endpoint);

    const docs = currResult.responses
      ? await Promise.all(
          currResult.responses.map((response) => response.json()),
        )
      : null;

    if (docs) {
      await insertPaged(
        client,
        collectionName,
        docs.map((doc) => (validator ? validator(doc) : doc)),
      );
    }

    if (currResult.status === 'fail') {
      await logError(client, currResult.failedRequests);
    }

    if (docs?.find((doc) => doc.length === 0) !== undefined) {
      break;
    }

    if (currResult.status === 'fail') {
      break;
    }
  }
};
