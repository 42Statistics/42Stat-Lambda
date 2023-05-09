import { z } from 'zod';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import { examSchema, examSchema_ } from './exam.schema.js';

export type Exam = z.infer<typeof examSchema>;

const CREATED = (start: Date, end: Date): string =>
  `https://api.intra.42.fr/v2/campus/29/cursus/21/exams?range[updated_at]=${start.toISOString()},${end.toISOString()}`;

export const EXAM_EP = {
  EXAM_CREATED: CREATED,
} as const;

export const parseExams = (dtos: object[]): z.infer<typeof examSchema_>[] =>
  parseFromDtoMany(dtos, examSchema_, 'exams');
