import { createClient, SetOptions } from 'redis';
import { assertEnvExist } from '../util/envCheck.js';
import { LambdaError } from '../util/error.js';

export type RedisClient = ReturnType<typeof createClient>;
export type RedisCommandArgument = string | Buffer;
// internal type
export type Types = RedisCommandArgument | number;

export const createRedisClient = async (): Promise<RedisClient> => {
  const url = process.env.REDIS_URL;

  assertEnvExist(url);

  const client = createClient({ url });

  client.on('error', (err): never => {
    throw err;
  });

  // await client.connect();

  return client;
};

export const setCache = async (
  redisClient: RedisClient,
  key: RedisCommandArgument,
  value: number | RedisCommandArgument,
  options?: SetOptions | undefined,
): Promise<void> => {
  try {
    await redisClient.set(key, value, options);
  } catch (e) {
    throw new LambdaError('redis set data fail' + JSON.stringify(e));
  }
};

// todo
export const hsetCacheById = async <T extends { id: number }>(
  redisClient: RedisClient,
  key: RedisCommandArgument,
  data: T,
): Promise<void> => {
  try {
    await redisClient.hSet(key, data.id, JSON.stringify(data));
  } catch (e) {}
};

export const hsetCacheManyById = async <T extends { id: number }>(
  redisClient: RedisClient,
  key: RedisCommandArgument,
  datas: T[],
): Promise<void> => {
  try {
    await Promise.allSettled(
      datas.map((data) => redisClient.hSet(key, data.id, JSON.stringify(data))),
    );
  } catch (e) {}
};
