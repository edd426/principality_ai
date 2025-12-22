/**
 * MCP Server Configuration
 */

export interface MCPServerConfig {
  name: string;
  version: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFormat: 'json' | 'text';
  logFile?: string;
  defaultModel: 'haiku' | 'sonnet';
  requestTimeout: number;
  maxConcurrentRequests: number;
  maxConcurrentGames: number;
  gameTTLMs: number;
}

export const DEFAULT_CONFIG: MCPServerConfig = {
  name: 'principality-mcp-server',
  version: '2.0.0',
  logLevel: (process.env.LOG_LEVEL as any) || 'debug',
  logFormat: (process.env.LOG_FORMAT as any) || 'json',
  logFile: process.env.LOG_FILE,
  defaultModel: (process.env.DEFAULT_MODEL as any) || 'haiku',
  requestTimeout: 30000,
  maxConcurrentRequests: 10,
  maxConcurrentGames: 10,
  gameTTLMs: 3600000 // 1 hour
};
