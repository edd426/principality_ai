/**
 * MCP Server Implementation
 *
 * Main server class that registers and manages the three core tools
 */

import { Logger } from './logger';
import { DEFAULT_CONFIG, MCPServerConfig } from './config';
import { GameObserveTool } from './tools/game-observe';
import { GameExecuteTool } from './tools/game-execute';
import { GameSessionTool } from './tools/game-session';
import { WebGameCreateTool } from './tools/web-game-create';
import { WebGameObserveTool } from './tools/web-game-observe';
import { WebGameExecuteTool } from './tools/web-game-execute';
import { GameRegistryManager } from './game-registry';
import { GAME_OBSERVE_SCHEMA } from './schemas/game-observe';
import { GAME_EXECUTE_SCHEMA } from './schemas/game-execute';
import { GAME_SESSION_SCHEMA } from './schemas/game-session';
import { WEB_GAME_CREATE_SCHEMA } from './schemas/web-game-create';
import { WEB_GAME_OBSERVE_SCHEMA } from './schemas/web-game-observe';
import { WEB_GAME_EXECUTE_SCHEMA } from './schemas/web-game-execute';
import { ToolSchema, ToolResponse } from './types';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

export class MCPGameServer {
  private server: McpServer;
  private gameRegistry: GameRegistryManager;
  private observeTool: GameObserveTool;
  private executeTool: GameExecuteTool;
  private sessionTool: GameSessionTool;
  private webGameCreateTool: WebGameCreateTool;
  private webGameObserveTool: WebGameObserveTool;
  private webGameExecuteTool: WebGameExecuteTool;
  private logger: Logger;
  private config: MCPServerConfig;
  private tools: Map<string, ToolSchema>;
  private requestHandlers: Map<string, (args: any) => Promise<any>>;

