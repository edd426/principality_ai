import * as readline from 'readline';
import { GameEngine, GameState, Move } from '@principality/core';
import { Display } from './display';
import { Parser, ParseResult } from './parser';

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

  constructor(seed?: string, players: number = 1) {
    const gameSeed = seed || this.generateRandomSeed();
    this.engine = new GameEngine(gameSeed);
    this.gameState = this.engine.initializeGame(players);
    this.display = new Display();
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
    this.display.displayWelcome(this.gameState.seed);

    // Start the game loop
    await this.gameLoop();
  }

  /**
   * Main game loop
   */
  private async gameLoop(): Promise<void> {
    while (this.isRunning) {
      // Check if game is over
      const victory = this.engine.checkGameOver(this.gameState);
      if (victory.isGameOver) {
        this.display.displayGameOver(victory, this.gameState);
        this.quit();
        return;
      }

      // Display current game state
      this.display.displayGameState(this.gameState);

      // Get valid moves
      const validMoves = this.engine.getValidMoves(this.gameState);
      this.display.displayAvailableMoves(validMoves);

      // Get user input
      const input = await this.promptUser();

      if (!input) {
        continue;
      }

      // Parse input
      const parseResult = this.parser.parseInput(input, validMoves);

      // Handle parse result
      await this.handleParseResult(parseResult);
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
        this.display.displayInfo(`Hand: ${player.hand.join(', ')}`);
        break;
      }

      case 'supply': {
        this.display.displaySupply(this.gameState);
        break;
      }

      case 'quit': {
        this.quit();
        break;
      }

      default: {
        this.display.displayError(`Unknown command: ${command}`);
      }
    }
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
