/**
 * JSON Schema for web_game_observe Tool
 *
 * Gets current game state and valid moves from the API server.
 */

export const WEB_GAME_OBSERVE_SCHEMA = {
  name: 'web_game_observe',
  description: 'Get current game state and valid moves from the web API server. Returns filtered state (human perspective) with valid moves for the current player.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      gameId: {
        type: 'string',
        description: 'Game ID from web_game_create'
      },
      detail_level: {
        type: 'string',
        enum: ['minimal', 'standard', 'full'],
        description: 'Level of detail for response. minimal (~60 tokens), standard (~250), full (~1000)'
      },
      apiServerUrl: {
        type: 'string',
        description: 'API server URL. Default: http://localhost:3000'
      }
    },
    required: ['gameId']
  }
};
