import * as readline from 'readline';
import { GameEngine, GameState, Move, getCard } from '@principality/core';
import { Display } from './display';
import { Parser, ParseResult } from './parser';
import { formatVPDisplay, formatVPDisplayExpanded } from './vp-calculator';
import { TransactionManager } from './transaction';

/**
 * CLI options configuration
 */
export interface CLIOptions {
  quickGame?: boolean;
  stableNumbers?: boolean;
  autoPlayTreasures?: boolean;
  manualCleanup?: boolean;
}

/**
 * Main CLI interface for Principality AI
 */
export class PrincipalityCLI {
  private engine: GameEngine;
  private gameState: GameState;
  private display: Display;
  private parser: Parser;
  private rl: readline.Interface;
  private isRunning: boolean;
  private options: CLIOptions;

  constructor(seed?: string, players: number = 1, options: CLIOptions = {}) {
    const gameSeed = seed || this.generateRandomSeed();
    this.options = options;

    // Initialize engine with options
    this.engine = new GameEngine(gameSeed, { quickGame: options.quickGame });
    this.gameState = this.engine.initializeGame(players);

    // Initialize display and parser with stable numbers option
    this.display = new Display({ stableNumbers: options.stableNumbers });
    this.parser = new Parser();
    this.isRunning = false;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });
  }

  /**
   * Start the game
   */
  async start(): Promise<void> {
    this.isRunning = true;
    this.display.displayWelcome(this.gameState.seed, this.options.quickGame);

    // Start the game loop
    await this.gameLoop();
  }

  /**
   * Main game loop
   */
  private async gameLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if game is over
        const victory = this.engine.checkGameOver(this.gameState);
        if (victory.isGameOver) {
          this.display.displayGameOver(victory, this.gameState);
          this.quit();
          return;
        }

        // Display current game state
        this.display.displayGameState(this.gameState);

        // Auto-skip cleanup if enabled and in cleanup phase
        if (this.gameState.phase === 'cleanup' && !this.options.manualCleanup) {
          // Check if cleanup requires user input
          const requiresInput = this.cleanupRequiresInput(this.gameState);

          if (!requiresInput) {
            // Auto-execute cleanup
            this.autoExecuteCleanup();
            continue; // Skip to next iteration (next turn)
          }
        }

        // Get valid moves
        const validMoves = this.engine.getValidMoves(this.gameState);
        this.display.displayAvailableMoves(validMoves);

        // Get user input
        const input = await this.promptUser();

        if (!input) {
          continue;
        }

        // Parse input with options
        const parseResult = this.parser.parseInput(input, validMoves, {
          stableNumbers: this.options.stableNumbers
        });

        // Handle parse result
        await this.handleParseResult(parseResult);
      } catch (error) {
        // Handle any unexpected errors gracefully - log but don't throw
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Unexpected error in game loop: ${errorMessage}`);
        // For critical errors, exit the loop gracefully
        this.isRunning = false;
        return;
      }
    }
  }

  /**
   * Handle parsed input
   */
  private async handleParseResult(result: ParseResult): Promise<void> {
    switch (result.type) {
      case 'move':
        if (result.move) {
          this.executeMove(result.move);
        }
        break;

      case 'command':
        if (result.command) {
          const normalizedCommand = this.parser.normalizeCommand(result.command);
          await this.handleCommand(normalizedCommand);
        }
        break;

      case 'chain':
        if (result.chain) {
          this.executeChain(result.chain);
        }
        break;

      case 'invalid':
        if (result.error) {
          this.display.displayError(result.error);
        }
        break;
    }
  }

  /**
   * Execute a move
   */
  private executeMove(move: Move): void {
    const result = this.engine.executeMove(this.gameState, move);

    if (result.success && result.newState) {
      // Get the last log entry to show what happened
      const lastLog = result.newState.gameLog[result.newState.gameLog.length - 1];
      this.display.displayMoveResult(true, lastLog);
      this.gameState = result.newState;
    } else {
      this.display.displayMoveResult(false, result.error);
    }
  }

  /**
   * Execute a chain of moves with full rollback on ANY failure
   */
  private executeChain(chain: number[]): void {
    const transactionManager = new TransactionManager();

    // Save state BEFORE execution
    transactionManager.saveState(this.gameState);

    // CRITICAL: Capture all moves at the START of the chain
    // This prevents move numbers from shifting as moves are executed
    const initialValidMoves = this.engine.getValidMoves(this.gameState);

    // Validate all move numbers are valid BEFORE executing any
    for (const moveNumber of chain) {
      if (moveNumber < 1 || moveNumber > initialValidMoves.length) {
        this.display.displayError(
          `Invalid move number: ${moveNumber}. Valid range is 1-${initialValidMoves.length}`
        );
        return;
      }
    }

    // Convert move numbers to actual Move objects
    const movesToExecute = chain.map(num => initialValidMoves[num - 1]);

    try {
      // Execute moves sequentially using the captured moves
      for (let i = 0; i < movesToExecute.length; i++) {
        const move = movesToExecute[i];
        const result = this.engine.executeMove(this.gameState, move);

        if (!result.success) {
          throw new Error(result.error || 'Move failed');
        }

        // Display the move result
        if (result.newState) {
          const lastLog = result.newState.gameLog[result.newState.gameLog.length - 1];
          this.display.displayMoveResult(true, lastLog);
          this.gameState = result.newState;
        }
      }

      // Success - clear saved state
      transactionManager.clearSavedState();
      this.display.displayInfo(`Chain completed successfully (${chain.length} moves)`);

    } catch (error) {
      // ROLLBACK - restore saved state
      this.gameState = transactionManager.restoreState();

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.log(`✗ Error: Chain failed: ${errorMessage}`);
      console.log('   All moves rolled back. Game state unchanged.');
    }
  }

  /**
   * Handle special commands
   */
  private async handleCommand(command: string): Promise<void> {
    switch (command) {
      case 'help': {
        this.display.displayHelp();
        break;
      }

      case 'hand': {
        const player = this.gameState.players[this.gameState.currentPlayer];
        const vpDisplay = formatVPDisplay(player);
        this.display.displayInfo(`Hand: ${player.hand.join(', ')}\nVictory Points: ${vpDisplay}`);
        break;
      }

      case 'supply': {
        this.display.displaySupply(this.gameState);
        break;
      }

      case 'treasures': {
        this.autoPlayTreasures();
        break;
      }

      case 'status': {
        const player = this.gameState.players[this.gameState.currentPlayer];
        const vpDisplay = formatVPDisplay(player);
        this.display.displayInfo(`Actions: ${player.actions}  Buys: ${player.buys}  Coins: $${player.coins}\nVictory Points: ${vpDisplay}`);
        break;
      }

      case 'quit': {
        this.quit();
        break;
      }

      default: {
        console.log(`✗ Error: Unknown command: ${command}`);
      }
    }
  }

  /**
   * Check if cleanup phase requires user input
   * Returns false for MVP (no cards require cleanup choices yet)
   */
  private cleanupRequiresInput(state: GameState): boolean {
    // In MVP, cleanup never requires user input
    // Future cards (like Cellar) might require choices during cleanup

    // For now, always return false
    // TODO: Check for cards that have cleanup effects requiring choices
    return false;
  }

  /**
   * Auto-execute cleanup phase and display summary
   */
  private autoExecuteCleanup(): void {
    const player = this.gameState.players[this.gameState.currentPlayer];

    // Count cards in play (will be discarded)
    const cardsToDiscard = player.inPlay.length;

    // Execute cleanup (end_phase from cleanup)
    const move: Move = { type: 'end_phase' };
    const result = this.engine.executeMove(this.gameState, move);

    if (result.success && result.newState) {
      this.gameState = result.newState;

      // Display cleanup summary
      const newPlayer = this.gameState.players[this.gameState.currentPlayer];
      const cardsDrawn = newPlayer.hand.length;

      console.log(`✓ Cleanup: Discarded ${cardsToDiscard} cards, drew ${cardsDrawn} new cards\n`);
    }
  }

  /**
   * Auto-play all treasure cards in hand
   */
  private autoPlayTreasures(): void {
    if (this.gameState.phase !== 'buy') {
      this.display.displayError('Can only play treasures during buy phase');
      return;
    }

    const player = this.gameState.players[this.gameState.currentPlayer];
    const treasureCards = player.hand.filter(card => {
      const cardData = getCard(card);
      return cardData.type === 'treasure';
    });

    if (treasureCards.length === 0) {
      this.display.displayInfo('No treasures to play');
      return;
    }

    const treasureDetails: string[] = [];
    let totalCoins = 0;

    // Play each treasure
    for (const treasure of treasureCards) {
      const move: Move = { type: 'play_treasure', card: treasure };
      const result = this.engine.executeMove(this.gameState, move);

      if (result.success && result.newState) {
        const cardData = getCard(treasure);
        const coinValue = cardData.effect.coins || 0;
        treasureDetails.push(`${treasure} (+$${coinValue})`);
        totalCoins += coinValue;
        this.gameState = result.newState;
      }
    }

    // Display summary
    const summary = `Played all treasures: ${treasureDetails.join(', ')}. Total: $${totalCoins}`;
    console.log(`✓ ${summary}`);
  }

  /**
   * Prompt user for input
   */
  private promptUser(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question('> ', (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Generate a random seed
   */
  private generateRandomSeed(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Quit the game
   */
  private quit(): void {
    this.isRunning = false;
    this.display.displayInfo('Thanks for playing!');
    this.rl.close();
  }
}
