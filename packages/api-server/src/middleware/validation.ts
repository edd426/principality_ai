/**
 * Request Validation Middleware
 *
 * Uses Zod for request body validation.
 *
 * @req API-001 - HTTP REST endpoints for game management
 */

import { z } from 'zod';
import { InvalidRequestError } from './error-handler';

/**
 * AI model enum
 */
const AIModelSchema = z.enum(['haiku', 'sonnet', 'opus']);

/**
 * Card edition enum
 */
const EditionSchema = z.enum(['1E', '2E', 'mixed']);

/**
 * Schema for POST /api/games - Create Game
 */
export const CreateGameSchema = z.object({
  aiModel: AIModelSchema,
  seed: z.string().optional(),
  kingdomCards: z.array(z.string()).max(10).optional(),
  enableNarration: z.boolean().optional(),
  manualAI: z.boolean().optional(),
  edition: EditionSchema.optional(),
});

/**
 * Schema for POST /api/games/:gameId/move - Execute Move
 */
export const ExecuteMoveSchema = z.object({
  move: z.union([
    z.string(),
    z.object({
      type: z.string(),
      card: z.string().optional(),
      cards: z.array(z.string()).optional(),
      handIndex: z.number().optional(),
      action: z.string().optional(),
      choice: z.boolean().optional(),
      playerIndex: z.number().optional(),
    }),
  ]),
});

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): z.infer<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    throw new InvalidRequestError('Invalid request body', { errors });
  }

  return result.data;
}

/**
 * Type exports for request bodies
 */
export type CreateGameBody = z.infer<typeof CreateGameSchema>;
export type ExecuteMoveBody = z.infer<typeof ExecuteMoveSchema>;
