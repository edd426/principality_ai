/**
 * JSON Schema for web_game_execute Tool
 *
 * Executes a move on the API server game.
 */

export const WEB_GAME_EXECUTE_SCHEMA = {
  name: 'web_game_execute',
  description: 'Execute a move on a web API server game. Returns updated state and valid moves. Use for playing both human and AI turns when manualAI=true.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      gameId: {
        type: 'string',
        description: 'Game ID from web_game_create'
      },
      move: {
        type: 'string',
        description: 'The move to execute (e.g., "play Copper", "buy Silver", "end", "play_treasure all")'
      },
      reasoning: {
        type: 'string',
        description: 'Optional brief rationale for this move (1-2 sentences)'
      },
      apiServerUrl: {
        type: 'string',
        description: 'API server URL. Default: http://localhost:3000'
      }
    },
    required: ['gameId', 'move']
  }
};
