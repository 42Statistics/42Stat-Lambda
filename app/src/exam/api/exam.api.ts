import { z } from 'zod';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import { examSchema, examSchema_ } from './exam.schema.js';

export type Exam = z.infer<typeof examSchema>;

const UPDATED = (start: Date, end: Date): string =>
  `https://api.intra.42.fr/v2/campus/29/cursus/21/exams?range[updated_at]=${start.toISOString()},${end.toISOString()}&sort=created_at`;

export const EXAM_EP = {
  UPDATED,
} as const;

export const parseExams = (dtos: object[]): z.infer<typeof examSchema_>[] =>
  parseFromDtoMany(dtos, examSchema_, 'exams');
