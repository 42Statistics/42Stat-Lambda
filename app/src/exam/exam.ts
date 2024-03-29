import { EXAM_API, Exam, parseExams } from '#lambda/exam/api/exam.api.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import { fetchAllPages } from '#lambda/request/fetchAllPages.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '#lambda/util/decorator.js';

export const EXAM_COLLECTION = 'exams';

// eslint-disable-next-line
export class ExamUpdator {
  /**
   *
   * @description
   * @see updateUpdated   U: 갱신 된 exam
   *
   * 2023-05 기준
   * 필요 요청 수: U(1)
   * 예상 소요 시간: 3초
   *
   * 버그가 있는 것을 제외하면 그다지 변수는 없음.
   */
  static async update(mongo: LambdaMongo, end: Date): Promise<void> {
    await ExamUpdator.updateUpdated(mongo, end);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(
    mongo: LambdaMongo,
    end: Date,
  ): Promise<void> {
    await mongo.withCollectionUpdatedAt({
      end,
      collection: EXAM_COLLECTION,
      callback: async (start, end) => {
        const created = await ExamUpdator.fetchCreated(start, end);

        // bug resolving start

        const createdMap = new Map<number, Exam>();

        created.forEach((exam) => createdMap.set(exam.id, exam));

        const createdFixed = [...createdMap.values()];

        // bug resolving end

        await mongo.upsertManyById(EXAM_COLLECTION, createdFixed);
      },
    });
  }

  @FetchApiAction
  private static async fetchCreated(start: Date, end: Date): Promise<Exam[]> {
    const examDtos = await fetchAllPages(EXAM_API.UPDATED(start, end));

    return parseExams(examDtos);
  }
}
