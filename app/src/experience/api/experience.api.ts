import { experienceSchema } from '#lambda/experience/api/experience.schema.js';
import { z } from 'zod';

export type Experience = z.infer<typeof experienceSchema>;

// exam 경험치로 인해 레벨 차이가 발생하는 상태로 블랙홀에 간 user.
export const examExperienceErrorUserIds = [98333] as const;
