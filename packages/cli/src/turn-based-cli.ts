/**
 * Turn-Based CLI Module for Phase 4.3
 *
 * Provides non-blocking CLI functions for AI agent testing.
 * Each invocation is independent and stateless (reads/writes state file).
 *
 * @req: TB-CLI-1.1 - Initialize game and save state to file
 * @req: TB-CLI-2.1 - Execute move and update state file
 * @req: TB-CLI-3.1 - Output matches interactive mode
 * @req: TB-CLI-4.1 - Invalid move shows context + valid moves
 */

import { GameEngine, GameState, Move, getMoveDescriptionCompact } from '@principality/core';
import { CLIOptions } from './cli';
import { saveStateToFile, loadStateFromFile } from './state-persistence';
import { Parser } from './parser';
import { formatVPDisplay } from './vp-calculator';

/**
 * Initialize a new game and save state to file
 *
 * @req: TB-CLI-1.1 - Initialize game and save state to file
 * @req: TB-CLI-3.1 - Output matches interactive mode
 * @param seed - Game seed for deterministic shuffling
 * @param stateFilePath - Path to save game state
 * @param options - CLI options (victoryPileSize, stableNumbers, etc.)
 * @returns Object with formatted output and initial game state
 */
export async function initializeGameAndSave(
  seed: string,
  stateFilePath: string,
  options?: CLIOptions
): Promise<{ output: string; state: GameState }> {
  const cliOptions = options || {};

  // Initialize game engine with options
  const engine = new GameEngine(seed, {
    victoryPileSize: cliOptions.victoryPileSize,
    edition: cliOptions.edition,
    debugMode: cliOptions.debugMode
  });

  // Create initial game state (1 player for turn-based mode)
  const state = engine.initializeGame(1);

  // Save state to file
  await saveStateToFile(state, cliOptions, stateFilePath);

  // Get valid moves for initial state
  const validMoves = engine.getValidMoves(state);

  // Format output (same as interactive mode)
  const output = formatOutputForTurnBasedMode(state, validMoves, cliOptions);

  return { output, state };
}

/**
 * Execute a move and save updated state to file
 *
 * @req: TB-CLI-2.1 - Execute move and update state file
 * @req: TB-CLI-2.3 - Support move commands (not just numbers)
 * @req: TB-CLI-4.1 - Invalid move shows context + valid moves
 * @param stateFilePath - Path to state file
 * @param move - Move command (e.g., "end phase", "buy Silver", "1")
 * @returns Object with formatted output, new state, and success flag
 */
export async function executeMoveAndSave(
  stateFilePath: string,
  move: string
): Promise<{ output: string; state: GameState; success: boolean }> {
  try {
    // Load state from file
    const { state, options } = await loadStateFromFile(stateFilePath);

    // Initialize engine with same seed
    const engine = new GameEngine(state.seed, {
      victoryPileSize: options.victoryPileSize,
      edition: options.edition,
      debugMode: options.debugMode
    });

    // Get valid moves for current state
    const validMoves = engine.getValidMoves(state);

    // Parse move command
    const parsedMove = parseMoveCommand(move, validMoves, options);

    if (!parsedMove) {
      // Invalid move - return error with context
      const errorOutput = formatInvalidMoveError(move, state, validMoves, options);
      return {
        output: errorOutput,
        state,
        success: false
      };
    }

    // Execute move
    const result = engine.executeMove(state, parsedMove);

    if (!result.success || !result.newState) {
      // Move failed - return error with context
      const errorOutput = formatMoveExecutionError(
        result.error || 'Move execution failed',
        state,
        validMoves,
        options
      );
      return {
        output: errorOutput,
        state, // Return unchanged state
        success: false
      };
    }

    // Move succeeded - save new state
    const newState = result.newState;
    await saveStateToFile(newState, options, stateFilePath);

    // Get valid moves for new state
    const newValidMoves = engine.getValidMoves(newState);

    // Format output with move result
    const lastLog = newState.gameLog[newState.gameLog.length - 1] || '';
    const output = formatMoveSuccessOutput(lastLog, newState, newValidMoves, options);

    return {
      output,
      state: newState,
      success: true
    };
  } catch (error) {
    // File I/O errors or state validation errors
    throw error;
  }
}

/**
 * Format output for turn-based mode
 *
 * @req: TB-CLI-3.1 - Output matches interactive mode
 * @req: TB-CLI-3.2 - Always include valid moves in output
 * @param state - Current game state
 * @param validMoves - Valid moves for current state
 * @param options - CLI options (affects formatting)
 * @returns Formatted string output
 */
