import { z } from 'zod';

export const ExerciseTrackSchema = z.enum(['sql', 'linux', 'docker', 'networks']);
export type ExerciseTrack = z.infer<typeof ExerciseTrackSchema>;

export const ExerciseDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type ExerciseDifficulty = z.infer<typeof ExerciseDifficultySchema>;

export const ExerciseSchema = z.object({
  id: z.string().min(1, 'O ID do exercício é obrigatório'),
  track: ExerciseTrackSchema,
  module: z.string().min(1, 'O módulo do exercício é obrigatório'),
  level: z.number().int().positive('O nível deve ser um número inteiro positivo'),
  title: z.string().min(1, 'O título é obrigatório'),
  difficulty: ExerciseDifficultySchema,
  prerequisites: z.array(z.string()),
  question: z.string().min(1, 'A pergunta/enunciado é obrigatória'),
  dataset: z.string().optional(),
  setup: z.string().optional(),
  orderMatters: z.boolean(),
  skills: z.array(z.string()),
  hints: z.array(z.string()),
  solutions: z.array(z.string()).min(1, 'Ao menos uma solução é obrigatória'),
  explanation: z.string().optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

export type PublicExercise = Omit<Exercise, 'solutions'>;

export function toPublicExercise(exercise: Exercise): PublicExercise {
  const copy = { ...exercise };
  delete (copy as Partial<Exercise>).solutions;
  return copy as PublicExercise;
}
