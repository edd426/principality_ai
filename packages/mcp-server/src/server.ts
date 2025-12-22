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
import { GameRegistryManager } from './game-registry';
import { GAME_OBSERVE_SCHEMA } from './schemas/game-observe';
import { GAME_EXECUTE_SCHEMA } from './schemas/game-execute';
import { GAME_SESSION_SCHEMA } from './schemas/game-session';
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

    // Register tool schemas
    this.tools = new Map();
    this.tools.set('game_observe', GAME_OBSERVE_SCHEMA);
    this.tools.set('game_execute', GAME_EXECUTE_SCHEMA);
    this.tools.set('game_session', GAME_SESSION_SCHEMA);

    // Register tool handlers
    this.requestHandlers = new Map();
    this.requestHandlers.set('game_observe', (args) => this.observeTool.execute(args));
    this.requestHandlers.set('game_execute', (args) => this.executeTool.execute(args));
    this.requestHandlers.set('game_session', (args) => this.sessionTool.execute(args));

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
        gameId: z.string().optional().describe('Optional game ID (for end command)')
      },
      async (args) => {
        const result = await this.sessionTool.execute(args);
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

      this.logger.info('MCP Server ready (stdio, 3 tools)', {
        name: this.config.name,
        version: this.config.version,
        tools: ['game_observe', 'game_execute', 'game_session'],
        transport: 'stdio'
      });

      console.log('MCP Server ready (stdio, 3 tools)');
    } catch (error) {
      this.logger.error('Failed to start MCP server', error);
      throw error;
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    this.logger.info('MCP Server shutting down gracefully');
    this.gameRegistry.stop();
    process.exit(0);
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