  constructor(config: Partial<MCPServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger(this.config.logLevel, this.config.logFormat, this.config.logFile);

    // Initialize MCP server
    this.server = new McpServer({
      name: this.config.name,
      version: this.config.version
    });

    // Initialize game registry
    this.gameRegistry = new GameRegistryManager(
      this.config.maxConcurrentGames,
      this.config.gameTTLMs,
      this.logger
    );

    // Initialize tools with registry
    this.observeTool = new GameObserveTool(this.gameRegistry, this.logger);
    this.executeTool = new GameExecuteTool(this.gameRegistry, this.logger);
    this.sessionTool = new GameSessionTool(this.gameRegistry, this.config.defaultModel, this.logger);

    // Initialize web game tools (for API server integration)
    this.webGameCreateTool = new WebGameCreateTool(this.logger);
    this.webGameObserveTool = new WebGameObserveTool(this.logger);
    this.webGameExecuteTool = new WebGameExecuteTool(this.logger);

    // Register tool schemas
    this.tools = new Map();
    this.tools.set('game_observe', GAME_OBSERVE_SCHEMA);
    this.tools.set('game_execute', GAME_EXECUTE_SCHEMA);
    this.tools.set('game_session', GAME_SESSION_SCHEMA);
    this.tools.set('web_game_create', WEB_GAME_CREATE_SCHEMA);
    this.tools.set('web_game_observe', WEB_GAME_OBSERVE_SCHEMA);
    this.tools.set('web_game_execute', WEB_GAME_EXECUTE_SCHEMA);

    // Register tool handlers
    this.requestHandlers = new Map();
    this.requestHandlers.set('game_observe', (args) => this.observeTool.execute(args));
    this.requestHandlers.set('game_execute', (args) => this.executeTool.execute(args));
    this.requestHandlers.set('game_session', (args) => this.sessionTool.execute(args));
    this.requestHandlers.set('web_game_create', (args) => this.webGameCreateTool.execute(args));
    this.requestHandlers.set('web_game_observe', (args) => this.webGameObserveTool.execute(args));
    this.requestHandlers.set('web_game_execute', (args) => this.webGameExecuteTool.execute(args));

    // Register game_observe tool
    this.server.tool(
      'game_observe',
      GAME_OBSERVE_SCHEMA.description,
      {
        detail_level: z.enum(['minimal', 'standard', 'full']).describe('Level of detail for game state'),
        gameId: z.string().optional().describe('Optional game ID (uses default game if omitted)')
      },
      async (args) => {
        const result = await this.observeTool.execute(args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // Register game_execute tool
    this.server.tool(
      'game_execute',
      GAME_EXECUTE_SCHEMA.description,
      {
        move: z.string().describe('The move to execute (e.g., "play 0", "buy Silver", "end")'),
        reasoning: z.string().optional().describe('Optional brief rationale for this move (1-2 sentences). Recommended for strategy analysis.'),
        gameId: z.string().optional().describe('Optional game ID (uses default game if omitted)')
      },
      async (args) => {
        const result = await this.executeTool.execute(args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // Register game_session tool
    this.server.tool(
      'game_session',
      GAME_SESSION_SCHEMA.description,
      {
        command: z.enum(['new', 'end', 'list']).describe('Session command'),
        seed: z.string().optional().describe('Optional seed for deterministic shuffle'),
        model: z.enum(['haiku', 'sonnet']).optional().describe('LLM model selection'),
        edition: z.enum(['1E', '2E', 'mixed']).optional().describe('Card edition for kingdom selection. "1E" = First Edition only, "2E" = Second Edition only (default), "mixed" = all cards from both editions.'),
        gameId: z.string().optional().describe('Optional game ID (for end command)'),
        numPlayers: z.number().min(1).max(4).optional().describe('Number of players (1-4, default: 1). With numPlayers=2, opponent auto-plays Big Money.'),
        kingdomCards: z.array(z.string()).optional().describe('Optional specific kingdom cards to use')
      },
      async (args) => {
        const result = await this.sessionTool.execute(args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // Register web_game_create tool (for API server integration)
    this.server.tool(
      'web_game_create',
      WEB_GAME_CREATE_SCHEMA.description,
      {
        seed: z.string().optional().describe('Optional seed for deterministic shuffle'),
        kingdomCards: z.array(z.string()).optional().describe('Optional specific kingdom cards to use'),
        manualAI: z.boolean().optional().describe('If true (default), AI turns are not auto-played'),
        apiServerUrl: z.string().optional().describe('API server URL (default: http://localhost:3000)')
      },
      async (args) => {
        const result = await this.webGameCreateTool.execute(args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // Register web_game_observe tool
    this.server.tool(
      'web_game_observe',
      WEB_GAME_OBSERVE_SCHEMA.description,
      {
        gameId: z.string().describe('Game ID from web_game_create'),
        detail_level: z.enum(['minimal', 'standard', 'full']).optional().describe('Level of detail for response'),
        apiServerUrl: z.string().optional().describe('API server URL (default: http://localhost:3000)')
      },
      async (args) => {
        const result = await this.webGameObserveTool.execute(args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // Register web_game_execute tool
    this.server.tool(
      'web_game_execute',
      WEB_GAME_EXECUTE_SCHEMA.description,
      {
        gameId: z.string().describe('Game ID from web_game_create'),
        move: z.string().describe('The move to execute (e.g., "play Copper", "buy Silver", "end")'),
        reasoning: z.string().optional().describe('Optional brief rationale for this move'),
        apiServerUrl: z.string().optional().describe('API server URL (default: http://localhost:3000)')
      },
      async (args) => {
        const result = await this.webGameExecuteTool.execute(args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    this.logger.info('MCPGameServer initialized', {
      version: this.config.version,
      toolCount: this.tools.size,
      defaultModel: this.config.defaultModel
    });
  }

  /**
   * Get all registered tools
   */
  getTools(): ToolSchema[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool request
   */
  async callTool(toolName: string, args: any): Promise<ToolResponse> {
    const startTime = Date.now();

    try {
      // Validate tool exists
      if (!this.requestHandlers.has(toolName)) {
        this.logger.warn(`Unknown tool requested: ${toolName}`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Unknown tool: "${toolName}". Available tools: ${Array.from(this.tools.keys()).join(', ')}`
            })
          }]
        };
      }

      // Execute tool
      const handler = this.requestHandlers.get(toolName)!;
      const result = await handler(args);

      // Invalidate cache after execute/session tools
      if (toolName === 'game_execute' || toolName === 'game_session') {
        this.observeTool.clearCache();
      }

      const duration = Date.now() - startTime;
      this.logger.debug(`Tool call completed`, {
        tool: toolName,
        duration: `${duration}ms`,
        success: result.success
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Tool execution error: ${toolName}`, error);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `Tool error: ${error instanceof Error ? error.message : String(error)}`
          })
        }]
      };
    }
  }

  /**
   * Start the server and connect to stdio transport
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.logger.info('MCP Server ready (stdio, 6 tools)', {
        name: this.config.name,
        version: this.config.version,
        tools: ['game_observe', 'game_execute', 'game_session', 'web_game_create', 'web_game_observe', 'web_game_execute'],
        transport: 'stdio'
      });

      console.log('MCP Server ready (stdio, 6 tools)');
    } catch (error) {
      this.logger.error('Failed to start MCP server', error);
      throw error;
    }
  }

  /**
   * Stop the server gracefully
   * Note: Does not call process.exit() to allow tests to clean up properly
   */
  async stop(): Promise<void> {
    this.logger.info('MCP Server shutting down gracefully');
    this.gameRegistry.stop();
  }

  /**
   * Get server stats
   */
  getStats() {
    return {
      name: this.config.name,
      version: this.config.version,
      toolCount: this.tools.size,
      tools: Array.from(this.tools.keys()),
      activeGames: this.gameRegistry.getGameCount(),
      gameIds: this.gameRegistry.listGames(),
      defaultModel: this.config.defaultModel
    };
  }
}
