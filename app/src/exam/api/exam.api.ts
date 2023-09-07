import { SEOUL_CAMPUS_ID } from '#lambda/campus/api/campus.api.js';
import { FT_CURSUS_ID } from '#lambda/cursusUser/api/cursusUser.api.js';
import { examSchema, examSchema_ } from '#lambda/exam/api/exam.schema.js';
import { FtApiURLBuilder } from '#lambda/util/FtApiURLBuilder.js';
import { parseFromDtoMany } from '#lambda/util/parseFromDto.js';
import { z } from 'zod';

export type Exam = z.infer<typeof examSchema>;

export const EXAM_EP = `campus/${SEOUL_CAMPUS_ID}/cursus/${FT_CURSUS_ID}/exams`;

const UPDATED = (start: Date, end: Date): URL =>
  new FtApiURLBuilder(EXAM_EP)
    .addRange('updated_at', start, end)
    .addSort('created_at', FtApiURLBuilder.SortOrder.ASC)
    .toURL();

export const EXAM_API = {
  UPDATED,
} as const;

export const parseExams = (dtos: object[]): Exam[] =>
  parseFromDtoMany(dtos, examSchema_, 'exams');
