/**
 * Game Service
 *
 * Business logic orchestration for game operations.
 * Coordinates between registry, AI service, and state filtering.
 *
 * @req API-001 - HTTP REST endpoints for game management
 */

import {
  Move,
  CardName,
  parseMove,
  isMoveValid,
  isGameOver,
  formatMoveCommand,
  isTreasureCard,
} from '@principality/core';
import { GameRegistry, APIGameInstance } from './game-registry';
import { AIService } from './ai-service';
import {
  filterStateForHuman,
  formatValidMoves,
  calculatePlayerScores,
} from './state-filter';
import type {
  CreateGameRequest,
  CreateGameResponse,
  GetGameResponse,
  ExecuteMoveRequest,
  ExecuteMoveResponse,
  EndGameResponse,
  ValidMove,
} from '../types/api';
import { GameNotFoundError, InvalidMoveError, NotYourTurnError } from '../middleware/error-handler';

/**
 * Game Service - orchestrates game operations
 */
export class GameService {
  constructor(
    private registry: GameRegistry,
    private aiService: AIService
  ) {}

  /**
   * Create a new game (human vs AI)
   */
  createGame(request: CreateGameRequest, baseUrl: string): CreateGameResponse {
    const { aiModel, seed, kingdomCards, enableNarration, manualAI } = request;

    const game = this.registry.createGame({
      aiModel,
      seed,
      kingdomCards: kingdomCards as CardName[] | undefined,
      enableNarration,
      manualAI,
    });

    const clientState = filterStateForHuman(game.state, game.humanPlayerIndex);

    return {
      gameId: game.id,
      gameState: clientState,
      wsUrl: `${baseUrl.replace('http', 'ws')}/ws/${game.id}`,
    };
  }

  /**
   * Get current game state with valid moves
   */
  getGameState(gameId: string): GetGameResponse {
    const game = this.registry.getGame(gameId);
    if (!game) {
      throw new GameNotFoundError(gameId);
    }

    const clientState = filterStateForHuman(game.state, game.humanPlayerIndex);
    const validMoves = this.getValidMovesForHuman(game);
    const gameOver = isGameOver(game.state);

    const response: GetGameResponse = {
      gameId: game.id,
      gameState: clientState,
      validMoves,
      isGameOver: gameOver,
    };

    if (gameOver) {
      const scores = calculatePlayerScores(game.state);
      response.scores = scores;
      response.winner = scores.reduce((best, curr) =>
        curr.score > (best?.score ?? -Infinity) ? curr : best
      ).playerIndex;
    }

    return response;
  }

