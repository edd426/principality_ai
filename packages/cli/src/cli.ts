import * as readline from 'readline';
import { GameEngine, GameState, Move, getCard, RulesBasedAI, MoveOption } from '@principality/core';
import { Display } from './display';
import { Parser, ParseResult } from './parser';
import { formatVPDisplay, formatVPDisplayExpanded } from './vp-calculator';
import { TransactionManager } from './transaction';
import { handleHelpCommand } from './commands/help';
import { handleCardsCommand } from './commands/cards';

/**
 * CLI options configuration
 */
export interface CLIOptions {
  victoryPileSize?: number;
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
  private ai: RulesBasedAI;
  private numPlayers: number;

  constructor(seed?: string, players: number = 1, options: CLIOptions = {}) {
    const gameSeed = seed || this.generateRandomSeed();
    this.options = options;
    this.numPlayers = players;

    // Initialize engine with options
    this.engine = new GameEngine(gameSeed, { victoryPileSize: options.victoryPileSize });
    this.gameState = this.engine.initializeGame(players);

    // Initialize AI with same seed for deterministic behavior
    this.ai = new RulesBasedAI(gameSeed);

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
    this.display.displayWelcome(this.gameState.seed, this.options.victoryPileSize, this.gameState);

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

        // Check if current player is AI (for multiplayer: player 0 is human, player 1+ are AI)
        const isAIPlayer = this.numPlayers > 1 && this.gameState.currentPlayer > 0;

        if (isAIPlayer) {
          // AI auto-executes its move
          this.executeAIMove();
        } else {
          // Human player - check for pending effect (interactive card prompts)
          if (this.gameState.pendingEffect) {
            // Card requires interactive choice - display prompt
            await this.handlePendingEffect(this.gameState);
            continue; // Loop back to check game state after handling effect
          }

          // Normal move selection
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
        }
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
          await this.handleCommand(normalizedCommand, result.parameter);
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
   * Handle pending effect (interactive card prompts)
   * Called when a card requires player decision (Cellar, Chapel, etc.)
   *
   * @req: FR-CLI-1 through FR-CLI-6 - Interactive prompts for action cards
   * @fix: Bug #37 - Use MoveOption[] as single source of truth for display and execution
   */
  private async handlePendingEffect(state: GameState): Promise<void> {
    const pendingEffect = state.pendingEffect;
    if (!pendingEffect) {
      return; // Safety check
    }

    // Get valid moves for this pending effect
    const validMoves = this.engine.getValidMoves(state);

    // Display the interactive prompt and get options (SINGLE SOURCE OF TRUTH)
    const options = this.display.displayPendingEffectPrompt(state, validMoves);

    // Runtime validation: Ensure display and execution are in sync
    if (options.length !== validMoves.length) {
      console.error('CRITICAL: Display/execution array mismatch!');
      console.error(`  Options: ${options.length}, ValidMoves: ${validMoves.length}`);
      throw new Error('SSOT violation detected - please report this bug');
    }

    // Get user selection
    while (true) {
      const input = await this.promptUser();

      if (!input || !input.trim()) {
        continue;
      }

      // Parse numeric selection
      const selection = parseInt(input.trim(), 10);

      // Validate selection against OPTIONS array (what user saw)
      if (isNaN(selection) || selection < 1 || selection > options.length) {
        console.log(`✗ Error: Invalid selection. Please enter 1-${options.length}`);
        continue;
      }

      // Execute the selected move from OPTIONS (not validMoves)
      // This ensures we execute exactly what the user selected from the display
      const selectedOption = options[selection - 1];
      const result = this.engine.executeMove(state, selectedOption.move);

      if (result.success && result.newState) {
        // Get the last log entry to show what happened
        const lastLog = result.newState.gameLog[result.newState.gameLog.length - 1];
        this.display.displayMoveResult(true, lastLog);
        this.gameState = result.newState;
        break; // Exit loop - move successful
      } else {
        this.display.displayMoveResult(false, result.error);
        // Stay in loop to get new input
      }
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
   * Execute an AI move (called in multiplayer when AI player's turn)
   */
  private executeAIMove(): void {
    const player = this.gameState.currentPlayer;
    const decision = this.ai.decideBestMove(this.gameState, player);

    // Display the AI's decision
    console.log(`\n💭 AI (Player ${player + 1}) decision: ${decision.reasoning}`);
    console.log(`   Moving: ${this.formatMove(decision.move)}\n`);

    // Execute the move
    this.executeMove(decision.move);
  }

  /**
   * Format a move for display
   */
  private formatMove(move: Move): string {
    switch (move.type) {
      case 'play_action':
        return `Play ${move.card}`;
      case 'play_treasure':
        return `Play ${move.card}`;
      case 'buy':
        return `Buy ${move.card}`;
      case 'end_phase':
        return 'End phase';
      case 'discard_for_cellar':
        return `Discard ${move.cards?.length ?? 0} cards`;
      default:
        return 'Unknown move';
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
  private async handleCommand(command: string, parameter?: string): Promise<void> {
    switch (command) {
      case 'help': {
        if (parameter) {
          // User requested help for specific card
          const helpText = handleHelpCommand(parameter);
          console.log(helpText);
        } else {
          // General help
          this.display.displayHelp();
        }
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

      case 'cards': {
        const output = handleCardsCommand();
        console.log(output);
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
      this.display.displayError('Cannot play treasures outside buy phase');
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
