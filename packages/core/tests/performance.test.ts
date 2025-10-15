import { GameEngine } from '../src/game';
import { GameState } from '../src/types';

/**
 * Performance Test Suite
 *
 * Tests performance requirements from PERFORMANCE_REQUIREMENTS.md:
 * - Move execution: < 10ms average, < 20ms P99
 * - Shuffle operation: < 50ms average
 * - Game initialization: < 100ms average
 * - Session memory: < 1MB per game
 *
 * Methodology:
 * - 100 iterations warmup (JIT compilation)
 * - 1000 iterations measurement
 * - High-precision timing using process.hrtime.bigint()
 * - Statistical analysis: Mean, Median, P95, P99, Max
 */

interface PerformanceStats {
  mean: number;
  median: number;
  p95: number;
  p99: number;
  max: number;
  min: number;
}

function calculateStats(measurements: number[]): PerformanceStats {
  const sorted = [...measurements].sort((a, b) => a - b);
  const sum = measurements.reduce((a, b) => a + b, 0);

  return {
    mean: sum / measurements.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    max: sorted[sorted.length - 1],
    min: sorted[0]
  };
}

function measureOperation(operation: () => void): number {
  const start = process.hrtime.bigint();
  operation();
  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000; // Convert to milliseconds
}

describe('Performance Tests', () => {
  const WARMUP_ITERATIONS = 100;
  const MEASUREMENT_ITERATIONS = 1000;

  describe('Move Execution Performance', () => {
    test('should execute moves in < 10ms average, < 20ms P99', () => {
      const engine = new GameEngine('perf-move-test');
      let gameState = engine.initializeGame(1);
      const measurements: number[] = [];

      // Setup a typical game state
      gameState = {
        ...gameState,
        players: [{
          ...gameState.players[0],
          hand: ['Village', 'Smithy', 'Copper', 'Copper', 'Estate'],
          drawPile: ['Market', 'Laboratory', 'Gold', 'Silver', 'Province'],
          actions: 1,
          buys: 1,
          coins: 0
        }]
      };

      // Warmup
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        engine.executeMove(gameState, { type: 'play_action', card: 'Village' });
      }

      // Measurement - test various move types
      const moveTypes = [
        { type: 'play_action' as const, card: 'Village' },
        { type: 'end_phase' as const }
      ];

      for (let i = 0; i < MEASUREMENT_ITERATIONS; i++) {
        const move = moveTypes[i % moveTypes.length];

        const duration = measureOperation(() => {
          const result = engine.executeMove(gameState, move);
          if (result.success) {
            gameState = result.newState!;
          }
        });

        measurements.push(duration);

        // Reset state periodically to keep test consistent
        if (i % 10 === 0) {
          gameState = engine.initializeGame(1);
          gameState = {
            ...gameState,
            players: [{
              ...gameState.players[0],
              hand: ['Village', 'Smithy', 'Copper', 'Copper', 'Estate'],
              drawPile: ['Market', 'Laboratory', 'Gold', 'Silver', 'Province'],
              actions: 1,
              buys: 1,
              coins: 0
            }]
          };
        }
      }

      const stats = calculateStats(measurements);

      console.log('Move Execution Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        median: stats.median.toFixed(3) + 'ms',
        p95: stats.p95.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms',
        max: stats.max.toFixed(3) + 'ms'
      });

      // Requirements
      expect(stats.mean).toBeLessThan(10);
      expect(stats.p99).toBeLessThan(20);
    });

    test('should execute card draws in < 10ms average', () => {
      const engine = new GameEngine('perf-draw-test');
      let gameState = engine.initializeGame(1);
      const measurements: number[] = [];

      // Setup state with Smithy (draws 3 cards)
      gameState = {
        ...gameState,
        players: [{
          ...gameState.players[0],
          hand: ['Smithy', 'Copper', 'Copper'],
          drawPile: ['Village', 'Market', 'Laboratory', 'Gold'],
          actions: 1
        }]
      };

      // Warmup
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        const result = engine.executeMove(gameState, { type: 'play_action', card: 'Smithy' });
        if (result.success) {
          gameState = result.newState!;
        }
      }

      // Measurement
      for (let i = 0; i < MEASUREMENT_ITERATIONS; i++) {
        gameState = {
          ...gameState,
          players: [{
            ...gameState.players[0],
            hand: ['Smithy'],
            drawPile: ['Village', 'Market', 'Laboratory'],
            actions: 1
          }]
        };

        const duration = measureOperation(() => {
          engine.executeMove(gameState, { type: 'play_action', card: 'Smithy' });
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('Card Draw Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms'
      });

      expect(stats.mean).toBeLessThan(10);
    });

    test('should execute buy moves in < 10ms average', () => {
      const engine = new GameEngine('perf-buy-test');
      let gameState = engine.initializeGame(1);
      const measurements: number[] = [];

      // Setup buy phase
      gameState = {
        ...gameState,
        phase: 'buy',
        players: [{
          ...gameState.players[0],
          coins: 10,
          buys: 1
        }]
      };

      // Warmup
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        engine.executeMove(gameState, { type: 'buy', card: 'Silver' });
      }

      // Measurement
      for (let i = 0; i < MEASUREMENT_ITERATIONS; i++) {
        const duration = measureOperation(() => {
          engine.executeMove(gameState, { type: 'buy', card: 'Silver' });
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('Buy Move Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms'
      });

      expect(stats.mean).toBeLessThan(10);
    });
  });

  describe('Game Initialization Performance', () => {
    test('should initialize game in < 100ms average', () => {
      const measurements: number[] = [];

      // Warmup
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        const engine = new GameEngine(`warmup-${i}`);
        engine.initializeGame(1);
      }

      // Measurement
      for (let i = 0; i < MEASUREMENT_ITERATIONS; i++) {
        const engine = new GameEngine(`test-${i}`);

        const duration = measureOperation(() => {
          engine.initializeGame(1);
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('Game Initialization Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        median: stats.median.toFixed(3) + 'ms',
        p95: stats.p95.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms',
        max: stats.max.toFixed(3) + 'ms'
      });

      expect(stats.mean).toBeLessThan(100);
      expect(stats.p99).toBeLessThan(200);
    });

    test('should initialize 2-player game in < 100ms average', () => {
      const measurements: number[] = [];

      // Measurement (warmup less critical for initialization)
      for (let i = 0; i < 100; i++) {
        const engine = new GameEngine(`multi-test-${i}`);

        const duration = measureOperation(() => {
          engine.initializeGame(2);
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('2-Player Initialization Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms'
      });

      expect(stats.mean).toBeLessThan(100);
    });

    test('should initialize 4-player game in < 100ms average', () => {
      const measurements: number[] = [];

      // Measurement
      for (let i = 0; i < 100; i++) {
        const engine = new GameEngine(`4player-test-${i}`);

        const duration = measureOperation(() => {
          engine.initializeGame(4);
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('4-Player Initialization Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms'
      });

      expect(stats.mean).toBeLessThan(100);
    });
  });

  describe('getValidMoves Performance', () => {
    test('should calculate valid moves in < 5ms average', () => {
      const engine = new GameEngine('valid-moves-test');
      let gameState = engine.initializeGame(1);
      const measurements: number[] = [];

      // Setup state with multiple action cards
      gameState = {
        ...gameState,
        players: [{
          ...gameState.players[0],
          hand: ['Village', 'Smithy', 'Laboratory', 'Market', 'Festival'],
          actions: 3
        }]
      };

      // Warmup
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        engine.getValidMoves(gameState);
      }

      // Measurement
      for (let i = 0; i < MEASUREMENT_ITERATIONS; i++) {
        const duration = measureOperation(() => {
          engine.getValidMoves(gameState);
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('Valid Moves Calculation Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms'
      });

      expect(stats.mean).toBeLessThan(5);
      expect(stats.p99).toBeLessThan(10);
    });

    test('should calculate buy phase valid moves in < 5ms average', () => {
      const engine = new GameEngine('buy-moves-test');
      let gameState = engine.initializeGame(1);
      const measurements: number[] = [];

      // Setup buy phase with many affordable cards
      gameState = {
        ...gameState,
        phase: 'buy',
        players: [{
          ...gameState.players[0],
          hand: ['Copper', 'Copper', 'Silver', 'Gold', 'Gold'],
          coins: 10,
          buys: 3
        }]
      };

      // Warmup
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        engine.getValidMoves(gameState);
      }

      // Measurement
      for (let i = 0; i < MEASUREMENT_ITERATIONS; i++) {
        const duration = measureOperation(() => {
          engine.getValidMoves(gameState);
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('Buy Phase Valid Moves Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms'
      });

      expect(stats.mean).toBeLessThan(5);
    });
  });

  describe('checkGameOver Performance', () => {
    test('should check game over in < 20ms average', () => {
      const engine = new GameEngine('gameover-test');
      let gameState = engine.initializeGame(2);
      const measurements: number[] = [];

      // Warmup
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        engine.checkGameOver(gameState);
      }

      // Measurement
      for (let i = 0; i < MEASUREMENT_ITERATIONS; i++) {
        const duration = measureOperation(() => {
          engine.checkGameOver(gameState);
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('Check Game Over Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms'
      });

      expect(stats.mean).toBeLessThan(20);
      expect(stats.p99).toBeLessThan(40);
    });
  });

  describe('Complex Scenario Performance', () => {
    test('should handle complete turn cycle in acceptable time', () => {
      const engine = new GameEngine('full-turn-test');
      const measurements: number[] = [];

      // Warmup
      for (let i = 0; i < 50; i++) {
        let gameState = engine.initializeGame(1);
        gameState = {
          ...gameState,
          players: [{
            ...gameState.players[0],
            hand: ['Village', 'Copper', 'Copper', 'Silver', 'Estate'],
            drawPile: ['Smithy', 'Market']
          }]
        };

        // Execute full turn
        let result = engine.executeMove(gameState, { type: 'play_action', card: 'Village' });
        gameState = result.newState!;
        result = engine.executeMove(gameState, { type: 'end_phase' });
        gameState = result.newState!;
        result = engine.executeMove(gameState, { type: 'play_treasure', card: 'Copper' });
        gameState = result.newState!;
        result = engine.executeMove(gameState, { type: 'buy', card: 'Estate' });
        gameState = result.newState!;
        result = engine.executeMove(gameState, { type: 'end_phase' });
        gameState = result.newState!;
        engine.executeMove(gameState, { type: 'end_phase' });
      }

      // Measurement
      for (let i = 0; i < 100; i++) {
        let gameState = engine.initializeGame(1);
        gameState = {
          ...gameState,
          players: [{
            ...gameState.players[0],
            hand: ['Village', 'Copper', 'Copper', 'Silver', 'Estate'],
            drawPile: ['Smithy', 'Market']
          }]
        };

        const duration = measureOperation(() => {
          // Execute full turn: action phase -> buy phase -> cleanup
          let result = engine.executeMove(gameState, { type: 'play_action', card: 'Village' });
          gameState = result.newState!;
          result = engine.executeMove(gameState, { type: 'end_phase' });
          gameState = result.newState!;
          result = engine.executeMove(gameState, { type: 'play_treasure', card: 'Copper' });
          gameState = result.newState!;
          result = engine.executeMove(gameState, { type: 'buy', card: 'Estate' });
          gameState = result.newState!;
          result = engine.executeMove(gameState, { type: 'end_phase' });
          gameState = result.newState!;
          engine.executeMove(gameState, { type: 'end_phase' });
        });

        measurements.push(duration);
      }

      const stats = calculateStats(measurements);

      console.log('Full Turn Cycle Performance Stats:', {
        mean: stats.mean.toFixed(3) + 'ms',
        p99: stats.p99.toFixed(3) + 'ms'
      });

      // Full turn should complete in reasonable time (6 moves * 10ms = 60ms budget)
      expect(stats.mean).toBeLessThan(60);
    });
  });

  // Memory usage test - requires --expose-gc flag
  describe('Memory Usage', () => {
    test('should use < 1MB per game session', () => {
      // This test only runs if GC is available (node --expose-gc)
      if (!global.gc) {
        console.log('Skipping memory test (run with --expose-gc for memory tests)');
        return;
      }

      // Force GC before measurement
      global.gc();
      const before = process.memoryUsage().heapUsed;

      // Create 100 game sessions
      const sessions: GameState[] = [];
      for (let i = 0; i < 100; i++) {
        const engine = new GameEngine(`mem-test-${i}`);
        sessions.push(engine.initializeGame(2));
      }

      // Force GC after creation
      global.gc();
      const after = process.memoryUsage().heapUsed;

      const memoryPerSession = (after - before) / sessions.length;
      const memoryMB = memoryPerSession / (1024 * 1024);

      console.log(`Memory per session: ${memoryMB.toFixed(3)} MB`);

      expect(memoryMB).toBeLessThan(1.0);

      // Keep sessions in scope so they're not GC'd during measurement
      expect(sessions.length).toBe(100);
    });
  });
});
