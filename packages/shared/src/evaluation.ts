import { z } from 'zod';

export const QueryResultSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.unknown())),
});
export type QueryResult = z.infer<typeof QueryResultSchema>;

export const EvaluationStatusSchema = z.enum(['correct', 'almost', 'wrong']);
export type EvaluationStatus = z.infer<typeof EvaluationStatusSchema>;

export const EvaluationResultSchema = z.object({
  status: EvaluationStatusSchema,
  message: z.string(),
  studentResult: QueryResultSchema.optional(),
  error: z.string().optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
