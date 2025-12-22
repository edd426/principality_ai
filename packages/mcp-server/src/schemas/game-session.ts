/**
 * JSON Schema for game_session Tool
 *
 * Manages game lifecycle (start new game, end game) with idempotent operations
 */

export const GAME_SESSION_SCHEMA = {
  name: 'game_session',
  description: 'Manage game lifecycle. "new" command starts game. "end" command ends game. "list" command shows active games. Supports seed for reproducibility and model tracking.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string',
        enum: ['new', 'end', 'list'],
        description: 'Lifecycle command: "new" to start game, "end" to finish game, "list" to show active games'
      },
      seed: {
        type: 'string',
        description: 'Optional seed for deterministic shuffle (reproducibility, research). Same seed + same moves = identical game progression.'
      },
      model: {
        type: 'string',
        enum: ['haiku', 'sonnet'],
        description: 'LLM model selection (default: haiku). Tracked for performance analysis.'
      },
      gameId: {
        type: 'string',
        description: 'Optional game ID (for "end" command; uses default if omitted)'
      }
    },
    required: ['command']
  }
};
