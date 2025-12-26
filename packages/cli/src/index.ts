#!/usr/bin/env node

import { PrincipalityCLI } from './cli';
import { initializeGameAndSave, executeMoveAndSave } from './turn-based-cli';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load game configuration from game-config.json
 */
function loadGameConfig(): { game?: { victoryPileSize?: number; edition?: '1E' | '2E' | 'mixed' } } {
  try {
    const configPath = path.join(__dirname, '..', 'game-config.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    // If config file doesn't exist or is invalid, use defaults
    return { game: { victoryPileSize: 4, edition: '2E' } };
  }
}

/**
 * Main entry point for the CLI
 */
async function main(): Promise<void> {
  // Load configuration
  const config = loadGameConfig();
  const victoryPileSize = config.game?.victoryPileSize ?? 4;
  const edition = config.game?.edition ?? '2E';

  // Parse command line arguments
  const args = process.argv.slice(2);
  let seed: string | undefined;
  let players = 1;
  let stableNumbers = false;
  let manualCleanup = false;
  let editionOverride: '1E' | '2E' | 'mixed' | undefined;
  let debugMode = false;

  // Turn-based mode flags
  let initMode = false;
  let stateFilePath: string | undefined;
  let moveToExecute: string | undefined;

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
      if (editionValue === '1E' || editionValue === '2E' || editionValue === 'mixed') {
        editionOverride = editionValue;
      }
    } else if (args[i] === '--edition' && i + 1 < args.length) {
      const editionValue = args[i + 1];
      if (editionValue === '1E' || editionValue === '2E' || editionValue === 'mixed') {
        editionOverride = editionValue;
      }
    } else if (args[i] === '--debug') {
      debugMode = true;
    } else if (args[i] === '--init') {
      initMode = true;
    } else if (args[i] === '--state-file' && i + 1 < args.length) {
      stateFilePath = args[i + 1];
      i++;
    } else if (args[i].startsWith('--state-file=')) {
      stateFilePath = args[i].split('=')[1];
    } else if (args[i] === '--move' && i + 1 < args.length) {
      moveToExecute = args[i + 1];
      i++;
    } else if (args[i].startsWith('--move=')) {
      moveToExecute = args[i].split('=')[1];
    }
  }

  // Use edition override if specified, otherwise use config value
  const finalEdition = editionOverride ?? edition;

  // Build CLI options
  const cliOptions = { victoryPileSize, stableNumbers, manualCleanup, debugMode, edition: finalEdition };

  // Turn-based mode: Initialize and save state
  if (stateFilePath && initMode) {
    if (!seed) {
      console.error('Error: --seed is required with --init');
      process.exit(1);
    }
    try {
      const { output } = await initializeGameAndSave(seed, stateFilePath, cliOptions);
      console.log(output);
      process.exit(0);
    } catch (error) {
      console.error('Error initializing game:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  // Turn-based mode: Execute move and save state
  if (stateFilePath && moveToExecute) {
    try {
      const { output, success } = await executeMoveAndSave(stateFilePath, moveToExecute);
      console.log(output);
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('Error executing move:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  // Interactive mode (default)
  const cli = new PrincipalityCLI(seed, players, cliOptions);
  await cli.start();
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