  /**
   * Execute a move for the human player
   *
   * Flow:
   * 1. Validate it's human's turn
   * 2. Parse and validate the move
   * 3. Execute the move
   * 4. Auto-skip cleanup phase
   * 5. If AI's turn, auto-play AI turn
   * 6. Return updated state
   */
  executeMove(gameId: string, request: ExecuteMoveRequest): ExecuteMoveResponse {
    const game = this.registry.getGame(gameId);
    if (!game) {
      throw new GameNotFoundError(gameId);
    }

    // Check if game is over
    if (isGameOver(game.state)) {
      return {
        success: false,
        error: 'Game is already over',
        isGameOver: true,
      };
    }

    // Check if it's human's turn (skip check for manualAI - Claude controls both players)
    if (!game.manualAI && game.state.currentPlayer !== game.humanPlayerIndex) {
      throw new NotYourTurnError();
    }

    // Parse the move
    const { move } = request;
    let parsedMove: Move;

    if (typeof move === 'string') {
      const parseResult = parseMove(move, game.state);
      if (!parseResult.success || !parseResult.move) {
        return {
          success: false,
          error: parseResult.error || `Cannot parse move: "${move}"`,
        };
      }
      parsedMove = parseResult.move;
    } else {
      parsedMove = move;
    }

    // Handle batch treasure playing specially (bypasses standard validation)
    if (parsedMove.type === 'play_all_treasures') {
      return this.executeBatchTreasures(game);
    }

    // Validate move
    const validMoves = game.engine.getValidMoves(game.state);
    if (!isMoveValid(parsedMove, validMoves)) {
      const validMoveStrings = validMoves.map((m) => formatMoveCommand(m));
      throw new InvalidMoveError(
        typeof move === 'string' ? move : formatMoveCommand(move),
        validMoveStrings
      );
    }

    // Execute move
    const result = game.engine.executeMove(game.state, parsedMove);
    if (!result.success || !result.newState) {
      return {
        success: false,
        error: result.error || 'Move execution failed',
      };
    }

    let currentState = result.newState;

    // Auto-skip cleanup phase (no player choices in MVP)
    if (currentState.phase === 'cleanup') {
      const cleanupResult = game.engine.executeMove(currentState, { type: 'end_phase' });
      if (cleanupResult.success && cleanupResult.newState) {
        currentState = cleanupResult.newState;
      }
    }

    // Auto-play AI turn if it's AI's turn and game isn't over
    // Skip auto-play if manualAI is true (allows Claude MCP to control AI)
    if (!game.manualAI) {
      // Note: aiTurnSummary could be used for logging/debugging in future
      while (
        currentState.currentPlayer !== game.humanPlayerIndex &&
        !isGameOver(currentState)
      ) {
        // First, resolve any pending effects targeting AI
        let effectResolved = true;
        while (effectResolved && currentState.pendingEffect) {
          const resolveResult = this.aiService.resolveAIPendingEffect(
            currentState,
            game.engine
          );
          effectResolved = resolveResult.resolved;
          if (resolveResult.resolved) {
            currentState = resolveResult.state;
          }
        }

        // If still AI's turn and no pending effects, play AI turn
        if (
          currentState.currentPlayer !== game.humanPlayerIndex &&
          !currentState.pendingEffect &&
          !isGameOver(currentState)
        ) {
          const { state: stateAfterAI } = this.aiService.playBigMoneyTurn(
            currentState,
            game.engine
          );
          currentState = stateAfterAI;
        }
      }
    }

    // Update registry with final state
    this.registry.setState(game.id, currentState);

    // Build response
    const clientState = filterStateForHuman(currentState, game.humanPlayerIndex);
    const newValidMoves = this.getValidMovesForHuman({
      ...game,
      state: currentState,
    });
    const gameOver = isGameOver(currentState);

    const response: ExecuteMoveResponse = {
      success: true,
      gameState: clientState,
      validMoves: newValidMoves,
      isGameOver: gameOver,
    };

    if (gameOver) {
      const scores = calculatePlayerScores(currentState);
      response.scores = scores;
      response.winner = scores.reduce((best, curr) =>
        curr.score > (best?.score ?? -Infinity) ? curr : best
      ).playerIndex;
    }

    return response;
  }

  /**
   * Execute batch treasure playing - plays all treasures in hand at once
   */
  private executeBatchTreasures(game: APIGameInstance): ExecuteMoveResponse {
    const state = game.state;
    const player = state.players[state.currentPlayer];

    // Validate phase
    if (state.phase !== 'buy') {
      return {
        success: false,
        error: 'Cannot play treasures in Action phase. Use "end" to move to Buy phase first.',
      };
    }

    // Get all treasure cards from hand
    const treasures = player.hand.filter((card) => isTreasureCard(card));

    if (treasures.length === 0) {
      return {
        success: false,
        error: 'No treasures in hand to play.',
      };
    }

    // Execute each treasure sequentially
    let currentState = state;
    const treasuresPlayed: string[] = [];

    for (const treasure of treasures) {
      const result = game.engine.executeMove(currentState, {
        type: 'play_treasure',
        card: treasure,
      });

      if (result.success && result.newState) {
        currentState = result.newState;
        treasuresPlayed.push(treasure);
      }
    }

    // Update registry with final state
    this.registry.setState(game.id, currentState);

    // Build response
    const clientState = filterStateForHuman(currentState, game.humanPlayerIndex);
    const newValidMoves = this.getValidMovesForHuman({
      ...game,
      state: currentState,
    });

    return {
      success: true,
      gameState: clientState,
      validMoves: newValidMoves,
      isGameOver: false,
    };
  }

  /**
   * End a game early
   */
  endGame(gameId: string): EndGameResponse {
    const game = this.registry.endGame(gameId);
    if (!game) {
      throw new GameNotFoundError(gameId);
    }

    return {
      success: true,
      message: `Game ${gameId} ended after ${game.moves} moves`,
    };
  }

  /**
   * Get valid moves formatted for the human player
   */
  private getValidMovesForHuman(game: APIGameInstance): ValidMove[] {
    // Only return moves if it's human's turn
    if (game.state.currentPlayer !== game.humanPlayerIndex) {
      return [];
    }

    const validMoves = game.engine.getValidMoves(game.state);
    return formatValidMoves(validMoves, game.state);
  }
}
