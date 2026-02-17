/**
 * JSON Schema for web_game_create Tool
 *
 * Creates a new game on the API server with manualAI mode for Claude MCP control.
 */

export const WEB_GAME_CREATE_SCHEMA = {
  name: 'web_game_create',
  description: 'Create a new game on the web API server. Returns gameId for use with web_game_observe and web_game_execute. Defaults to manualAI=true so Claude can control both players.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      seed: {
        type: 'string',
        description: 'Optional seed for deterministic shuffle (reproducibility).'
      },
      kingdomCards: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional specific kingdom cards to use (up to 10).'
      },
      manualAI: {
        type: 'boolean',
        description: 'If true (default), AI turns are not auto-played. Claude controls both players via MCP.'
      },
      apiServerUrl: {
        type: 'string',
        description: 'API server URL. Default: http://localhost:3000'
      }
    },
    required: []
  }
};
