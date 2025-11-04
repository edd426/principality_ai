/**
 * JSON Schema for game_session Tool
 *
 * Manages game lifecycle (start new game, end game) with idempotent operations
 */

export const GAME_SESSION_SCHEMA = {
  name: 'game_session',
  description: 'Manage game lifecycle. "new" command starts game (implicitly ends active game, idempotent). "end" command ends current game. Supports seed for reproducibility and model tracking.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string',
        enum: ['new', 'end'],
        description: 'Lifecycle command: "new" to start fresh game, "end" to finish current'
      },
      seed: {
        type: 'string',
        description: 'Optional seed for deterministic shuffle (reproducibility, research). Same seed + same moves = identical game progression.'
      },
      model: {
        type: 'string',
        enum: ['haiku', 'sonnet'],
        description: 'LLM model selection (default: haiku). Tracked for performance analysis.'
      }
    },
    required: ['command']
  }
};
