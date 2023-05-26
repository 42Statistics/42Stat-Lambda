import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import { examSchema, examSchema_ } from '#lambda/exam/api/exam.schema.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

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
