import { z } from 'zod';
import { experienceSchema } from './experience.schema.js';

export type Experience = z.infer<typeof experienceSchema>;
