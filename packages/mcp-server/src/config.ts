/**
 * MCP Server Configuration
 */

export interface MCPServerConfig {
  name: string;
  version: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFormat: 'json' | 'text';
  defaultModel: 'haiku' | 'sonnet';
  requestTimeout: number;
  maxConcurrentRequests: number;
}

export const DEFAULT_CONFIG: MCPServerConfig = {
  name: 'principality-mcp-server',
  version: '2.0.0',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
  logFormat: (process.env.LOG_FORMAT as any) || 'json',
  defaultModel: (process.env.DEFAULT_MODEL as any) || 'haiku',
  requestTimeout: 30000,
  maxConcurrentRequests: 10
};
