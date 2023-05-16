import { z } from 'zod';
import { FT_CURSUS_ID } from '../../cursusUser/api/cursusUser.api.js';
import { parseFromDtoMany } from '../../util/parseFromDto.js';
import { examSchema, examSchema_ } from './exam.schema.js';

export type Exam = z.infer<typeof examSchema>;

const UPDATED = (start: Date, end: Date): URL =>
  new URL(
    `https://api.intra.42.fr/v2/campus/29/cursus/${FT_CURSUS_ID}/exams?range[updated_at]=${start.toISOString()},${end.toISOString()}&sort=created_at`,
  );

export const EXAM_EP = {
  UPDATED,
} as const;

export const parseExams = (dtos: object[]): Exam[] =>
  parseFromDtoMany(dtos, examSchema_, 'exams');
