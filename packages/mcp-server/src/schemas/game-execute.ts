/**
 * JSON Schema for game_execute Tool
 *
 * Atomically validates and executes a single move
 */

export const GAME_EXECUTE_SCHEMA = {
  name: 'game_execute',
  description: 'Execute a move and automatically return updated game state. Supports batch treasure playing ("play_treasure all") for efficiency. Every response includes gameState (standard detail), validMoves array, and gameOver flag - no need to call game_observe between moves.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      move: {
        type: 'string',
        description: 'Move string: "play 0", "play_treasure Copper", "play_treasure all" (plays all treasures), "buy Province", "end", etc. Batch command "play_treasure all" plays all treasures in hand at once for faster Buy phase.'
      },
      return_detail: {
        type: 'string',
        enum: ['minimal', 'full'],
        description: 'Return detail level (default: standard auto-return). All moves auto-return standard detail (gameState + validMoves). Use "full" for complete state with deck/discard/supply details.'
      },
      reasoning: {
        type: 'string',
        description: 'Optional brief rationale for this move (1-2 sentences). Recommended for strategy analysis and debugging. Example: "Buying Village to build engine" or "Playing all treasures for maximum coins"'
      },
      gameId: {
        type: 'string',
        description: 'Optional game ID (uses default game if omitted)'
      }
    },
    required: ['move']
  }
};
