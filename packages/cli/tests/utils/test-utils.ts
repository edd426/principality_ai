/**
 * Comprehensive testing utilities for CLI components
 * Provides mocking, state builders, and assertion helpers
 */

import * as readline from 'readline';
import { GameEngine, GameState, PlayerState, Move } from '@principality/core';

/**
 * Console output capture utility
 */
export class ConsoleCapture {
  private logs: string[] = [];
  private errors: string[] = [];
  private originalLog: typeof console.log;
  private originalError: typeof console.error;
  private originalClear: typeof console.clear;

  constructor() {
    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalClear = console.clear;
  }

  /**
   * Start capturing console output
   */
  start(): void {
    this.logs = [];
    this.errors = [];

    console.log = jest.fn((...args: any[]) => {
      this.logs.push(args.map(arg => String(arg)).join(' '));
    });

    console.error = jest.fn((...args: any[]) => {
      this.errors.push(args.map(arg => String(arg)).join(' '));
    });

    console.clear = jest.fn();
  }

  /**
   * Stop capturing and restore original console methods
   */
  stop(): void {
    console.log = this.originalLog;
    console.error = this.originalError;
    console.clear = this.originalClear;
  }

  /**
   * Get all captured logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Get all captured errors
   */
  getErrors(): string[] {
    return [...this.errors];
  }

  /**
   * Get all output as a single string
   */
  getAllOutput(): string {
    return this.logs.join('\n');
  }

  /**
   * Check if output contains specific text
   */
  contains(text: string): boolean {
    return this.getAllOutput().includes(text);
  }

  /**
   * Count occurrences of text in output
   */
  count(text: string): number {
    return (this.getAllOutput().match(new RegExp(text, 'g')) || []).length;
  }

  /**
   * Clear captured output
   */
  clear(): void {
    this.logs = [];
    this.errors = [];
  }

  /**
   * Get the last log entry
   */
  getLastLog(): string | undefined {
    return this.logs[this.logs.length - 1];
  }

  /**
   * Check if console.clear was called
   */
  wasClearCalled(): boolean {
    return (console.clear as jest.Mock).mock.calls.length > 0;
  }
}

/**
 * Readline interface mock for testing CLI input/output
 */
export class MockReadline {
  private inputs: string[] = [];
  private currentIndex = 0;
  private questionCallback: ((answer: string) => void) | null = null;
  private promptText = '';

  /**
   * Set predefined inputs for testing
   */
  setInputs(inputs: string[]): void {
    this.inputs = inputs;
    this.currentIndex = 0;
  }

  /**
   * Add a single input
   */
  addInput(input: string): void {
    this.inputs.push(input);
  }

  /**
   * Mock readline.createInterface
   */
  createInterface(): any {
    return {
      question: (prompt: string, callback: (answer: string) => void) => {
        this.promptText = prompt;
        this.questionCallback = callback;

        // Simulate async behavior
        setTimeout(() => {
          if (this.currentIndex < this.inputs.length) {
            const input = this.inputs[this.currentIndex++];
            callback(input);
          }
        }, 0);
      },
      close: jest.fn(),
      setPrompt: jest.fn(),
      prompt: jest.fn()
    };
  }

  /**
   * Manually trigger the next input (for synchronous testing)
   */
  triggerInput(): void {
    if (this.questionCallback && this.currentIndex < this.inputs.length) {
      const input = this.inputs[this.currentIndex++];
      this.questionCallback(input);
    }
  }

  /**
   * Get the current prompt text
   */
  getPrompt(): string {
    return this.promptText;
  }

  /**
   * Check if all inputs have been consumed
   */
  isComplete(): boolean {
    return this.currentIndex >= this.inputs.length;
  }

  /**
   * Reset the mock
   */
  reset(): void {
    this.inputs = [];
    this.currentIndex = 0;
    this.questionCallback = null;
    this.promptText = '';
  }
}

/**
 * Game state builder for testing
 */
export class GameStateBuilder {
  private engine = new GameEngine('test-seed');
  private state: GameState;

  constructor() {
    this.state = this.engine.initializeGame(1);
  }

  /**
   * Create a new builder with default state
   */
  static create(): GameStateBuilder {
    return new GameStateBuilder();
  }

