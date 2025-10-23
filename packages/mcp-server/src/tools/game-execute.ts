/**
 * game_execute Tool Implementation
 *
 * Atomically validates and executes a single move with actionable error messages
 */

import { GameEngine, GameState, Move, isActionCard, isTreasureCard } from '@principality/core';
import { GameExecuteRequest, GameExecuteResponse } from '../types/tools';

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
    private setState: (state: GameState) => void
  ) {}

  async execute(request: GameExecuteRequest): Promise<GameExecuteResponse> {
    const { move, return_detail = 'minimal' } = request;

    const state = this.getState();
    if (!state) {
      return {
        success: false,
        error: {
          message: 'No active game. Use game_session(command="new") to start.',
          suggestion: 'Call game_session(command="new") to begin a new game.'
        }
      };
    }

    // Parse move string
    const parsedMove = this.parseMove(move, state);
    if (!parsedMove) {
      return {
        success: false,
        error: {
          message: `Cannot parse move: "${move}". Invalid format.`,
          suggestion: 'Examples: "play 0" (action), "play_treasure Copper" (buy phase), "buy Village", "end"'
        }
      };
    }

    // Validate move before executing
    const validMoves = this.gameEngine.getValidMoves(state);
    const isValid = this.isMoveValid(parsedMove, validMoves);

    if (!isValid) {
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
        return {
          success: false,
          error: {
            message: result.error || 'Move execution failed.',
            suggestion: 'Try using game_observe() to see valid moves.'
          }
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

      // Return response
      const response: GameExecuteResponse = {
        success: true,
        message: `Executed: ${move}`
      };

      // Check if phase changed
      if (result.newState && result.newState.phase !== state.phase) {
        response.phaseChanged = `${state.phase} → ${result.newState.phase}`;
      }

      // Include full state if requested
      if (return_detail === 'full' && result.newState) {
        response.state = result.newState;
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
}
