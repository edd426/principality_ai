/**
 * State Persistence Module for Turn-Based CLI Mode (Phase 4.3)
 *
 * @blocker: test:52-55 - Test file uses `declare function` without imports
 * Test needs: import { serializeState, deserializeState, saveStateToFile, loadStateFromFile } from '../src/state-persistence';
 * Cannot modify test file per dev-agent protocol - test-architect needs to add imports
 *
 * Implementation complete - waiting for test file fix to validate
 */

import { GameState, PendingEffect } from '@principality/core';
import { CLIOptions } from './cli';
import * as fs from 'fs/promises';

/**
 * Serialized game state structure
 * Must be JSON-compatible for file storage
 *
 * @req: SP-1 - Supply Map serialization as [[cardName, count], ...] tuples
 * @req: SP-2 - PendingEffect serialization/deserialization preserves all fields
 */
export interface SerializedGameState {
  schemaVersion: string;  // "1.0.0"
  timestamp: string;
  seed: string;
  players: Array<{
    hand: string[];
    drawPile: string[];
    discardPile: string[];
    inPlay: string[];
    actions: number;
    buys: number;
    coins: number;
  }>;
  supply: Array<[string, number]>;  // Map as tuples for JSON
  currentPlayer: number;
  phase: 'action' | 'buy' | 'cleanup';
  turnNumber: number;
  gameLog: string[];
  trash: string[];
  pendingEffect?: PendingEffect;
  selectedKingdomCards?: string[];
  cliOptions: CLIOptions;
}

/**
 * Serialize game state to JSON-compatible format
 *
 * @req: SP-1 - Supply Map must be converted to tuple array for JSON compatibility
 * @req: SP-2 - All PendingEffect fields must be preserved
 */
export function serializeState(state: GameState, options: CLIOptions): SerializedGameState {
  return {
    schemaVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    seed: state.seed,
    players: state.players.map(player => ({
      hand: [...player.hand],
      drawPile: [...player.drawPile],
      discardPile: [...player.discardPile],
      inPlay: [...player.inPlay],
      actions: player.actions,
      buys: player.buys,
      coins: player.coins
    })),
    supply: Array.from(state.supply.entries()),  // Map → [[k,v], ...] tuples
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    turnNumber: state.turnNumber,
    gameLog: [...state.gameLog],
    trash: [...state.trash],
    pendingEffect: state.pendingEffect ? { ...state.pendingEffect } : undefined,
    selectedKingdomCards: state.selectedKingdomCards ? [...state.selectedKingdomCards] : undefined,
    cliOptions: options
  };
}

/**
 * Deserialize JSON data back to GameState and CLIOptions
 *
 * @req: SP-3 - Reconstruct Map from tuple array correctly
 * @req: SP-2 - PendingEffect must be fully preserved with all fields
 */
export function deserializeState(data: SerializedGameState): { state: GameState; options: CLIOptions } {
  const state: GameState = {
    seed: data.seed,
    players: data.players.map(player => ({
      hand: [...player.hand],
      drawPile: [...player.drawPile],
      discardPile: [...player.discardPile],
      inPlay: [...player.inPlay],
      actions: player.actions,
      buys: player.buys,
      coins: player.coins
    })),
    supply: new Map(data.supply),  // Tuple array → Map
    currentPlayer: data.currentPlayer,
    phase: data.phase,
    turnNumber: data.turnNumber,
    gameLog: [...data.gameLog],
    trash: [...data.trash],
    pendingEffect: data.pendingEffect ? { ...data.pendingEffect } : undefined,
    selectedKingdomCards: data.selectedKingdomCards ? [...data.selectedKingdomCards] : undefined
  };

  return {
    state,
    options: data.cliOptions
  };
}

/**
 * Save game state to file
 *
 * @req: SP-4 - Write serialized state to filesystem with error handling
 */
export async function saveStateToFile(state: GameState, options: CLIOptions, filePath: string): Promise<void> {
  const serialized = serializeState(state, options);
  const json = JSON.stringify(serialized, null, 2);  // Pretty-printed with 2-space indentation

  try {
    await fs.writeFile(filePath, json, 'utf-8');
  } catch (error) {
    // Re-throw with more context
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save state to ${filePath}: ${message}`);
  }
}

/**
 * Load game state from file
 *
 * @req: SP-4 - Read and deserialize state from filesystem with error handling
 * @req: SP-4 - Validate state data has required fields
 */
export async function loadStateFromFile(filePath: string): Promise<{ state: GameState; options: CLIOptions }> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');

    let data: any;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error('State file corrupted: invalid JSON format');
    }

    // Validate schema version
    if (data.schemaVersion && data.schemaVersion !== '1.0.0') {
      throw new Error(`Incompatible state file version: ${data.schemaVersion}. Expected 1.0.0. Please initialize a new game.`);
    }

    // Validate required fields exist
    const requiredFields = ['seed', 'players', 'supply', 'currentPlayer', 'phase', 'turnNumber', 'gameLog', 'trash', 'cliOptions'];
    const missingFields = requiredFields.filter(field => !(field in data));

    if (missingFields.length > 0) {
      throw new Error(`Incomplete state data: missing fields ${missingFields.join(', ')}`);
    }

    return deserializeState(data as SerializedGameState);
  } catch (error) {
    // Re-throw with more context (unless it's already our custom error)
    if (error instanceof Error && (
      error.message.startsWith('State file corrupted') ||
      error.message.startsWith('Incompatible') ||
      error.message.startsWith('Incomplete state')
    )) {
      throw error;
    }

    // Check for file not found error (NodeJS.ErrnoException)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`State file not found: ${filePath}. Please initialize a new game with --init flag.`);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load state from ${filePath}: ${message}`);
  }
}
