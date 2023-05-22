import { z } from 'zod';

export const coalitionsUserSchema = z.object({
  id: z.number(),
  coalitionId: z.number(),
  userId: z.number(),
  // 믿을 수 없는 값
  // score: z.number(),
  // 믿을 수 없는 값
  // rank: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const coalitionsUserSchema_ = coalitionsUserSchema.passthrough();
