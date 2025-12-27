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

import { GameEngine, GameState, Move, getMoveDescriptionCompact, isGameOver, getGameOverReason, calculateVictoryPoints } from '@principality/core';
import { CLIOptions } from './cli';
import { saveStateToFile, loadStateFromFile } from './state-persistence';
import { Parser, ParseResult } from './parser';
import { formatVPDisplay } from './vp-calculator';
import { getStableNumber } from './stable-numbers';

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

    // @req: TB-CLI-5.1 - Detect game end condition at start
    // @req: TB-CLI-5.4 - Prevent further moves after game ends
    if (isGameOver(state)) {
      // Game is already over - return game over output
      const output = formatGameOverOutput(state);
      return {
        output,
        state,
        success: true // Not an error, game is just over
      };
    }

    // Initialize engine with same seed
    const engine = new GameEngine(state.seed, {
      victoryPileSize: options.victoryPileSize,
      edition: options.edition,
      debugMode: options.debugMode
    });

    // Get valid moves for current state
    const validMoves = engine.getValidMoves(state);

    // @req: TB-CLI-6.1 - Use shared Parser class for move parsing
    const parser = new Parser();
    const parseResult = parser.parseInput(move, validMoves, {
      stableNumbers: options.stableNumbers
    });

    // @req: TB-CLI-6.2 - Support "treasures" command (t, play all, all)
    if (parseResult.type === 'command' && parseResult.command === 'treasures') {
      return await handleTreasuresCommand(engine, state, validMoves, options, stateFilePath);
    }

    // Handle other commands (help, etc.) - just return state with valid moves
    if (parseResult.type === 'command') {
      const output = formatOutputForTurnBasedMode(state, validMoves, options);
      return { output, state, success: true };
    }

    // Handle chain input - execute first move only for now
    let parsedMove: Move | undefined;
    if (parseResult.type === 'chain' && parseResult.chain && parseResult.chain.length > 0) {
      const firstNum = parseResult.chain[0];
      if (options.stableNumbers) {
        // Find move by stable number
        parsedMove = validMoves.find(m => getStableNumberForMove(m) === firstNum);
      } else if (firstNum >= 1 && firstNum <= validMoves.length) {
        parsedMove = validMoves[firstNum - 1];
      }
    } else if (parseResult.type === 'move') {
      parsedMove = parseResult.move;
    } else if (parseResult.type === 'invalid') {
      // Parser didn't recognize - try text move commands (buy, play, end phase, etc.)
      parsedMove = parseMoveCommand(move, validMoves, options) || undefined;
    }

    if (!parsedMove) {
      // No valid move found - use Parser's detailed error if available
      const errorMessage = parseResult.error || 'Invalid move command';
      const errorOutput = formatInvalidMoveError(
        move,
        errorMessage,
        state,
        validMoves,
        options
      );
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

    // @req: TB-CLI-5.1 - Detect game end condition after move
    // @req: TB-CLI-5.2 - Display GAME OVER message with reason
    if (isGameOver(newState)) {
      // Game just ended - return game over output with last move
      const lastLog = newState.gameLog[newState.gameLog.length - 1] || '';
      const output = formatGameOverOutput(newState, lastLog);
      return {
        output,
        state: newState,
        success: true
      };
    }

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
 * Get stable number for a move
 * @req: TB-CLI-6.3 - Stable numbers work when enabled
 */
function getStableNumberForMove(move: Move): number | null {
  let moveKey: string;

  switch (move.type) {
    case 'play_action':
      moveKey = move.card || '';
      break;
    case 'play_treasure':
      moveKey = move.card || '';
      break;
    case 'buy':
      moveKey = `Buy ${move.card}`;
      break;
    case 'end_phase':
      moveKey = 'End Phase';
      break;
    default:
      return null;
  }

  return getStableNumber(moveKey);
}

/**
 * Handle the treasures command - auto-play all treasures
 * @req: TB-CLI-6.2 - Support "treasures" command (t, play all, all)
 */
async function handleTreasuresCommand(
  engine: GameEngine,
  state: GameState,
  validMoves: Move[],
  options: CLIOptions,
  stateFilePath: string
): Promise<{ output: string; state: GameState; success: boolean }> {
  // Find all play_treasure moves
  const treasureMoves = validMoves.filter(m => m.type === 'play_treasure');

  if (treasureMoves.length === 0) {
    // No treasures to play - check if we're in the wrong phase
    if (state.phase === 'action') {
      const errorOutput = formatInvalidMoveError(
        'treasures',
        'Cannot play treasures in action phase',
        state,
        validMoves,
        options
      );
      return { output: errorOutput, state, success: false };
    }
    // In buy phase but no treasures in hand
    const output = `Played 0 treasures for $${state.players[state.currentPlayer].coins}\n` +
      formatOutputForTurnBasedMode(state, validMoves, options);
    return { output, state, success: true };
  }

  // Execute each treasure move in sequence
  let currentState = state;
  let treasuresPlayed = 0;

  for (const treasureMove of treasureMoves) {
    const result = engine.executeMove(currentState, treasureMove);
    if (result.success && result.newState) {
      currentState = result.newState;
      treasuresPlayed++;
    }
  }

  // Calculate coins gained
  const coinsAfter = currentState.players[currentState.currentPlayer].coins;

  // Save the updated state
  await saveStateToFile(currentState, options, stateFilePath);

  // Get new valid moves
  const newValidMoves = engine.getValidMoves(currentState);

  // Format output
  const treasureText = treasuresPlayed === 1 ? 'treasure' : 'treasures';
  const output = `Played ${treasuresPlayed} ${treasureText} for $${coinsAfter}\n` +
    formatOutputForTurnBasedMode(currentState, newValidMoves, options);

  return { output, state: currentState, success: true };
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
  // @req: TB-CLI-6.3 - Stable numbers work when enabled
  lines.push('Available Moves:');

  // @req: TB-CLI-6.2 - Show [T] Play ALL Treasures option when treasures available
  // Calculate treasure value for display
  const treasureMoves = validMoves.filter(m => m.type === 'play_treasure');
  let treasureValue = 0;
  if (treasureMoves.length > 0) {
    // Calculate total treasure value from cards in hand
    treasureMoves.forEach(m => {
      if (m.card === 'Copper') treasureValue += 1;
      else if (m.card === 'Silver') treasureValue += 2;
      else if (m.card === 'Gold') treasureValue += 3;
    });
  }

  let moveIndex = 1;
  let treasureOptionShown = false;

  validMoves.forEach((move) => {
    const moveDescription = getMoveDescriptionCompact(move);

    // Show individual treasure moves, then [T] option after last one
    if (move.type === 'play_treasure') {
      if (options.stableNumbers) {
        const stableNum = getStableNumberForMove(move);
        lines.push(stableNum !== null ? `  [${stableNum}] ${moveDescription}` : `  ${moveDescription}`);
      } else {
        lines.push(`  [${moveIndex}] ${moveDescription}`);
        moveIndex++;
      }

      // Check if this is the last treasure move
      const isLastTreasure = validMoves.filter(m => m.type === 'play_treasure').indexOf(move) ===
                             validMoves.filter(m => m.type === 'play_treasure').length - 1;
      if (isLastTreasure && !treasureOptionShown && treasureMoves.length > 1) {
        lines.push(`  [T] Play ALL Treasures (+$${treasureValue})`);
        treasureOptionShown = true;
      }
    } else {
      // Non-treasure moves (buy, end_phase, action, etc.)
      if (options.stableNumbers) {
        const stableNum = getStableNumberForMove(move);
        lines.push(stableNum !== null ? `  [${stableNum}] ${moveDescription}` : `  ${moveDescription}`);
      } else {
        lines.push(`  [${moveIndex}] ${moveDescription}`);
        moveIndex++;
      }
    }
  });

  // Also show [T] if there's only one treasure (still useful to use 't' command)
  if (treasureMoves.length === 1 && !treasureOptionShown) {
    lines.push(`  [T] Play ALL Treasures (+$${treasureValue})`);
  }
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
 * @req: TB-CLI-6.4 - Error messages include context from Parser
 */
function formatInvalidMoveError(
  move: string,
  parserError: string,
  state: GameState,
  validMoves: Move[],
  options: CLIOptions
): string {
  const lines: string[] = [];

  lines.push('');
  // Use parser's detailed error message
  lines.push(`Error: ${parserError}`);
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
 * Format game over output
 *
 * @req: TB-CLI-5.2 - Display GAME OVER message with reason
 * @req: TB-CLI-5.3 - Show final scores for each player
 * @req: TB-CLI-5.4 - No Available Moves section after game ends
 * @param state - Game state (game must be over)
 * @param moveLog - Optional move log entry from last move
 * @returns Formatted game over output
 */
function formatGameOverOutput(state: GameState, moveLog?: string): string {
  const lines: string[] = [];

  // Show last move result if provided
  if (moveLog) {
    lines.push('');
    lines.push(`✓ ${moveLog}`);
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('GAME OVER');
  lines.push('='.repeat(60));
  lines.push('');

  // Show game end reason
  const reason = getGameOverReason(state);
  lines.push(`Reason: ${reason}`);
  lines.push(`Game ended on Turn ${state.turnNumber}`);
  lines.push('');

  // Show final scores for all players
  lines.push('Final Scores:');
  state.players.forEach((player, index) => {
    const vp = calculateVictoryPoints(player);
    lines.push(`  Player ${index + 1}: ${vp} VP`);
  });
  lines.push('');

  // Determine winner (highest VP wins)
  const scores = state.players.map(p => calculateVictoryPoints(p));
  const maxScore = Math.max(...scores);
  const winners = scores.reduce((acc, score, index) => {
    if (score === maxScore) acc.push(index + 1);
    return acc;
  }, [] as number[]);

  if (winners.length === 1) {
    lines.push(`Player ${winners[0]} wins with ${maxScore} Victory Points!`);
  } else {
    lines.push(`Tie game! Players ${winners.join(', ')} share victory with ${maxScore} VP each!`);
  }
  lines.push('');

  // NO Available Moves section (per TB-CLI-5.4)

  return lines.join('\n');
}

/**
 * Capitalize the first letter of the phase name
 */
function capitalizePhase(phase: string): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}
