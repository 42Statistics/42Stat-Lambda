import { MongoClient } from 'mongodb';
import {
  getCollectionUpdatedAt,
  setCollectionUpdatedAt,
  upsertManyById,
} from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequest } from '../util/pagedRequest.js';
import { EXAM_EP, Exam, parseExams } from './api/exam.api.js';

export const EXAMS_COLLECTION = 'exams';

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
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateUpdated(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateUpdated(mongoClient: MongoClient): Promise<void> {
    const start = await getCollectionUpdatedAt(mongoClient, EXAMS_COLLECTION);
    const end = new Date();

    const created = await this.fetchCreated(start, end);

    // bug resolving start

    const createdMap = new Map<number, Exam>();

    created.forEach((exam) => createdMap.set(exam.id, exam));

    const createdFixed = [...createdMap.values()];

    // bug resolving end

    await upsertManyById(mongoClient, EXAMS_COLLECTION, createdFixed);
    await setCollectionUpdatedAt(mongoClient, EXAMS_COLLECTION, end);
  }

  @FetchApiAction
  private static async fetchCreated(start: Date, end: Date): Promise<Exam[]> {
    const examDtos = await pagedRequest(EXAM_EP.UPDATED(start, end), 100, 1);

    return parseExams(examDtos);
  }
}