  /**
   * Set the current player
   */
  withCurrentPlayer(playerIndex: number): GameStateBuilder {
    this.state = {
      ...this.state,
      currentPlayer: playerIndex
    };
    return this;
  }

  /**
   * Set the game phase
   */
  withPhase(phase: 'action' | 'buy' | 'cleanup'): GameStateBuilder {
    this.state = {
      ...this.state,
      phase
    };
    return this;
  }

  /**
   * Set the turn number
   */
  withTurnNumber(turnNumber: number): GameStateBuilder {
    this.state = {
      ...this.state,
      turnNumber
    };
    return this;
  }

  /**
   * Set player hand
   */
  withPlayerHand(playerIndex: number, hand: string[]): GameStateBuilder {
    const players = [...this.state.players];
    players[playerIndex] = {
      ...players[playerIndex],
      hand: [...hand]
    };
    this.state = {
      ...this.state,
      players
    };
    return this;
  }

  /**
   * Set player stats (actions, buys, coins)
   */
  withPlayerStats(playerIndex: number, stats: Partial<Pick<PlayerState, 'actions' | 'buys' | 'coins'>>): GameStateBuilder {
    const players = [...this.state.players];
    players[playerIndex] = {
      ...players[playerIndex],
      ...stats
    };
    this.state = {
      ...this.state,
      players
    };
    return this;
  }

  /**
   * Set supply pile counts
   */
  withSupply(supply: Record<string, number>): GameStateBuilder {
    const newSupply = new Map(this.state.supply);
    Object.entries(supply).forEach(([card, count]) => {
      newSupply.set(card, count);
    });
    this.state = {
      ...this.state,
      supply: newSupply
    };
    return this;
  }

  /**
   * Add multiple players
   */
  withPlayers(count: number): GameStateBuilder {
    this.state = this.engine.initializeGame(count);
    return this;
  }

  /**
   * Clear all deck zones for a player (useful for VP test isolation)
   * This removes the starting deck (7 Copper + 3 Estate) from all zones
   */
  withEmptyDeck(playerIndex: number): GameStateBuilder {
    const players = [...this.state.players];
    players[playerIndex] = {
      ...players[playerIndex],
      drawPile: [],
      discardPile: [],
      inPlay: [],
      hand: []
    };
    this.state = { ...this.state, players };
    return this;
  }

  /**
   * Build the final game state
   */
  build(): GameState {
    return this.state;
  }
}

/**
 * Mock move generator for testing
 */
export class MockMoveGenerator {
  /**
   * Generate typical action phase moves
   */
  static actionMoves(): Move[] {
    return [
      { type: 'play_action', card: 'Village' },
      { type: 'play_action', card: 'Smithy' },
      { type: 'end_phase' }
    ];
  }

  /**
   * Generate typical buy phase moves
   */
  static buyMoves(): Move[] {
    return [
      { type: 'buy', card: 'Silver' },
      { type: 'buy', card: 'Gold' },
      { type: 'buy', card: 'Province' },
      { type: 'end_phase' }
    ];
  }

  /**
   * Generate treasure playing moves
   */
  static treasureMoves(): Move[] {
    return [
      { type: 'play_treasure', card: 'Copper' },
      { type: 'play_treasure', card: 'Silver' },
      { type: 'play_treasure', card: 'Gold' }
    ];
  }

  /**
   * Generate a mix of all move types
   */
  static mixedMoves(): Move[] {
    return [
      ...this.actionMoves(),
      ...this.treasureMoves(),
      ...this.buyMoves()
    ];
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceHelper {
  /**
   * Measure execution time of a function
   */
  static async measureTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; timeMs: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, timeMs: end - start };
  }

  /**
   * Assert that a function executes within a time limit
   */
  static async assertWithinTime<T>(
    fn: () => T | Promise<T>,
    maxTimeMs: number,
    description?: string
  ): Promise<T> {
    const { result, timeMs } = await this.measureTime(fn);
    const desc = description || 'operation';
    expect(timeMs).toBeLessThan(maxTimeMs);
    return result;
  }

