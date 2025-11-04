/**
 * MCP Server Entry Point
 *
 * Exports main server class and utilities
 */

export { MCPGameServer } from './server';
export { Logger } from './logger';
export { DEFAULT_CONFIG, type MCPServerConfig } from './config';
export * from './types';
export * from './tools/game-observe';
export * from './tools/game-execute';
export * from './tools/game-session';

// For CLI: start server with stdio transport
if (require.main === module) {
  const { MCPGameServer } = require('./server');

  const server = new MCPGameServer();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    server.stop();
  });

  process.on('SIGTERM', () => {
    server.stop();
  });

  // Start server
  server.start().catch((error: any) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
