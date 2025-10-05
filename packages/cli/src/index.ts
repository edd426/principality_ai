#!/usr/bin/env node

import { PrincipalityCLI } from './cli';

/**
 * Main entry point for the CLI
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let seed: string | undefined;
  let players = 1;

  // Look for --seed and --players flags
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--seed=')) {
      seed = args[i].split('=')[1];
    } else if (args[i] === '--seed' && i + 1 < args.length) {
      seed = args[i + 1];
    } else if (args[i].startsWith('--players=')) {
      const playerCount = parseInt(args[i].split('=')[1], 10);
      if (!isNaN(playerCount) && playerCount >= 1 && playerCount <= 4) {
        players = playerCount;
      }
    } else if (args[i] === '--players' && i + 1 < args.length) {
      const playerCount = parseInt(args[i + 1], 10);
      if (!isNaN(playerCount) && playerCount >= 1 && playerCount <= 4) {
        players = playerCount;
      }
    }
  }

  // Create and start the CLI
  const cli = new PrincipalityCLI(seed, players);
  await cli.start();
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
