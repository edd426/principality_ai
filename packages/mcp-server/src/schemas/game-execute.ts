/**
 * JSON Schema for game_execute Tool
 *
 * Atomically validates and executes a single move
 */

export const GAME_EXECUTE_SCHEMA = {
  name: 'game_execute',
  description: 'Validate and execute a single move atomically. Validates first, executes if valid. Returns status and optionally full state. Supports return_detail to control output size.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      move: {
        type: 'string',
        description: 'Move string: "play 0", "buy Province", "end", "play action", "buy Smithy", etc.'
      },
      return_detail: {
        type: 'string',
        enum: ['minimal', 'full'],
        description: 'Return detail: minimal (~150 tokens) returns just success/error, full (~1500 tokens) includes updated game state'
      }
    },
    required: ['move']
  }
};
