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

const EXAMS_COLLECTION = 'exams';

// eslint-disable-next-line
export class ExamUpdator {
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateCreated(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateCreated(mongoClient: MongoClient): Promise<void> {
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
    const examDtos = await pagedRequest(
      EXAM_EP.EXAM_CREATED(start, end),
      100,
      10,
    );

    return parseExams(examDtos);
  }
}
