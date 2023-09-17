import { projectBaseSchema } from '#lambda/project/api/project.schema.js';
// eslint-disable-next-line
import type { ProjectsUserUpdator } from '#lambda/projectsUser/projectsUser.js';
import { z } from 'zod';

/**
 *
 * @description
 * 인트라에서 모종의 이유로 권한이 막혀있는 상태입니다. 실제 dto 는 다르게 생겼을 가능성이 높습니다.
 * 42stat 에서는 projects user 업데이트 할 때 같이 생성하는 방식으로 처리하려 합니다.
 *
 * @see ProjectsUserUpdator
 */
export const experienceUserSchema = z.object({
  // id: z.number(),
  userId: z.number(),
  experience: z.number(),
  createdAt: z.coerce.date(),
  cursusId: z.number(),
  project: projectBaseSchema,
});
