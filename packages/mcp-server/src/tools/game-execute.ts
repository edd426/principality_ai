/**
 * game_execute Tool Implementation
 *
 * Atomically validates and executes a single move with actionable error messages
 */

import { GameEngine, GameState, Move, isActionCard, isTreasureCard } from '@principality/core';
import { GameExecuteRequest, GameExecuteResponse } from '../types/tools';
import { Logger } from '../logger';

export class GameExecuteTool {
  private moveHistory: Array<{
    turn: number;
    move: string;
    success: boolean;
    timestamp: string;
  }> = [];

  constructor(
    private gameEngine: GameEngine,
    private getState: () => GameState | null,
    private setState: (state: GameState) => void,
    private logger?: Logger
  ) {}

  async execute(request: GameExecuteRequest): Promise<GameExecuteResponse> {
    const { move, return_detail = 'minimal', reasoning } = request;

    const state = this.getState();
    if (!state) {
      this.logger?.warn('Move executed without active game', { move });
      return {
        success: false,
        error: {
          message: 'No active game. Use game_session(command="new") to start.',
          suggestion: 'Call game_session(command="new") to begin a new game.'
        }
      };
    }

    // Check if game is over (before parsing move)
    if (this.isGameOver(state)) {
      const gameOverReason = this.getGameOverReason(state);
      this.logger?.warn('Move blocked - game over', {
        move,
        turn: state.turnNumber,
        phase: state.phase,
        gameOverReason: gameOverReason,
        attemptedAfterGameEnd: true,
        provinceCount: state.supply.get('Province') || 0,
        emptyPilesCount: this.countEmptyPiles(state)
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
    const parsedMove = this.parseMove(move, state);
    if (!parsedMove) {
      this.logger?.warn('Failed to parse move', { move, phase: state.phase });
      return {
        success: false,
        error: {
          message: `Cannot parse move: "${move}". Invalid format.`,
          suggestion: 'Examples: "play 0" (action), "play_treasure Copper" (buy phase), "buy Village", "end"'
        }
      };
    }

    // Handle batch treasure playing specially (before standard validation)
    // Batch moves bypass validation since they're not in standard validMoves list
    if (parsedMove.type === 'play_all_treasures') {
      return this.executeBatchTreasures(move, state, reasoning);
    }

    // Validate move before executing
    const validMoves = this.gameEngine.getValidMoves(state);
    const isValid = this.isMoveValid(parsedMove, validMoves);

    if (!isValid) {
      // Determine reason for rejection (for logging)
      const rejection = this.analyzeRejectionReason(parsedMove, validMoves, state);

      this.logger?.warn('Invalid move attempted', {
        move,
        phase: state.phase,
        moveType: parsedMove.type,
        reason: rejection.reason,
        details: rejection.details
      });
      return {
        success: false,
        error: {
          message: `Invalid move: "${move}" is not legal in current game state.`,
          suggestion: this.generateSuggestion(parsedMove, validMoves, state),
          details: {
            currentPhase: state.phase,
            playerHand: state.players[state.currentPlayer].hand.length
          }
        }
      };
    }

    // Execute move
    try {
      const result = this.gameEngine.executeMove(state, parsedMove);

      if (!result.success) {
        this.logger?.error('Move execution failed', { move, error: result.error });

        // Auto-return current state even on failure (for recovery)
        const gameState = this.formatStateForAutoReturn(state);
        const validMoves = this.formatValidMovesForAutoReturn(state);

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
        this.setState(result.newState);
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

      // Auto-return game state and valid moves
      const finalState = result.newState || state;
      const gameState = this.formatStateForAutoReturn(finalState);
      const validMoves = this.formatValidMovesForAutoReturn(finalState);

      // Return response with auto-returned state
      const response: GameExecuteResponse = {
        success: true,
        message: `Executed: ${move}`,
        gameState: gameState,
        validMoves: validMoves,
        gameOver: gameState.gameOver
      };

      // Check if phase changed
      if (result.newState && result.newState.phase !== state.phase) {
        response.phaseChanged = `${state.phase} → ${result.newState.phase}`;
        this.logger?.info('Phase changed', {
          from: state.phase,
          to: result.newState.phase,
          turn: state.turnNumber
        });
      }

      // Auto-skip cleanup phase (no player choices in MVP)
      let finalStateAfterAutoSkip = result.newState || state;
      if (finalStateAfterAutoSkip.phase === 'cleanup') {
        const cleanupResult = this.gameEngine.executeMove(finalStateAfterAutoSkip, {
          type: 'end_phase'
        });

        if (cleanupResult.success && cleanupResult.newState) {
          finalStateAfterAutoSkip = cleanupResult.newState;

          // Log cleanup auto-skip
          this.logger?.info('Cleanup auto-skipped', {
            turn: state.turnNumber,
            reason: 'no_player_choices',
            newPhase: finalStateAfterAutoSkip.phase,
            newTurn: finalStateAfterAutoSkip.turnNumber
          });

          // Update response with final state (after cleanup auto-skip)
          response.gameState = this.formatStateForAutoReturn(finalStateAfterAutoSkip);
          response.validMoves = this.formatValidMovesForAutoReturn(finalStateAfterAutoSkip);
          response.message = `${move} → Cleanup auto-skipped → ${finalStateAfterAutoSkip.phase} phase`;

          // Log the cleanup-to-next-phase transition
          this.logger?.info('Phase changed', {
            from: 'cleanup',
            to: finalStateAfterAutoSkip.phase,
            turn: finalStateAfterAutoSkip.turnNumber,
            autoSkipped: true
          });

          // Update server state with final state
          this.setState(finalStateAfterAutoSkip);
        }
      }

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
      if (this.isGameOver(finalStateAfterAutoSkip)) {
        const emptyPiles: string[] = [];
        finalStateAfterAutoSkip.supply.forEach((quantity, cardName) => {
          if (quantity === 0) {
            emptyPiles.push(cardName);
          }
        });

        const gameOverReason = finalStateAfterAutoSkip.supply.get('Province') === 0
          ? 'Province pile empty'
          : `${emptyPiles.length} supply piles empty`;

        this.logger?.info('Game ended', {
          turn: finalStateAfterAutoSkip.turnNumber,
          phase: finalStateAfterAutoSkip.phase,
          reason: gameOverReason,
          emptyPiles: emptyPiles,
          totalEmptyPileCount: emptyPiles.length
        });
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
    reasoning?: string
  ): Promise<GameExecuteResponse> {
    const player = state.players[state.currentPlayer];

    // Validate phase
    if (state.phase !== 'buy') {
      const gameState = this.formatStateForAutoReturn(state);
      const validMoves = this.formatValidMovesForAutoReturn(state);

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
      const validMoves = this.formatValidMovesForAutoReturn(state);

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

      const result = this.gameEngine.executeMove(currentState, treasureMove);

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
    this.setState(currentState);

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
    const validMoves = this.formatValidMovesForAutoReturn(currentState);

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

  private parseMove(moveStr: string, state: GameState): Move | null {
    const trimmed = moveStr.toLowerCase().trim();
    const player = state.players[state.currentPlayer];

    // Parse "play N" or "play_action N" - determine actual card type
    if (trimmed.startsWith('play ')) {
      const indexStr = trimmed.substring(5).trim();
      const index = parseInt(indexStr);

      if (!isNaN(index) && index >= 0 && index < player.hand.length) {
        const cardName = player.hand[index];

        // Determine actual move type based on card type
        if (isActionCard(cardName)) {
          return {
            type: 'play_action',
            card: cardName
          };
        } else if (isTreasureCard(cardName)) {
          return {
            type: 'play_treasure',
            card: cardName
          };
        }
        // Unknown card type - fail gracefully
        return null;
      }
      return null;
    }

    // Parse "play_action CARD" syntax
    if (trimmed.startsWith('play_action ')) {
      const cardName = trimmed.substring('play_action '.length).trim();
      const normalizedName = cardName.charAt(0).toUpperCase() + cardName.slice(1);

      if (player.hand.includes(normalizedName) && isActionCard(normalizedName)) {
        return {
          type: 'play_action',
          card: normalizedName
        };
      }
      return null;
    }

    // Parse "play_treasure all" - batch play all treasures
    if (trimmed === 'play_treasure all' || trimmed === 'play treasure all') {
      return {
        type: 'play_all_treasures'
      };
    }

    // Parse "play_treasure CARD" or "play treasure CARD"
    if (trimmed.startsWith('play_treasure ') || trimmed.startsWith('play treasure ')) {
      const cardName = trimmed.includes('_')
        ? trimmed.substring('play_treasure '.length).trim()
        : trimmed.substring('play treasure '.length).trim();

      // Capitalize card name to match hand
      const normalizedName = cardName.charAt(0).toUpperCase() + cardName.slice(1);

      if (player.hand.includes(normalizedName)) {
        return {
          type: 'play_treasure',
          card: normalizedName
        };
      }
      return null;
    }

    // Parse "buy CARD"
    if (trimmed.startsWith('buy ')) {
      const cardName = trimmed.substring(4).trim();
      // Capitalize card name to match supply keys
      const normalizedName = cardName.charAt(0).toUpperCase() + cardName.slice(1);

      if (state.supply.has(normalizedName)) {
        return {
          type: 'buy',
          card: normalizedName
        };
      }
      return null;
    }

    // Parse "end" or "end phase"
    if (trimmed === 'end' || trimmed === 'end phase' || trimmed === 'end_phase') {
      return {
        type: 'end_phase'
      };
    }

    return null;
  }

  private isMoveValid(move: Move, validMoves: Move[]): boolean {
    return validMoves.some(vm =>
      vm.type === move.type && vm.card === move.card
    );
  }

  /**
   * Analyze why a move was rejected (for detailed logging)
   * Returns reason and details for diagnostics
   */
  private analyzeRejectionReason(
    move: Move,
    validMoves: Move[],
    state: GameState
  ): { reason: string; details: any } {
    const moveType = move.type;
    const validOfType = validMoves.filter(m => m.type === moveType);

    // Check if there are NO valid moves of this type
    if (validOfType.length === 0) {
      if (moveType === 'buy') {
        const player = state.players[state.currentPlayer];
        return {
          reason: 'No valid purchases available',
          details: {
            playerCoins: player.coins || 0,
            cardCost: move.card ? this.getCardCost(move.card) : null,
            availableCards: Array.from(state.supply.keys()).slice(0, 5)
          }
        };
      }
      if (moveType === 'play_action') {
        return {
          reason: 'No valid action plays available',
          details: { wrongPhase: state.phase !== 'action' }
        };
      }
      if (moveType === 'play_treasure') {
        return {
          reason: 'No valid treasure plays available',
          details: { phase: state.phase }
        };
      }
    }

    // Move type has valid options but this specific card/move is not valid
    if (moveType === 'buy' && move.card) {
      const player = state.players[state.currentPlayer];
      const cardCost = this.getCardCost(move.card);
      if (cardCost && player.coins! < cardCost) {
        return {
          reason: 'Insufficient coins',
          details: {
            playerCoins: player.coins,
            cardCost: cardCost,
            deficit: cardCost - (player.coins || 0)
          }
        };
      }
      if (!state.supply.has(move.card)) {
        return {
          reason: 'Card not in supply',
          details: { card: move.card }
        };
      }
      if (state.supply.get(move.card) === 0) {
        return {
          reason: 'Card pile empty',
          details: { card: move.card }
        };
      }
    }

    if ((moveType === 'play_action' || moveType === 'play_treasure') && move.card) {
      const player = state.players[state.currentPlayer];
      if (!player.hand.includes(move.card)) {
        return {
          reason: 'Card not in hand',
          details: { card: move.card, handSize: player.hand.length }
        };
      }
    }

    return {
      reason: 'Unknown rejection reason',
      details: { moveType, card: move.card }
    };
  }

  /**
   * Get cost of a card (simplified - real implementation would use card definitions)
   */
  private getCardCost(cardName: string | undefined): number | null {
    if (!cardName) return null;

    const cardCosts: { [key: string]: number } = {
      'Copper': 0,
      'Silver': 3,
      'Gold': 6,
      'Estate': 2,
      'Duchy': 5,
      'Province': 8,
      'Village': 3,
      'Smithy': 4,
      'Market': 5,
      'Militia': 4,
      'Cellar': 2,
      'Workshop': 3,
      'Remodel': 4,
      'Chapel': 2,
      'Throne Room': 4,
      'Woodcutter': 3
    };

    return cardCosts[cardName] || null;
  }

  private generateSuggestion(move: Move, validMoves: Move[], state: GameState): string {
    const moveType = move.type;
    const validOfType = validMoves.filter(m => m.type === moveType);

    if (moveType === 'play_action') {
      if (validOfType.length === 0) {
        if (state.phase === 'buy') {
          return `Cannot play action cards in buy phase. You must be in action phase. Try "play_treasure Copper" to play treasures or "buy CARD" to make a purchase.`;
        }
        return `No valid action plays available. Try "end" to move to next phase.`;
      }

      const validCards = validOfType.map(m => m.card).join(', ');
      const player = state.players[state.currentPlayer];
      const validIndices = player.hand
        .map((card, idx) => validOfType.some(m => m.card === card) ? idx : -1)
        .filter(idx => idx !== -1)
        .join(', ');

      return `Valid plays: ${validCards}. Use "play 0", "play 1", etc.`;
    }

    if (moveType === 'play_treasure') {
      if (validOfType.length === 0) {
        if (state.phase === 'action') {
          return `Cannot play treasures in action phase. You're in action phase - play action cards or "end" to move to buy phase.`;
        }
        return `No treasures in hand to play. Try "buy CARD" to make a purchase or "end" to move to cleanup.`;
      }

      const validCards = validOfType.map(m => m.card).join(', ');
      return `Valid treasures to play: ${validCards}. Use "play_treasure CARD" format, e.g., "play_treasure Copper"`;
    }

    if (moveType === 'buy') {
      if (validOfType.length === 0) {
        if (state.phase === 'action') {
          return `Cannot buy in action phase. Play action cards or use "end" to move to buy phase.`;
        }
        return `No valid purchases available. You may not have enough coins. Try "end" to move to cleanup phase.`;
      }

      const validCards = validOfType.map(m => m.card).join(', ');
      return `Valid purchases: ${validCards}. Use "buy CARD" format, e.g., "buy Province"`;
    }

    if (moveType === 'end_phase') {
      return `Use "end" to move to the next phase (${this.getNextPhaseName(state.phase)}).`;
    }

    return 'Use game_observe() to see valid moves.';
  }

  private getNextPhaseName(currentPhase: string): string {
    switch (currentPhase) {
      case 'action':
        return 'buy phase';
      case 'buy':
        return 'cleanup phase';
      case 'cleanup':
        return 'next player\'s action phase';
      default:
        return 'next phase';
    }
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
    const emptyPileCount = this.countEmptyPiles(state);

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
   * Check if game is over (same logic as game-observe isGameOver)
   */
  private isGameOver(state: GameState): boolean {
    let emptyPiles = 0;

    state.supply.forEach(quantity => {
      if (quantity === 0) emptyPiles++;
    });

    const provincesEmpty = state.supply.get('Province') === 0;
    return provincesEmpty || emptyPiles >= 3;
  }

  /**
   * Get human-readable reason why game ended
   */
  private getGameOverReason(state: GameState): string {
    const provincesEmpty = state.supply.get('Province') === 0;
    if (provincesEmpty) {
      return 'Province pile is empty';
    }

    let emptyPiles: string[] = [];
    state.supply.forEach((quantity, cardName) => {
      if (quantity === 0) {
        emptyPiles.push(cardName);
      }
    });

    if (emptyPiles.length >= 3) {
      return `${emptyPiles.length} supply piles are empty: ${emptyPiles.slice(0, 3).join(', ')}${emptyPiles.length > 3 ? ' and more' : ''}`;
    }

    return 'Unknown game end condition';
  }

  /**
   * Count empty piles in supply
   */
  private countEmptyPiles(state: GameState): number {
    let emptyPiles = 0;
    state.supply.forEach(quantity => {
      if (quantity === 0) emptyPiles++;
    });
    return emptyPiles;
  }

  /**
   * Format state for auto-return (similar to "standard" detail level in game_observe)
   */
  private formatStateForAutoReturn(state: GameState): any {
    const activePlayer = state.players[state.currentPlayer];
    const gameOverFlag = this.isGameOver(state);

    // Group hand by card name
    const groupedHand: Record<string, number> = {};
    activePlayer.hand.forEach(cardName => {
      groupedHand[cardName] = (groupedHand[cardName] || 0) + 1;
    });

    return {
      phase: state.phase,
      turnNumber: state.turnNumber,
      activePlayer: state.currentPlayer,
      hand: groupedHand,
      currentCoins: activePlayer.coins || 0,
      currentActions: activePlayer.actions || 0,
      currentBuys: activePlayer.buys || 0,
      gameOver: gameOverFlag
    };
  }

  /**
   * Format valid moves for auto-return
   */
  private formatValidMovesForAutoReturn(state: GameState): string[] {
    const validMoves = this.gameEngine.getValidMoves(state);
    return validMoves.map(move => {
      if (move.type === 'play_action') {
        return `play_action ${move.card}`;
      } else if (move.type === 'play_treasure') {
        return `play_treasure ${move.card}`;
      } else if (move.type === 'buy') {
        return `buy ${move.card}`;
      } else if (move.type === 'end_phase') {
        return 'end';
      }
      return move.type;
    });
  }
}
