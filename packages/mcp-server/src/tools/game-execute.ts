/**
 * game_execute Tool Implementation
 *
 * Atomically validates and executes a single move with actionable error messages
 */

import {
  GameState,
  Move,
  isActionCard,
  isTreasureCard,
  parseMove,
  isMoveValid,
  groupHand,
  isGameOver,
  getGameOverReason,
  countEmptyPiles,
  generateSuggestion,
  analyzeRejectionReason,
  getCardCost,
  calculateScore,
  getAllPlayerCards,
  CardName,
  generateMoveOptions,
  formatMoveCommand
} from '@principality/core';
import { GameExecuteRequest, GameExecuteResponse } from '../types/tools';
import { GameRegistryManager } from '../game-registry';
import { Logger } from '../logger';

export class GameExecuteTool {
  private moveHistory: Array<{
    turn: number;
    move: string;
    success: boolean;
    timestamp: string;
  }> = [];

  constructor(
    private registry: GameRegistryManager,
    private logger?: Logger
  ) {}

  async execute(request: GameExecuteRequest): Promise<GameExecuteResponse> {
    const { move, return_detail = 'minimal', reasoning, gameId } = request;

    const game = this.registry.getGame(gameId);
    if (!game) {
      this.logger?.warn('Move executed without active game', { move, gameId });
      return {
        success: false,
        error: {
          message: 'No active game. Use game_session(command="new") to start.',
          suggestion: 'Call game_session(command="new") to begin a new game.'
        }
      };
    }

    const state = game.state;

    // Check if game is over (before parsing move)
    if (isGameOver(state)) {
      const gameOverReason = getGameOverReason(state);
      this.logger?.warn('Move blocked - game over', {
        move,
        turn: state.turnNumber,
        phase: state.phase,
        gameOverReason: gameOverReason,
        attemptedAfterGameEnd: true,
        provinceCount: state.supply.get('Province') || 0,
        emptyPilesCount: countEmptyPiles(state)
      });
      return {
        success: false,
        error: {
          message: 'Game is over. Use game_session(command="new") to start a new game.',
          suggestion: 'The game has ended due to Province pile empty or 3+ piles depleted. Start a fresh game with game_session(command="new").',
          details: {
            gameOverReason: gameOverReason
          }
        }
      };
    }

    // Parse move string
    const parseResult = parseMove(move, state);
    if (!parseResult.success || !parseResult.move) {
      this.logger?.warn('Failed to parse move', { move, phase: state.phase });
      return {
        success: false,
        error: {
          message: parseResult.error || `Cannot parse move: "${move}". Invalid format.`,
          suggestion: 'Examples: "play 0" (action), "play_treasure Copper" (buy phase), "buy Village", "end"'
        }
      };
    }

    const parsedMove = parseResult.move;

    // Handle batch treasure playing specially (before standard validation)
    // Batch moves bypass validation since they're not in standard validMoves list
    if (parsedMove.type === 'play_all_treasures') {
      return this.executeBatchTreasures(move, state, reasoning, gameId);
    }

    // Validate move before executing
    const validMoves = game.engine.getValidMoves(state);
    const isValid = isMoveValid(parsedMove, validMoves);

    if (!isValid) {
      // Determine reason for rejection (for logging)
      const rejection = analyzeRejectionReason(parsedMove, validMoves, state);

      this.logger?.warn('Invalid move attempted', {
        move,
        phase: state.phase,
        moveType: parsedMove.type,
        reason: rejection.reason,
        details: rejection.details
      });

      // Auto-return state for error recovery
      const gameState = this.formatStateForAutoReturn(state);
      const formattedValidMoves = this.formatValidMovesForAutoReturn(state, game.engine);

      return {
        success: false,
        error: {
          message: `Invalid move: "${move}" is not legal in current game state.`,
          suggestion: generateSuggestion(parsedMove, validMoves, state),
          details: {
            currentPhase: state.phase,
            playerHand: state.players[state.currentPlayer].hand.length
          }
        },
        gameState: gameState,
        validMoves: formattedValidMoves,
        gameOver: gameState.gameOver
      };
    }

    // Execute move
    try {
      const result = game.engine.executeMove(state, parsedMove);

      if (!result.success) {
        this.logger?.error('Move execution failed', { move, error: result.error });

        // Auto-return current state even on failure (for recovery)
        const gameState = this.formatStateForAutoReturn(state);
        const validMoves = this.formatValidMovesForAutoReturn(state, game.engine);

        return {
          success: false,
          error: {
            message: result.error || 'Move execution failed.',
            suggestion: 'Try using game_observe() to see valid moves.'
          },
          gameState: gameState,
          validMoves: validMoves,
          gameOver: gameState.gameOver
        };
      }

      // Update server state
      if (result.newState) {
        this.registry.setState(game.id, result.newState);
      }

      // Log successful move
      this.moveHistory.push({
        turn: state.turnNumber,
        move,
        success: true,
        timestamp: new Date().toISOString()
      });

      // Log to file (include reasoning if provided)
      const logData: any = {
        move,
        turn: state.turnNumber,
        phase: state.phase,
        moveType: parsedMove.type,
        card: parsedMove.card
      };
      if (reasoning) {
        logData.reasoning = reasoning;

        // Validate reasoning accuracy for treasure plays (optional warning)
        // Note: play_all_treasures is not a standard move type, so we check via the move string instead
        if (move.toLowerCase().includes('play') && move.toLowerCase().includes('treasure') && reasoning.toLowerCase().includes('coin')) {
          // Extract stated coin amount from reasoning (e.g., "= 9 coins")
          const reasoningMatch = reasoning.match(/=\s*(\d+)\s*coins/i);
          if (reasoningMatch) {
            const statedCoins = parseInt(reasoningMatch[1]);
            const player = result.newState?.players[result.newState.currentPlayer] || state.players[state.currentPlayer];
            const actualCoins = player.coins || 0;

            if (statedCoins !== actualCoins) {
              this.logger?.warn('Reasoning mismatch - coin calculation', {
                move,
                turn: state.turnNumber,
                statedCoins: statedCoins,
                actualCoins: actualCoins,
                reasoning: reasoning
              });
            }
          }
        }
      }
      this.logger?.info('Move executed', logData);

      // ============================================================
      // FIX #72: Build response AFTER all state transitions complete
      // Previously, response was built before cleanup auto-skip,
      // causing phase desynchronization between execute and observe.
      // ============================================================

      // Step 1: Get state after move execution
      let finalState = result.newState || state;
      let phaseChangedMessage: string | undefined;
      let cleanupAutoSkipped = false;

      // Step 2: Check if phase changed from move execution
      if (result.newState && result.newState.phase !== state.phase) {
        phaseChangedMessage = `${state.phase} → ${result.newState.phase}`;
        this.logger?.info('Phase changed', {
          from: state.phase,
          to: result.newState.phase,
          turn: state.turnNumber
        });
      }

      // Step 3: Auto-skip cleanup phase BEFORE building response (no player choices in MVP)
      if (finalState.phase === 'cleanup') {
        const cleanupResult = game.engine.executeMove(finalState, {
          type: 'end_phase'
        });

        if (cleanupResult.success && cleanupResult.newState) {
          finalState = cleanupResult.newState;
          cleanupAutoSkipped = true;

          // Log cleanup auto-skip
          this.logger?.info('Cleanup auto-skipped', {
            turn: state.turnNumber,
            reason: 'no_player_choices',
            newPhase: finalState.phase,
            newTurn: finalState.turnNumber
          });

          // Log the cleanup-to-next-phase transition
          this.logger?.info('Phase changed', {
            from: 'cleanup',
            to: finalState.phase,
            turn: finalState.turnNumber,
            autoSkipped: true
          });

          // Update server state with final state BEFORE building response
          this.registry.setState(game.id, finalState);
        } else {
          // FIX: Handle cleanup failure (previously silent)
          this.logger?.warn('Cleanup auto-skip failed', {
            turn: state.turnNumber,
            error: cleanupResult.error,
            phase: finalState.phase
          });
          // Keep finalState as-is (cleanup phase) - don't corrupt state
        }
      }

      // Step 4: NOW build response with FINAL state (after all transitions)
      const gameState = this.formatStateForAutoReturn(finalState);
      const validMoves = this.formatValidMovesForAutoReturn(finalState, game.engine);

      // Build response message
      let responseMessage = `Executed: ${move}`;
      if (cleanupAutoSkipped) {
        responseMessage = `${move} → Cleanup auto-skipped → ${finalState.phase} phase`;
      }

      const response: GameExecuteResponse = {
        success: true,
        message: responseMessage,
        gameState: gameState,
        validMoves: validMoves,
        gameOver: gameState.gameOver
      };

      // Add phase change info if applicable
      if (phaseChangedMessage) {
        response.phaseChanged = phaseChangedMessage;
      }

      // Use finalState for all subsequent operations (replaces finalStateAfterAutoSkip)
      const finalStateAfterAutoSkip = finalState;

      // Log comprehensive turn state and economic tracking AFTER auto-skip
      if (finalStateAfterAutoSkip.phase === 'action' && state.phase !== 'action') {
        // Log full turn state snapshot at turn start
        this.logTurnStartState(finalStateAfterAutoSkip);

        // Logging turn start economy when entering action phase
        const metrics = this.calculateEconomicMetrics(finalStateAfterAutoSkip);
        this.logger?.info('Turn start economy', {
          turn: finalStateAfterAutoSkip.turnNumber,
          phase: 'action',
          handComposition: metrics.handComposition,
          handSize: metrics.handSize,
          treasuresAvailable: metrics.treasuresInHand,
          actionsAvailable: metrics.actionsInHand,
          deckSize: metrics.deckSize
        });
      } else if (state.phase === 'buy' && (result.newState?.phase === 'cleanup' || finalStateAfterAutoSkip.phase === 'action')) {
        // Logging turn end economy when buy phase ends (even if auto-skipped to action)
        const beforeMetrics = this.calculateEconomicMetrics(state);
        this.logger?.info('Turn buy phase summary', {
          turn: state.turnNumber,
          phase: 'buy',
          buysAvailable: beforeMetrics.availableBuys,
          coinsAvailable: beforeMetrics.availableCoins,
          cardsBought: parsedMove.type === 'buy' ? [parsedMove.card] : [],
          deckSize: beforeMetrics.deckSize
        });
      }

      // Log game-end event if game is over
      if (isGameOver(finalStateAfterAutoSkip)) {
        const emptyPiles: string[] = [];
        finalStateAfterAutoSkip.supply.forEach((quantity: number, cardName: string) => {
          if (quantity === 0) {
            emptyPiles.push(cardName);
          }
        });

        const gameOverReason = getGameOverReason(finalStateAfterAutoSkip);

        // Calculate final scores and detailed breakdowns
        const finalScores: number[] = [];
        const vpBreakdowns: Record<string, any> = {};
        const deckCompositions: Record<string, any> = {};

        finalStateAfterAutoSkip.players.forEach((player: any, index: number) => {
          const allCards = getAllPlayerCards(player.drawPile, player.hand, player.discardPile);
          const score = calculateScore(allCards);
          finalScores.push(score);

          // Count victory points by card type
          const vpBreakdown: Record<string, number> = {};
          let estateCount = 0, duchyCount = 0, provinceCount = 0, curseCount = 0, gardensCount = 0;

          allCards.forEach(card => {
            if (card === 'Estate') estateCount++;
            else if (card === 'Duchy') duchyCount++;
            else if (card === 'Province') provinceCount++;
            else if (card === 'Curse') curseCount++;
            else if (card === 'Gardens') gardensCount++;
          });

          if (estateCount > 0) vpBreakdown['Estate'] = estateCount * 1;
          if (duchyCount > 0) vpBreakdown['Duchy'] = duchyCount * 3;
          if (provinceCount > 0) vpBreakdown['Province'] = provinceCount * 6;
          if (curseCount > 0) vpBreakdown['Curse'] = curseCount * -1;
          if (gardensCount > 0) {
            const gardensVP = gardensCount * Math.floor(allCards.length / 10);
            vpBreakdown['Gardens'] = gardensVP;
          }
          vpBreakdown['total'] = score;

          vpBreakdowns[`player${index}`] = vpBreakdown;

          // Count all cards in deck
          const deckComposition: Record<string, number> = {};
          allCards.forEach(card => {
            deckComposition[card] = (deckComposition[card] || 0) + 1;
          });
          deckCompositions[`player${index}`] = deckComposition;
        });

        // Determine winner
        const maxScore = Math.max(...finalScores);
        const winners = finalScores
          .map((score, index) => ({ score, index }))
          .filter(p => p.score === maxScore)
          .map(p => p.index);

        const winner = winners.length === 1 ? winners[0] : null;

        // Convert supply to object for logging
        const supplyAtEnd: Record<string, number> = {};
        finalStateAfterAutoSkip.supply.forEach((quantity: number, cardName: string) => {
          supplyAtEnd[cardName] = quantity;
        });

        this.logger?.info('Game ended', {
          turn: finalStateAfterAutoSkip.turnNumber,
          phase: finalStateAfterAutoSkip.phase,
          reason: gameOverReason,
          emptyPiles: emptyPiles,
          totalEmptyPileCount: emptyPiles.length,
          finalScores: finalScores,
          vpBreakdowns: vpBreakdowns,
          deckCompositions: deckCompositions,
          supplyAtEnd: supplyAtEnd,
          winner: winner,
          tie: winners.length > 1,
          winners: winners.length > 1 ? winners : undefined
        });
      }

      // Phase 4.2: Check for pending effect and generate options
      if (finalStateAfterAutoSkip.pendingEffect) {
        const pendingEffect = finalStateAfterAutoSkip.pendingEffect;
        const validMovesForOptions = game.engine.getValidMoves(finalStateAfterAutoSkip);
        const options = generateMoveOptions(finalStateAfterAutoSkip, validMovesForOptions);

        if (options.length > 0) {
          // Determine step number for multi-step cards
          let step: number | undefined = undefined;
          if (pendingEffect.card === 'Remodel' || pendingEffect.card === 'Mine') {
            // @decision: Remodel uses 'trash_for_remodel', Mine uses 'select_treasure_to_trash' for step 1
            // Both use 'gain_card'/'gain_treasure' for step 2
            if (pendingEffect.effect === 'trash_for_remodel' || pendingEffect.effect === 'select_treasure_to_trash') {
              step = 1;
            } else if (pendingEffect.effect === 'gain_card' || pendingEffect.effect === 'gain_treasure') {
              step = 2;
            }
          }

          // Format options for MCP response
          response.pendingEffect = {
            card: pendingEffect.card,
            effect: pendingEffect.effect,
            step,
            options: options.map((opt: any) => ({
              index: opt.index,
              description: opt.description,
              command: formatMoveCommand(opt.move)
            }))
          };

          // Update message to indicate pending effect
          const stepText = step ? ` - Step ${step}` : '';
          response.message = `Card requires choice: ${pendingEffect.card}${stepText}`;
        } else {
          // Fallback: Options generation not implemented for this effect type
          // Provide raw valid moves so LLM can still attempt to make progress
          response.pendingEffect = {
            card: pendingEffect.card,
            effect: pendingEffect.effect,
            error: 'Options generation not implemented for this effect type',
            validMoves: validMovesForOptions.map((m: any) => formatMoveCommand(m))
          };
          response.message = `Warning: Card requires choice but option generation is incomplete. Card: ${pendingEffect.card}, Effect: ${pendingEffect.effect}. Try using raw move commands.`;
        }
      }

      // Include full state if requested (backward compatibility)
      if (return_detail === 'full') {
        response.state = finalStateAfterAutoSkip;
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Unexpected error during move execution.',
          suggestion: 'Try again or check game state with game_observe().',
          details: {
            error: error instanceof Error ? error.message : String(error)
          }
        }
      };
    }
  }

  /**
   * Execute batch treasure playing - play all treasures in hand at once
   */
  private async executeBatchTreasures(
    originalMove: string,
    state: GameState,
    reasoning?: string,
    gameId?: string
  ): Promise<GameExecuteResponse> {
    const player = state.players[state.currentPlayer];

    // Get game instance for engine access
    const game = this.registry.getGame(gameId);
    if (!game) {
      return {
        success: false,
        error: {
          message: 'Game not found.',
          suggestion: 'Call game_session(command="new") to begin a new game.'
        }
      };
    }

    // Validate phase
    if (state.phase !== 'buy') {
      const gameState = this.formatStateForAutoReturn(state);
      const validMoves = this.formatValidMovesForAutoReturn(state, game.engine);

      return {
        success: false,
        error: {
          message: 'Cannot play treasures in Action phase.',
          suggestion: 'Use "end" to move to Buy phase first, then play treasures.'
        },
        gameState: gameState,
        validMoves: validMoves,
        gameOver: gameState.gameOver
      };
    }

    // Get all treasure cards from hand
    const treasures = player.hand.filter(card => isTreasureCard(card));

    if (treasures.length === 0) {
      const gameState = this.formatStateForAutoReturn(state);
      const validMoves = this.formatValidMovesForAutoReturn(state, game.engine);

      return {
        success: false,
        error: {
          message: 'No treasures in hand to play.',
          suggestion: 'Use "buy CARD" to make a purchase or "end" to move to cleanup phase.'
        },
        gameState: gameState,
        validMoves: validMoves,
        gameOver: gameState.gameOver
      };
    }

    // Execute each treasure sequentially
    let currentState = state;
    let successCount = 0;
    const treasuresPlayed: string[] = [];

    for (const treasure of treasures) {
      const treasureMove: Move = {
        type: 'play_treasure',
        card: treasure
      };

      const result = game.engine.executeMove(currentState, treasureMove);

      if (result.success && result.newState) {
        currentState = result.newState;
        successCount++;
        treasuresPlayed.push(treasure);
      } else {
        this.logger?.warn('Batch treasure play: individual treasure failed', {
          treasure,
          error: result.error
        });
      }
    }

    // Update server state with final state
    this.registry.setState(game.id, currentState);

    // Log successful batch move
    this.moveHistory.push({
      turn: state.turnNumber,
      move: originalMove,
      success: true,
      timestamp: new Date().toISOString()
    });

    // Log to file
    const logData: any = {
      move: originalMove,
      turn: state.turnNumber,
      phase: state.phase,
      moveType: 'play_all_treasures',
      treasuresPlayed: treasuresPlayed,
      treasureCount: successCount,
      coinsGenerated: currentState.players[currentState.currentPlayer].coins
    };
    if (reasoning) {
      logData.reasoning = reasoning;
    }
    this.logger?.info('Batch treasures executed', logData);

    // Auto-return game state and valid moves
    const gameState = this.formatStateForAutoReturn(currentState);
    const validMoves = this.formatValidMovesForAutoReturn(currentState, game.engine);

    // Return success response with auto-returned state
    const coins = currentState.players[currentState.currentPlayer].coins;
    return {
      success: true,
      message: `Played ${successCount} treasure(s) → ${coins} coins`,
      gameState: gameState,
      validMoves: validMoves,
      gameOver: gameState.gameOver
    };
  }



  getMoveHistory(lastN?: number): typeof this.moveHistory {
    if (!lastN) return this.moveHistory;
    return this.moveHistory.slice(-lastN);
  }

  /**
   * Log comprehensive turn state snapshot at turn start
   */
  private logTurnStartState(state: GameState) {
    const player = state.players[state.currentPlayer];

    // Collect supply pile counts
    const supplyPiles: Record<string, number> = {};
    state.supply.forEach((quantity, cardName) => {
      supplyPiles[cardName] = quantity;
    });

    // Count empty piles (for win condition tracking)
    const emptyPileCount = countEmptyPiles(state);

    // Deck zone breakdown
    const deckZones = {
      drawPile: player.drawPile?.length || 0,
      hand: player.hand?.length || 0,
      inPlay: player.inPlay?.length || 0,
      discardPile: player.discardPile?.length || 0,
      total: (player.drawPile?.length || 0) +
             (player.hand?.length || 0) +
             (player.inPlay?.length || 0) +
             (player.discardPile?.length || 0)
    };

    // Hand composition
    const handComposition: Record<string, number> = {};
    player.hand.forEach(card => {
      handComposition[card] = (handComposition[card] || 0) + 1;
    });

    // Log comprehensive state
    this.logger?.info('Turn start state', {
      turn: state.turnNumber,
      phase: state.phase,
      supply: supplyPiles,
      emptyPiles: emptyPileCount,
      deck: deckZones,
      hand: handComposition,
      resources: {
        actions: player.actions || 0,
        buys: player.buys || 0,
        coins: player.coins || 0
      }
    });
  }

  /**
   * Calculate economic metrics for a game state
   */
  private calculateEconomicMetrics(state: GameState) {
    const player = state.players[state.currentPlayer];

    // Hand composition count (e.g., {Copper: 3, Silver: 2, Village: 1})
    const handComposition: Record<string, number> = {};
    player.hand.forEach(card => {
      handComposition[card] = (handComposition[card] || 0) + 1;
    });

    // Count treasures and actions available
    const treasuresInHand = player.hand.filter(card => isTreasureCard(card)).length;
    const actionsInHand = player.hand.filter(card => isActionCard(card)).length;

    // Deck size = drawPile + hand + inPlay + discardPile
    const deckSize = (player.drawPile?.length || 0) +
                     (player.hand?.length || 0) +
                     (player.inPlay?.length || 0) +
                     (player.discardPile?.length || 0);

    return {
      handComposition,
      handSize: player.hand?.length || 0,
      treasuresInHand,
      actionsInHand,
      deckSize,
      availableActions: player.actions || 0,
      availableBuys: player.buys || 0,
      availableCoins: player.coins || 0
    };
  }


  /**
   * Format state for auto-return (similar to "standard" detail level in game_observe)
   */
  private formatStateForAutoReturn(state: GameState): any {
    const activePlayer = state.players[state.currentPlayer];
    const gameOverFlag = isGameOver(state);

    return {
      phase: state.phase,
      turnNumber: state.turnNumber,
      activePlayer: state.currentPlayer,
      hand: groupHand(activePlayer.hand),
      currentCoins: activePlayer.coins || 0,
      currentActions: activePlayer.actions || 0,
      currentBuys: activePlayer.buys || 0,
      gameOver: gameOverFlag
    };
  }

  /**
   * Format valid moves for auto-return
   *
   * @resolved: Now uses formatMoveCommand() for all move types
   */
  private formatValidMovesForAutoReturn(state: GameState, engine: any): string[] {
    const validMoves = engine.getValidMoves(state);
    return validMoves.map((move: any) => formatMoveCommand(move));
  }
}