  /**
   * Run a function multiple times and get average execution time
   */
  static async measureAverageTime<T>(
    fn: () => T | Promise<T>,
    iterations: number = 10
  ): Promise<{ averageMs: number; minMs: number; maxMs: number }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { timeMs } = await this.measureTime(fn);
      times.push(timeMs);
    }

    return {
      averageMs: times.reduce((sum, time) => sum + time, 0) / times.length,
      minMs: Math.min(...times),
      maxMs: Math.max(...times)
    };
  }
}

/**
 * Assertion helpers for CLI testing
 */
export class CLIAssertions {
  /**
   * Assert that output contains expected text patterns
   */
  static assertOutputContains(capture: ConsoleCapture, ...patterns: string[]): void {
    const output = capture.getAllOutput();
    patterns.forEach(pattern => {
      expect(output).toMatch(new RegExp(pattern, 'i'));
    });
  }

  /**
   * Assert that output does not contain forbidden patterns
   */
  static assertOutputDoesNotContain(capture: ConsoleCapture, ...patterns: string[]): void {
    const output = capture.getAllOutput();
    patterns.forEach(pattern => {
      expect(output).not.toMatch(new RegExp(pattern, 'i'));
    });
  }

  /**
   * Assert that output contains game state information
   */
  static assertGameStateDisplayed(capture: ConsoleCapture, state: GameState): void {
    const output = capture.getAllOutput();

    // Should show turn information
    expect(output).toMatch(new RegExp(`Turn ${state.turnNumber}`, 'i'));
    expect(output).toMatch(new RegExp(`Player ${state.currentPlayer + 1}`, 'i'));
    expect(output).toMatch(new RegExp(`${state.phase} Phase`, 'i'));

    // Should show player stats
    const player = state.players[state.currentPlayer];
    expect(output).toMatch(new RegExp(`Actions: ${player.actions}`, 'i'));
    expect(output).toMatch(new RegExp(`Buys: ${player.buys}`, 'i'));
    expect(output).toMatch(new RegExp(`Coins: \\$${player.coins}`, 'i'));
  }

  /**
   * Assert that moves are displayed correctly
   */
  static assertMovesDisplayed(capture: ConsoleCapture, moves: Move[]): void {
    const output = capture.getAllOutput();

    // Should show "Available Moves"
    expect(output).toMatch(/Available Moves/i);

    // Should show numbered moves
    moves.forEach((move, index) => {
      expect(output).toMatch(new RegExp(`\\[${index + 1}\\]`, 'i'));
    });
  }

  /**
   * Assert that error message is displayed correctly
   */
  static assertErrorDisplayed(capture: ConsoleCapture, errorText: string): void {
    const output = capture.getAllOutput();
    expect(output).toMatch(new RegExp(`✗.*Error.*${errorText}`, 'i'));
  }

  /**
   * Assert that success message is displayed correctly
   */
  static assertSuccessDisplayed(capture: ConsoleCapture, successText: string): void {
    const output = capture.getAllOutput();
    expect(output).toMatch(new RegExp(`✓.*${successText}`, 'i'));
  }
}

/**
 * Test scenario builders for complex testing
 */
export class TestScenarios {
  /**
   * Create a typical game start scenario
   */
  static gameStart(): { state: GameState; moves: Move[] } {
    const engine = new GameEngine('test-scenario');
    const state = engine.initializeGame(1);
    const moves = engine.getValidMoves(state);
    return { state, moves };
  }

  /**
   * Create a buy phase scenario
   */
  static buyPhase(): { state: GameState; moves: Move[] } {
    const state = GameStateBuilder.create()
      .withPhase('buy')
      .withPlayerStats(0, { actions: 0, buys: 1, coins: 5 })
      .build();

    const moves = MockMoveGenerator.buyMoves();
    return { state, moves };
  }

  /**
   * Create a game over scenario
   */
  static gameOver(): { state: GameState; victory: any } {
    const state = GameStateBuilder.create()
      .withSupply({ 'Province': 0 }) // Empty province pile
      .withTurnNumber(20)
      .build();

    const victory = {
      isGameOver: true,
      winner: 0,
      scores: [15, 8] // Player 1 wins with 15 VP
    };

    return { state, victory };
  }

  /**
   * Create error scenario (invalid move)
   */
  static invalidMove(): { state: GameState; moves: Move[]; invalidInput: string } {
    const { state, moves } = this.gameStart();
    return {
      state,
      moves,
      invalidInput: '999' // Out of range move number
    };
  }
}