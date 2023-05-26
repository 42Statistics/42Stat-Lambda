import { sleepMs } from '#lambda/util/sleepMs.js';
import { describe, expect, test } from '@jest/globals';

describe('util - sleepMs', () => {
  test('sleeps as wanted', async () => {
    const param = 100;

    const start = new Date();
    await sleepMs(param);
    const end = new Date();

    expect(end.getTime() - start.getTime()).toBeGreaterThanOrEqual(param);
  });
});
