import { experienceUserSchema } from '#lambda/experience/api/experience.schema.js';
import { z } from 'zod';

export type ExperienceUser = z.infer<typeof experienceUserSchema>;

// exam 경험치로 인해 레벨 차이가 발생하는 상태로 블랙홀에 간 user.
// cheating 으로 인해 과제가 초기화 된 user.
export const examExperienceErrorUserIds = [98333, 131828] as const;
