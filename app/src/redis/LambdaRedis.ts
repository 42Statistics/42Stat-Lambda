import { createClient, RedisClientOptions, SetOptions } from 'redis';
import { Bound } from '../util/decorator.js';
import { LambdaError } from '../util/error.js';

export type RedisClient = ReturnType<typeof createClient>;
export type RedisCommandArgument = string | Buffer;
// internal type
export type Types = RedisCommandArgument | number;

export class LambdaRedis {
  static createInstance = async (
    redisClientOptions: RedisClientOptions,
  ): Promise<LambdaRedis> => {
    const client = createClient(redisClientOptions);

    client.on('error', (err): never => {
      throw err;
    });

    await client.connect();

    return new LambdaRedis(client);
  };

  private readonly client: RedisClient;

  private constructor(redisClient: RedisClient) {
    this.client = redisClient;
  }

  @Bound
  @RedisAction
  async setCache(
    key: RedisCommandArgument,
    value: number | RedisCommandArgument,
    options?: SetOptions | undefined,
  ): Promise<void> {
    await this.client.set(key, value, options);
  }

  @Bound
  @RedisAction
  async replaceHashDatasWithId<T extends { id: number }>(
    key: RedisCommandArgument,
    datas: T[],
  ): Promise<void> {
    await this.hsetCacheManyById(`temp${key.toString()}`, datas);
    await this.client.rename(`temp${key.toString()}`, key);
  }

  @Bound
  @RedisAction
  async hsetCacheById<T extends { id: number }>(
    key: RedisCommandArgument,
    data: T,
  ): Promise<void> {
    await this.client.hSet(key, data.id, JSON.stringify(data));
  }

  @Bound
  @RedisAction
  async hsetCacheManyById<T extends { id: number }>(
    key: RedisCommandArgument,
    datas: T[],
  ): Promise<void> {
    await Promise.allSettled(
      datas.map((data) => this.client.hSet(key, data.id, JSON.stringify(data))),
    );
  }

  @Bound
  @RedisAction
  async deleteKeys(keys: string[]): Promise<number> {
    return await this.client.del(keys);
  }

  @Bound
  @RedisAction
  async closeConnection(): Promise<void> {
    await this.client.disconnect();
  }
}

// todo: UpdateAction 으로 통일?
/**
 *
 * @description
 * redis 와 상호작용할 때 발생할 수 있는 exception 을 ```LambdaErorr``` 로 바꿔주는 데코레이터
 * 입니다.
 */
function RedisAction<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): typeof target {
  function replacementMethod(this: This, ...args: Args): Return {
    try {
      const result = target.call(this, ...args);
      return result;
    } catch (e) {
      throw new LambdaError(String(context.name) + JSON.stringify(e));
    }
  }

  return replacementMethod;
}
