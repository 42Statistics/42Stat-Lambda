import { z } from 'zod';
import { projectSchema } from './project.schema.js';

export type Project = z.infer<typeof projectSchema>;
