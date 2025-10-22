/**
 * MCP Server Implementation
 *
 * Main server class that registers and manages the three core tools
 */

import { GameEngine, GameState } from '@principality/core';
import { Logger } from './logger';
import { DEFAULT_CONFIG, MCPServerConfig } from './config';
import { GameObserveTool } from './tools/game-observe';
import { GameExecuteTool } from './tools/game-execute';
import { GameSessionTool } from './tools/game-session';
import { GAME_OBSERVE_SCHEMA } from './schemas/game-observe';
import { GAME_EXECUTE_SCHEMA } from './schemas/game-execute';
import { GAME_SESSION_SCHEMA } from './schemas/game-session';
import { ToolSchema, ToolResponse } from './types';

export class MCPGameServer {
  private gameEngine: GameEngine;
  private observeTool: GameObserveTool;
  private executeTool: GameExecuteTool;
  private sessionTool: GameSessionTool;
  private logger: Logger;
  private config: MCPServerConfig;
  private currentState: GameState | null = null;
  private tools: Map<string, ToolSchema>;
  private requestHandlers: Map<string, (args: any) => Promise<any>>;

  constructor(config: Partial<MCPServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger(this.config.logLevel, this.config.logFormat);

    // Initialize game engine (singleton for session)
    this.gameEngine = new GameEngine('mcp-session');

    // Initialize tools
    this.observeTool = new GameObserveTool(this.gameEngine, () => this.currentState);
    this.executeTool = new GameExecuteTool(this.gameEngine, () => this.currentState, (state) => { this.currentState = state; });
    this.sessionTool = new GameSessionTool(this.gameEngine, this.config.defaultModel, (state) => { this.currentState = state; }, () => this.currentState);

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
   * Start the server (placeholder for stdio transport setup)
   */
  async start(): Promise<void> {
    this.logger.info('MCP Server starting', {
      name: this.config.name,
      version: this.config.version,
      tools: Array.from(this.tools.keys()),
      transport: 'stdio'
    });
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    this.logger.info('MCP Server shutting down gracefully');
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
      currentGame: this.currentState ? 'active' : null,
      defaultModel: this.config.defaultModel
    };
  }
}
