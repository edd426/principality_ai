/**
 * Performance tests for CLI operations
 * Validates that CLI components meet performance requirements
 */

import { PrincipalityCLI } from '../src/cli';
import { Display } from '../src/display';
import { Parser } from '../src/parser';
import { GameEngine } from '@principality/core';
import {
  ConsoleCapture,
  MockReadline,
  GameStateBuilder,
  MockMoveGenerator,
  PerformanceHelper
} from './utils/test-utils';
import { Phase15PerformanceUtils } from './utils/phase1-5-utils';

// Mock readline for performance tests
jest.mock('readline', () => ({
  createInterface: jest.fn()
}));

describe('CLI Performance Tests', () => {
  let consoleCapture: ConsoleCapture;
  let mockReadline: MockReadline;
  let originalCreateInterface: any;

  beforeEach(() => {
    consoleCapture = new ConsoleCapture();
    mockReadline = new MockReadline();

    originalCreateInterface = require('readline').createInterface;
    require('readline').createInterface = jest.fn().mockImplementation(() =>
      mockReadline.createInterface()
    );

    consoleCapture.start();
  });

  afterEach(() => {
    consoleCapture.stop();
    mockReadline.reset();
    require('readline').createInterface = originalCreateInterface;
  });

  describe('Parser performance', () => {
    test('should parse input quickly', async () => {
      const parser = new Parser();
      const moves = MockMoveGenerator.mixedMoves();

      await PerformanceHelper.assertWithinTime(
        () => parser.parseInput('1', moves),
        5, // < 5ms
        'single input parsing'
      );
    });

    test('should handle large move lists efficiently', async () => {
      const parser = new Parser();
      const largeMoveList = Array(1000).fill(0).map((_, i) => ({
        type: 'play_action' as const,
        card: `Card${i}`
      }));

      await PerformanceHelper.assertWithinTime(
        () => parser.parseInput('500', largeMoveList),
        10, // < 10ms even with large move list
        'large move list parsing'
      );
    });

    test('should process many commands quickly', async () => {
      const parser = new Parser();
      const moves = MockMoveGenerator.actionMoves();
      const commands = ['help', 'quit', 'hand', 'supply', 'h', 'q'];

      await PerformanceHelper.assertWithinTime(
        () => {
          commands.forEach(cmd => parser.parseInput(cmd, moves));
        },
        10, // < 10ms for multiple commands
        'multiple command parsing'
      );
    });

    test('should maintain consistent performance', async () => {
      const parser = new Parser();
      const moves = MockMoveGenerator.mixedMoves();

      const { averageMs, maxMs } = await PerformanceHelper.measureAverageTime(
        () => parser.parseInput('2', moves),
        100 // 100 iterations
      );

      expect(averageMs).toBeLessThan(2); // < 2ms average
      expect(maxMs).toBeLessThan(10); // < 10ms worst case
    });

    test('should handle command normalization quickly', async () => {
      const parser = new Parser();
      const commands = ['h', 'help', 'HELP', 'q', 'quit', 'EXIT', 'exit'];

      await PerformanceHelper.assertWithinTime(
        () => {
          commands.forEach(cmd => parser.normalizeCommand(cmd));
        },
        5, // < 5ms for normalization
        'command normalization'
      );
    });
  });

  describe('Display performance', () => {
    test('should display game state quickly', async () => {
      const display = new Display();
      const state = GameStateBuilder.create().build();

      await PerformanceHelper.assertWithinTime(
        () => display.displayGameState(state),
        50, // < 50ms per requirement
        'game state display'
      );
    });

    test('should display large move lists efficiently', async () => {
      const display = new Display();
      const largeMoveList = Array(100).fill(0).map((_, i) => ({
        type: 'play_action' as const,
        card: `Card${i}`
      }));

      await PerformanceHelper.assertWithinTime(
        () => display.displayAvailableMoves(largeMoveList),
        75, // < 75ms for large move list
        'large move list display'
      );
    });

    test('should display supply quickly', async () => {
      const display = new Display();
      const state = GameStateBuilder.create()
        .withSupply(Object.fromEntries(
          Array(50).fill(0).map((_, i) => [`Card${i}`, 10])
        ))
        .build();

      await PerformanceHelper.assertWithinTime(
        () => display.displaySupply(state),
        60, // < 60ms for large supply
        'supply display'
      );
    });

    test('should handle repeated displays efficiently', async () => {
      const display = new Display();
      const state = GameStateBuilder.create().build();
      const moves = MockMoveGenerator.mixedMoves();

      await PerformanceHelper.assertWithinTime(
        () => {
          for (let i = 0; i < 10; i++) {
            display.displayGameState(state);
            display.displayAvailableMoves(moves);
            consoleCapture.clear();
          }
        },
        200, // < 200ms for 10 iterations
        'repeated display operations'
      );
    });

    test('should format complex game states quickly', async () => {
      const display = new Display();
      const complexState = GameStateBuilder.create()
        .withPlayers(4)
        .withPlayerHand(0, Array(20).fill('VeryLongCardNameWithLotsOfCharacters'))
        .withPlayerStats(0, { actions: 15, buys: 8, coins: 42 })
        .withTurnNumber(99)
        .build();

      await PerformanceHelper.assertWithinTime(
        () => display.displayGameState(complexState),
        100, // < 100ms even for complex state
        'complex game state display'
      );
    });

    test('should display welcome screen quickly', async () => {
      const display = new Display();
      const longSeed = 'x'.repeat(100);

      await PerformanceHelper.assertWithinTime(
        () => display.displayWelcome(longSeed),
        25, // < 25ms for welcome
        'welcome screen display'
      );
    });

    test('should display game over screen quickly', async () => {
      const display = new Display();
      const victory = {
        isGameOver: true,
        winner: 0,
        scores: Array(10).fill(0).map((_, i) => i * 5) // 10 players
      };
      const state = GameStateBuilder.create()
        .withPlayers(10)
        .withTurnNumber(50)
        .build();

      await PerformanceHelper.assertWithinTime(
        () => display.displayGameOver(victory, state),
        75, // < 75ms for game over
        'game over display'
      );
    });
  });

  describe('CLI startup performance', () => {
    test('should initialize quickly', async () => {
      await PerformanceHelper.assertWithinTime(
        () => new PrincipalityCLI('performance-seed'),
        500, // < 500ms startup
        'CLI initialization'
      );
    });

    test('should initialize with multiple players quickly', async () => {
      await PerformanceHelper.assertWithinTime(
        () => new PrincipalityCLI('performance-seed', 4),
        750, // < 750ms for multiplayer
        'multiplayer CLI initialization'
      );
    });

    test('should start game loop quickly', async () => {
      const cli = new PrincipalityCLI('performance-seed');
      mockReadline.setInputs(['quit']);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        1000, // < 1 second total startup
        'CLI game loop startup'
      );
    });
  });

  describe('Interactive performance', () => {
    test('should handle rapid input sequences', async () => {
      const cli = new PrincipalityCLI('rapid-input-seed');

      const rapidInputs = [
        'help', 'hand', 'supply', '3', '3',
        'help', 'hand', 'supply', '3', '3',
        'quit'
      ];
      mockReadline.setInputs(rapidInputs);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        2000, // < 2 seconds for rapid sequence
        'rapid input handling'
      );
    });

    test('should handle many invalid inputs efficiently', async () => {
      const cli = new PrincipalityCLI('invalid-input-seed');

      const invalidInputs = Array(20).fill('invalid-command').concat(['quit']);
      mockReadline.setInputs(invalidInputs);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        1500, // < 1.5 seconds even with many errors
        'many invalid inputs'
      );
    });

    test('should handle alternating valid/invalid inputs', async () => {
      const cli = new PrincipalityCLI('alternating-seed');

      const alternatingInputs = [
        'help', 'invalid1', 'hand', 'invalid2',
        'supply', 'invalid3', '3', 'invalid4',
        'quit'
      ];
      mockReadline.setInputs(alternatingInputs);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        2000, // < 2 seconds for mixed inputs
        'alternating valid/invalid inputs'
      );
    });
  });

  describe('Memory performance', () => {
    test('should not leak memory during normal operation', async () => {
      const cli = new PrincipalityCLI('memory-test-seed');

      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate normal gameplay operations
      for (let i = 0; i < 50; i++) {
        const state = cli['gameState'];
        const moves = cli['engine'].getValidMoves(state);

        cli['display'].displayGameState(state);
        cli['display'].displayAvailableMoves(moves);
        cli['parser'].parseInput('help', moves);
        cli['parser'].parseInput('1', moves);

        consoleCapture.clear();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (< 5MB for 50 operations)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    test('should handle garbage collection efficiently', async () => {
      const cli = new PrincipalityCLI('gc-test-seed');

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // Create many temporary objects
      for (let i = 0; i < 100; i++) {
        const tempState = GameStateBuilder.create()
          .withPlayerHand(0, Array(10).fill(`TempCard${i}`))
          .build();

        cli['display'].displayGameState(tempState);
        consoleCapture.clear();
      }

      // Force garbage collection again
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory should not grow excessively (< 10MB after GC)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Stress testing', () => {
    test('should handle very large game states', async () => {
      const display = new Display();

      const stressState = GameStateBuilder.create()
        .withPlayers(10)
        .withPlayerHand(0, Array(50).fill('Card'))
        .withSupply(Object.fromEntries(
          Array(200).fill(0).map((_, i) => [`StressCard${i}`, 10])
        ))
        .build();

      await PerformanceHelper.assertWithinTime(
        () => display.displayGameState(stressState),
        200, // < 200ms even for stress state
        'very large game state'
      );

      await PerformanceHelper.assertWithinTime(
        () => display.displaySupply(stressState),
        300, // < 300ms for huge supply
        'very large supply display'
      );
    });

    test('should handle extreme move lists', async () => {
      const display = new Display();
      const parser = new Parser();

      const extremeMoveList = Array(1000).fill(0).map((_, i) => ({
        type: 'play_action' as const,
        card: `ExtremeCard${i}WithVeryLongNameThatMightCausePerformanceIssues`
      }));

      await PerformanceHelper.assertWithinTime(
        () => display.displayAvailableMoves(extremeMoveList),
        500, // < 500ms for extreme list
        'extreme move list display'
      );

      await PerformanceHelper.assertWithinTime(
        () => parser.parseInput('500', extremeMoveList),
        20, // < 20ms for parsing even extreme list
        'extreme move list parsing'
      );
    });

    test('should maintain performance under CPU stress', async () => {
      const cli = new PrincipalityCLI('cpu-stress-seed');

      // Simulate CPU-intensive operations
      const startTime = Date.now();

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const state = cli['gameState'];
        const moves = cli['engine'].getValidMoves(state);

        cli['display'].displayGameState(state);
        cli['display'].displayAvailableMoves(moves);
        cli['display'].displaySupply(state);

        moves.forEach((move, index) => {
          cli['parser'].parseInput((index + 1).toString(), moves);
        });

        consoleCapture.clear();
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 100 full cycles should complete in reasonable time (< 5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Phase 1.5 performance preparation', () => {
    test('should meet future chained input parsing targets', async () => {
      const parser = new Parser();
      const moves = MockMoveGenerator.mixedMoves();
      const scenarios = Phase15PerformanceUtils.createPerformanceScenarios();

      // Test large chain parsing (when implemented)
      await PerformanceHelper.assertWithinTime(
        () => parser.parseInput(scenarios.largeChain, moves),
        Phase15PerformanceUtils.getPerformanceTargets().parseChainedInput,
        'large chain parsing preparation'
      );
    });

    test('should meet auto-play treasures performance targets', async () => {
      const display = new Display();
      const treasureHand = Array(20).fill('Copper'); // Many treasures

      // Simulate treasure auto-play display
      await PerformanceHelper.assertWithinTime(
        () => {
          // Future: display treasure auto-play summary
          display.displayInfo(`Played all treasures: ${treasureHand.join(', ')}`);
        },
        Phase15PerformanceUtils.getPerformanceTargets().autoPlayTreasures,
        'auto-play treasures display preparation'
      );
    });

    test('should meet VP calculation performance targets', async () => {
      const scenarios = Phase15PerformanceUtils.createPerformanceScenarios();

      await PerformanceHelper.assertWithinTime(
        () => {
          // Simulate VP calculation for large deck
          const vpCount = scenarios.complexVP.filter(card =>
            ['Estate', 'Duchy', 'Province'].includes(card)
          ).length;
          return vpCount;
        },
        Phase15PerformanceUtils.getPerformanceTargets().calculateVP,
        'VP calculation preparation'
      );
    });

    test('should meet stable numbers display targets', async () => {
      const display = new Display();
      const scenarios = Phase15PerformanceUtils.createPerformanceScenarios();

      await PerformanceHelper.assertWithinTime(
        () => display.displayAvailableMoves(scenarios.largeMoveList),
        Phase15PerformanceUtils.getPerformanceTargets().displayWithStableNumbers,
        'stable numbers display preparation'
      );
    });

    test('should meet quick game initialization targets', async () => {
      await PerformanceHelper.assertWithinTime(
        () => {
          // Simulate quick game setup
          const cli = new PrincipalityCLI('quick-game-seed');
          // Future: modify supply for quick game
          return cli;
        },
        Phase15PerformanceUtils.getPerformanceTargets().quickGameSetup,
        'quick game setup preparation'
      );
    });
  });

  describe('Performance regression testing', () => {
    test('should maintain baseline performance', async () => {
      // Test core operations maintain expected performance
      const cli = new PrincipalityCLI('baseline-seed');
      const parser = new Parser();
      const display = new Display();
      const moves = MockMoveGenerator.mixedMoves();
      const state = GameStateBuilder.create().build();

      const operations = [
        () => parser.parseInput('1', moves),
        () => parser.parseInput('help', moves),
        () => display.displayGameState(state),
        () => display.displayAvailableMoves(moves),
        () => display.displaySupply(state)
      ];

      for (const operation of operations) {
        await PerformanceHelper.assertWithinTime(
          operation,
          100, // < 100ms per operation (general CLI requirement)
          'baseline operation'
        );
      }
    });

    test('should scale linearly with input size', async () => {
      const parser = new Parser();

      // Test with different move list sizes
      const sizes = [10, 50, 100, 500];
      const times: number[] = [];

      for (const size of sizes) {
        const moves = Array(size).fill(0).map((_, i) => ({
          type: 'play_action' as const,
          card: `Card${i}`
        }));

        const { averageMs } = await PerformanceHelper.measureAverageTime(
          () => parser.parseInput(Math.floor(size / 2).toString(), moves),
          10
        );

        times.push(averageMs);
      }

      // Performance should scale reasonably (not exponentially)
      // Ratio of largest to smallest should be < 10x
      const scalingRatio = times[times.length - 1] / times[0];
      expect(scalingRatio).toBeLessThan(10);
    });
  });

  describe('Real-world performance scenarios', () => {
    test('should handle typical user interaction patterns', async () => {
      const cli = new PrincipalityCLI('real-world-seed');

      // Simulate realistic user behavior
      const typicalSession = [
        'help',           // User checks help
        'hand',           // Checks hand
        'supply',         // Checks supply
        '3',              // Makes a move
        'hand',           // Checks hand again
        '2',              // Another move
        'invalid',        // User makes mistake
        'supply',         // Checks supply
        '1',              // Final move
        'quit'            // Exits
      ];

      mockReadline.setInputs(typicalSession);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        3000, // < 3 seconds for typical session
        'typical user session'
      );
    });

    test('should handle power user interaction patterns', async () => {
      const cli = new PrincipalityCLI('power-user-seed');

      // Simulate experienced user making rapid moves
      const powerUserSession = [
        '3', '3', '3', '3', '3',  // Rapid moves
        'hand', 'supply',         // Quick info checks
        '1', '2', '3',            // More rapid moves
        'quit'
      ];

      mockReadline.setInputs(powerUserSession);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        2000, // < 2 seconds for power user
        'power user session'
      );
    });

    test('should handle confused user patterns', async () => {
      const cli = new PrincipalityCLI('confused-user-seed');

      // Simulate confused user with many errors
      const confusedSession = [
        'what', 'how', 'play', 'cards',     // Invalid commands
        'help',                              // Gets help
        '999', '0', '-1',                   // Invalid moves
        'help',                              // Gets help again
        'hand',                              // Valid command
        '1',                                 // Valid move
        'quit'
      ];

      mockReadline.setInputs(confusedSession);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        3000, // < 3 seconds even with many errors
        'confused user session'
      );
    });
  });
});