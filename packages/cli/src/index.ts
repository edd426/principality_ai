#!/usr/bin/env node

import { PrincipalityCLI } from './cli';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load game configuration from game-config.json
 */
function loadGameConfig(): { game?: { victoryPileSize?: number; edition?: '1st' | '2nd' | 'mixed' } } {
  try {
    const configPath = path.join(__dirname, '..', 'game-config.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    // If config file doesn't exist or is invalid, use defaults
    return { game: { victoryPileSize: 4, edition: '2nd' } };
  }
}

/**
 * Main entry point for the CLI
 */
async function main(): Promise<void> {
  // Load configuration
  const config = loadGameConfig();
  const victoryPileSize = config.game?.victoryPileSize ?? 4;
  const edition = config.game?.edition ?? '2nd';

  // Parse command line arguments
  const args = process.argv.slice(2);
  let seed: string | undefined;
  let players = 1;
  let stableNumbers = false;
  let manualCleanup = false;
  let editionOverride: '1st' | '2nd' | 'mixed' | undefined;

  // Look for flags
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
    } else if (args[i] === '--stable-numbers') {
      stableNumbers = true;
    } else if (args[i] === '--manual-cleanup') {
      manualCleanup = true;
    } else if (args[i].startsWith('--edition=')) {
      const editionValue = args[i].split('=')[1];
      if (editionValue === '1st' || editionValue === '2nd' || editionValue === 'mixed') {
        editionOverride = editionValue;
      }
    } else if (args[i] === '--edition' && i + 1 < args.length) {
      const editionValue = args[i + 1];
      if (editionValue === '1st' || editionValue === '2nd' || editionValue === 'mixed') {
        editionOverride = editionValue;
      }
    }
  }

  // Use edition override if specified, otherwise use config value
  const finalEdition = editionOverride ?? edition;

  // Create and start the CLI with options
  const cli = new PrincipalityCLI(seed, players, { victoryPileSize, stableNumbers, manualCleanup, edition: finalEdition });
  await cli.start();
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
