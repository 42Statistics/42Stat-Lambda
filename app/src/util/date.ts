export const ASIA_SEOUL_TZ_OFFSET = -540;

export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

/**
 *
 * @description
 * 모든 함수는 원본을 변경하지 않습니다.
 */
export class DateWrapper {
  static now(): number {
    return new DateWrapper().getTime();
  }

  private date: Date;

  constructor(ms?: number);
  constructor(date: Date | string);
  constructor(arg?: number | Date | string) {
    this.date = arg !== undefined ? new Date(arg) : new Date();
  }

  getTime(): number {
    return this.date.getTime();
  }

  getUTCHours(): number {
    return this.date.getUTCHours();
  }

  getUTCDay(): number {
    return this.date.getUTCDay();
  }

  getUTCDate(): number {
    return this.date.getUTCDate();
  }

  getUTCMonth(): number {
    return this.date.getUTCMonth();
  }

  moveMs = (ms: number): DateWrapper => {
    return new DateWrapper(this.date.getTime() + ms);
  };

  moveHour = (count: number): DateWrapper => {
    return new DateWrapper(this.date.getTime() + count * HOUR);
  };

  moveDate = (count: number): DateWrapper => {
    return new DateWrapper(this.date.getTime() + count * DAY);
  };

  moveMonth = (
    count: number,
    timezoneOffset = ASIA_SEOUL_TZ_OFFSET,
  ): DateWrapper => {
    const timezoneFix = (timezoneOffset ?? 0) * MIN;
    const utcConvertDate = this.moveMs(-timezoneFix);

    return new DateWrapper(
      utcConvertDate.date.setUTCMonth(
        utcConvertDate.date.getUTCMonth() + count,
      ),
    ).moveMs(timezoneFix);
  };

  setUTCHours(...input: Parameters<Date['setUTCHours']>): number {
    return this.date.setUTCHours(...input);
  }

  startOfDate = (timezoneOffset = ASIA_SEOUL_TZ_OFFSET): DateWrapper => {
    const copy = new DateWrapper(this.date);
    copy.date.setUTCHours(0, timezoneOffset, 0, 0);

    return copy;
  };

  startOfHour = (timezoneOffset = ASIA_SEOUL_TZ_OFFSET): DateWrapper => {
    const copy = new DateWrapper(this.date);
    copy.date.setUTCMinutes(timezoneOffset % 60, 0, 0);

    return copy;
  };

  startOfMonth = (timezoneOffset = ASIA_SEOUL_TZ_OFFSET): DateWrapper => {
    const copy = new Date(this.date.getTime() - timezoneOffset * MIN);
    copy.setUTCDate(1);

    return new DateWrapper(copy).startOfDate(timezoneOffset);
  };

  toDate = (): Date => {
    return new Date(this.date);
  };
}
