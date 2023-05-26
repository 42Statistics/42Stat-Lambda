import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { LambdaError, logError } from '#lambda/util/error.js';
import { sleepMs } from '#lambda/util/sleepMs.js';

/**
 *
 * @description
 * class method 들에 this 를 bind 하여 오류를 방지해주는 데코레이터 입니다.
 */
export function Bound(
  originalMethod: any,
  context: ClassMethodDecoratorContext,
): void {
  const methodName = context.name;

  if (context.private) {
    throw new Error(
      `'bound' cannot decorate private properties like ${String(methodName)}.`,
    );
  }

  context.addInitializer(function (this: any) {
    this[methodName] = this[methodName].bind(this);
  });
}

/**
 *
 * @description
 * 비동기 함수들의 실행 시간을 콘솔에 출력해주는 데코레이터 입니다.
 */
export function LogAsyncEstimatedTime<
  This extends { name: string },
  Args extends any[],
  Return,
>(
  target: (this: This, ...args: Args) => Promise<Return>,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Promise<Return>
  >,
): typeof target {
  async function replacementMethod(this: This, ...args: Args): Promise<Return> {
    const start = new Date();
    const result = await target.call(this, ...args);
    const end = new Date();

    console.log(
      String(this.name),
      String(context.name),
      end.getTime() - start.getTime() + 'ms',
    );

    return result;
  }

  return replacementMethod;
}

/**
 *
 * @description
 * 실행 중 exception 이 발생해도 다른 함수들에 영향을 주지 않아야 하는 함수들을 위한 데코레이터 입니다.
 * exception 발생 시, mongodb 에 로그를 작성하고, exception 을 밖으로 보내지 않습니다.
 */
export function UpdateAction<This, Args extends any[], Return>(
  target: (this: This, mongo: LambdaMongo, ...args: Args) => Promise<void>,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, mongo: LambdaMongo, ...args: Args) => void
  >,
): typeof target {
  async function replacementMethod(
    this: This,
    mongo: LambdaMongo,
    ...args: Args
  ): Promise<void> {
    try {
      await target.call(this, mongo, ...args);
    } catch (e) {
      try {
        if (e instanceof LambdaError) {
          await logError(mongo, e);
        }
      } catch {
      } finally {
        console.error(e);
      }
    }
  }

  return replacementMethod;
}

/**
 *
 * @description
 * 42 api 에 요청을 보내는 함수들의 실행 종료 후 1초를 기다려 api client 의 rate limit 을
 * 초기화 시켜주는 데코레이터 입니다.
 */
export function FetchApiAction<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Promise<Return>,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Promise<Return>
  >,
): typeof target {
  async function replacementMethod(this: This, ...args: Args): Promise<Return> {
    const result = await target.call(this, ...args);
    await sleepMs(1000);
    return result;
  }

  return replacementMethod;
}
