import { experienceSchema } from '#lambda/experience/api/experience.schema.js';
import { z } from 'zod';

export type Experience = z.infer<typeof experienceSchema>;