export function formatOutputForTurnBasedMode(
  state: GameState,
  validMoves: Move[],
  options: CLIOptions
): string {
  const lines: string[] = [];

  // Header section (matches Display class)
  const player = state.players[state.currentPlayer];
  const phaseLabel = capitalizePhase(state.phase);
  const vpDisplay = formatVPDisplay(player);

  lines.push('');
  lines.push('='.repeat(60));
  lines.push(`Turn ${state.turnNumber} | Player ${state.currentPlayer + 1} | VP: ${vpDisplay} | ${phaseLabel} Phase`);
  lines.push('='.repeat(60));

  // Hand section
  const handDisplay = player.hand.length > 0
    ? player.hand.join(', ')
    : '(empty)';
  lines.push(`Hand: ${handDisplay}`);

  // Stats section
  lines.push(`Actions: ${player.actions}  Buys: ${player.buys}  Coins: $${player.coins}`);
  lines.push('');

  // Supply section (simplified - show basic treasures and victory)
  lines.push('Supply:');
  const treasures = ['Copper', 'Silver', 'Gold']
    .filter(card => state.supply.has(card))
    .map(card => `${card} (${state.supply.get(card)})`)
    .join(', ');
  if (treasures) {
    lines.push(`  Treasures: ${treasures}`);
  }

  const victory = ['Estate', 'Duchy', 'Province']
    .filter(card => state.supply.has(card))
    .map(card => `${card} (${state.supply.get(card)})`)
    .join(', ');
  if (victory) {
    lines.push(`  Victory:   ${victory}`);
  }

  // Kingdom cards (if any)
  const basicCards = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];
  const kingdomCards = Array.from(state.supply.keys())
    .filter(card => !basicCards.includes(card))
    .sort()
    .map(card => `${card} (${state.supply.get(card)})`)
    .join(', ');
  if (kingdomCards) {
    lines.push(`  Kingdom:   ${kingdomCards}`);
  }
  lines.push('');

  // Available Moves section (ALWAYS included per TB-CLI-3.2)
  lines.push('Available Moves:');
  validMoves.forEach((move, index) => {
    const moveDescription = getMoveDescriptionCompact(move);
    if (options.stableNumbers) {
      // Use stable numbers if enabled
      // For now, just use sequential numbers (stable numbers are complex)
      lines.push(`  [${index + 1}] ${moveDescription}`);
    } else {
      lines.push(`  [${index + 1}] ${moveDescription}`);
    }
  });
  lines.push('');

  return lines.join('\n');
}

/**
 * Parse move command into a Move object
 *
 * @req: TB-CLI-2.3 - Support move commands (not just numbers)
 * @param command - Move command string
 * @param validMoves - Valid moves for current state
 * @param options - CLI options (for stableNumbers)
 * @returns Parsed Move object or null if invalid
 */
function parseMoveCommand(
  command: string,
  validMoves: Move[],
  options: CLIOptions
): Move | null {
  const trimmed = command.trim().toLowerCase();

  // Check for number input (e.g., "1", "2")
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num >= 1 && num <= validMoves.length) {
      return validMoves[num - 1];
    }
    return null;
  }

  // Check for "end phase" command
  if (trimmed === 'end phase' || trimmed === 'end') {
    const endPhaseMove = validMoves.find(m => m.type === 'end_phase');
    return endPhaseMove || null;
  }

  // Check for "buy [CardName]" command
  const buyMatch = trimmed.match(/^buy\s+(.+)$/);
  if (buyMatch) {
    const cardName = buyMatch[1];
    // Find buy move with matching card name (case-insensitive)
    const buyMove = validMoves.find(
      m => m.type === 'buy' && m.card?.toLowerCase() === cardName.toLowerCase()
    );
    return buyMove || null;
  }

  // Check for "play [CardName]" command
  const playMatch = trimmed.match(/^play\s+(.+)$/);
  if (playMatch) {
    const cardName = playMatch[1];
    // Find play_action or play_treasure move with matching card name (case-insensitive)
    const playMove = validMoves.find(
      m => (m.type === 'play_action' || m.type === 'play_treasure') &&
           m.card?.toLowerCase() === cardName.toLowerCase()
    );
    return playMove || null;
  }

  // Check for "trash [CardName]" command
  const trashMatch = trimmed.match(/^trash\s+(.+)$/);
  if (trashMatch) {
    const cardName = trashMatch[1];
    // Find trash_cards move with matching card (for single-card trash like Chapel)
    const trashMove = validMoves.find(
      m => m.type === 'trash_cards' &&
           m.cards &&
           m.cards.length === 1 &&
           m.cards[0]?.toLowerCase() === cardName.toLowerCase()
    );
    return trashMove || null;
  }

  // No match found
  return null;
}

/**
 * Format error output for invalid move syntax
 *
 * @req: TB-CLI-4.1 - Invalid move shows context + valid moves
 */
function formatInvalidMoveError(
  move: string,
  state: GameState,
  validMoves: Move[],
  options: CLIOptions
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`Error: Invalid move command: "${move}"`);
  lines.push('');

  // Show current state and valid moves
  const stateOutput = formatOutputForTurnBasedMode(state, validMoves, options);
  lines.push(stateOutput);

  return lines.join('\n');
}

/**
 * Format error output for move execution failure
 *
 * @req: TB-CLI-4.1 - Invalid move shows context + valid moves
 */
function formatMoveExecutionError(
  error: string,
  state: GameState,
  validMoves: Move[],
  options: CLIOptions
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`Error: ${error}`);
  lines.push('');

  // Show current state and valid moves
  const stateOutput = formatOutputForTurnBasedMode(state, validMoves, options);
  lines.push(stateOutput);

  return lines.join('\n');
}

/**
 * Format success output after move execution
 *
 * @req: TB-CLI-3.1 - Output matches interactive mode
 */
function formatMoveSuccessOutput(
  moveLog: string,
  state: GameState,
  validMoves: Move[],
  options: CLIOptions
): string {
  const lines: string[] = [];

  // Show move result
  if (moveLog) {
    lines.push('');
    lines.push(`✓ ${moveLog}`);
  }

  // Show updated state
  const stateOutput = formatOutputForTurnBasedMode(state, validMoves, options);
  lines.push(stateOutput);

  return lines.join('\n');
}

/**
 * Capitalize the first letter of the phase name
 */
function capitalizePhase(phase: string): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}
