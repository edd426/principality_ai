/**
 * JSON Schema for game_observe Tool
 *
 * Combines game state + valid moves in a single query with configurable detail levels
 */

export const GAME_OBSERVE_SCHEMA = {
  name: 'game_observe',
  description: 'Query current game state and valid moves together. Returns state + validMoves combined for LLM decision-making. Use detail_level to optimize token usage: minimal (~60 tokens), standard (~250), full (~1000).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      detail_level: {
        type: 'string',
        enum: ['minimal', 'standard', 'full'],
        description: 'Level of detail: minimal (4 fields ~60 tokens), standard (hand+moves ~250 tokens), full (complete state ~1000 tokens)'
      },
      gameId: {
        type: 'string',
        description: 'Optional game ID (uses default game if omitted)'
      }
    },
    required: ['detail_level']
  }
};
