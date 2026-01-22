/**
 * Development Server Entry Point
 *
 * Starts the API server for local development.
 * Use: npm run dev
 */

import { serve } from '@hono/node-server';
import { createServer, stopServer } from './server';
import { loadConfig } from './config';

const config = loadConfig();
const { app, context } = createServer(config);

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              Principality AI - API Server                     ║
╠═══════════════════════════════════════════════════════════════╣
║  Server running at: http://${config.host}:${config.port}                     ║
║  Health check:      http://${config.host}:${config.port}/health              ║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                   ║
║    POST   /api/games           - Create new game              ║
║    GET    /api/games/:id       - Get game state               ║
║    POST   /api/games/:id/move  - Execute move                 ║
║    DELETE /api/games/:id       - End game                     ║
╚═══════════════════════════════════════════════════════════════╝
`);

const server = serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  stopServer(context);
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  stopServer(context);
  server.close();
  process.exit(0);
});
