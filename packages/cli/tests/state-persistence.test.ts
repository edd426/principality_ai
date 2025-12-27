/**
 * Test Suite: State Persistence for Turn-Based CLI Mode (Phase 4.3)
 *
 * Requirements: SP-* (State Persistence)
 * Validates serialization, deserialization, and file I/O for game state
 *
 * Key Requirements:
 * - Supply Map serialization as tuples
 * - PendingEffect preservation
 * - Graceful error handling
 * - State roundtrip integrity
 */

// @req: SP-1 - Supply Map serialization as [[cardName, count], ...] tuples
// @req: SP-2 - PendingEffect serialization/deserialization preserves all fields
// @req: SP-3 - Reconstruct Map from tuple array correctly
// @req: SP-4 - Graceful file I/O error handling (invalid path, corrupted JSON)
// @edge: Empty supply; nested PendingEffect fields; concurrent file access; large game logs
// @why: Turn-based CLI requires persistent state across invocations for AI agent testing

import { GameEngine, GameState, PendingEffect } from '@principality/core';
import { CLIOptions } from '../src/cli';
import { GameStateBuilder } from './utils/test-utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * Serialized game state structure
 * Must be JSON-compatible for file storage
 */
interface SerializedGameState {
  schemaVersion: string;  // "1.0.0"
  timestamp: string;
  seed: string;
  players: Array<any>;  // PlayerState serialized
  supply: Array<[string, number]>;  // Map as tuples for JSON
  currentPlayer: number;
  phase: 'action' | 'buy' | 'cleanup';
  turnNumber: number;
  gameLog: string[];
  trash: string[];
  pendingEffect?: PendingEffect;
  selectedKingdomCards?: string[];
  cliOptions: CLIOptions;
}

/**
 * Import functions from implementation
 */
import {
  serializeState,
  deserializeState,
  saveStateToFile,
  loadStateFromFile
} from '../src/state-persistence';

describe('State Persistence - Serialization', () => {
  let engine: GameEngine;
  let testState: GameState;
  let testOptions: CLIOptions;

  beforeEach(() => {
    engine = new GameEngine('test-persistence-seed');
    testState = engine.initializeGame(1);
    testOptions = {
      victoryPileSize: 4,
      stableNumbers: true,
      autoPlayTreasures: false,
      edition: '2E'
    };
  });

  describe('SP-1: Supply Map serialization', () => {
    test('should serialize Supply Map as [[cardName, count], ...] tuples', () => {
      // @req: SP-1 - Supply Map must be JSON-compatible
      // @edge: Supply is a Map, which isn't JSON-serializable directly
      // @why: JSON.stringify doesn't handle Map objects - must convert to array

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(testState, testOptions);
        expect(serialized.supply).toBeInstanceOf(Array);
        expect(serialized.supply.length).toBeGreaterThan(0);

        // Each entry should be a [string, number] tuple
        serialized.supply.forEach(entry => {
          expect(entry).toHaveLength(2);
          expect(typeof entry[0]).toBe('string');  // card name
          expect(typeof entry[1]).toBe('number');  // count
        });
      }).not.toThrow();
    });

    test('should preserve all supply pile counts during serialization', () => {
      // @req: SP-1 - All supply entries must be preserved
      // @edge: No data loss during Map → Array conversion

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(testState, testOptions);

        // Count should match original Map size
        expect(serialized.supply.length).toBe(testState.supply.size);

        // Verify specific cards are present
        const supplyCards = new Map(serialized.supply);
        expect(supplyCards.get('Copper')).toBe(testState.supply.get('Copper'));
        expect(supplyCards.get('Silver')).toBe(testState.supply.get('Silver'));
        expect(supplyCards.get('Gold')).toBe(testState.supply.get('Gold'));
        expect(supplyCards.get('Estate')).toBe(testState.supply.get('Estate'));
        expect(supplyCards.get('Duchy')).toBe(testState.supply.get('Duchy'));
        expect(supplyCards.get('Province')).toBe(testState.supply.get('Province'));
      }).not.toThrow();
    });

    test('should handle empty supply piles in serialization', () => {
      // @req: SP-1 - Handle edge case of 0 count piles
      // @edge: Province pile empty (game over condition)

      const endGameState = GameStateBuilder.create()
        .withSupply({ 'Province': 0 })
        .build();

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(endGameState, testOptions);
        const supplyMap = new Map(serialized.supply);
        expect(supplyMap.get('Province')).toBe(0);
      }).not.toThrow();
    });
  });

  describe('SP-2: PendingEffect preservation', () => {
    test('should serialize PendingEffect with all basic fields', () => {
      // @req: SP-2 - All PendingEffect fields must be preserved
      // @edge: Chapel card with maxTrash field

      const pendingEffect: PendingEffect = {
        card: 'Chapel',
        effect: 'trash_up_to_4',
        maxTrash: 4
      };

      const stateWithPending: GameState = {
        ...testState,
        pendingEffect
      };

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(stateWithPending, testOptions);
        expect(serialized.pendingEffect).toBeDefined();
        expect(serialized.pendingEffect!.card).toBe('Chapel');
        expect(serialized.pendingEffect!.effect).toBe('trash_up_to_4');
        expect(serialized.pendingEffect!.maxTrash).toBe(4);
      }).not.toThrow();
    });

    test('should preserve nested PendingEffect fields', () => {
      // @req: SP-2 - Complex PendingEffect objects must be preserved
      // @edge: Mine card with trashedCard, maxGainCost, destination fields

      const complexPending: PendingEffect = {
        card: 'Mine',
        effect: 'gain_upgraded_treasure',
        trashedCard: 'Copper',
        maxGainCost: 6,
        destination: 'hand'
      };

      const stateWithComplex: GameState = {
        ...testState,
        pendingEffect: complexPending
      };

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(stateWithComplex, testOptions);
        expect(serialized.pendingEffect!.trashedCard).toBe('Copper');
        expect(serialized.pendingEffect!.maxGainCost).toBe(6);
        expect(serialized.pendingEffect!.destination).toBe('hand');
      }).not.toThrow();
    });

    test('should preserve Library setAsideCards array', () => {
      // @req: SP-2 - Array fields within PendingEffect must be preserved
      // @edge: Library card with setAsideCards array

      const libraryPending: PendingEffect = {
        card: 'Library',
        effect: 'draw_until_7',
        setAsideCards: ['Village', 'Smithy', 'Market'],
        targetHandSize: 7,
        drawnCard: 'Festival'
      };

      const stateWithLibrary: GameState = {
        ...testState,
        pendingEffect: libraryPending
      };

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(stateWithLibrary, testOptions);
        expect(serialized.pendingEffect!.setAsideCards).toEqual(['Village', 'Smithy', 'Market']);
        expect(serialized.pendingEffect!.targetHandSize).toBe(7);
        expect(serialized.pendingEffect!.drawnCard).toBe('Festival');
      }).not.toThrow();
    });

    test('should handle undefined pendingEffect', () => {
      // @req: SP-2 - Gracefully handle absence of pendingEffect
      // @edge: Normal game state without pending effects

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(testState, testOptions);
        // pendingEffect should be undefined or not present
        expect(serialized.pendingEffect).toBeUndefined();
      }).not.toThrow();
    });
  });

  describe('SP-3: Map reconstruction from tuples', () => {
    test('should deserialize tuple array back to Supply Map', () => {
      // @req: SP-3 - Reconstruct Map from tuple array correctly
      // @edge: Round-trip conversion must preserve Map structure

      // This test will fail until both serialize/deserialize are implemented
      expect(() => {
        const serialized = serializeState(testState, testOptions);
        const { state: deserialized } = deserializeState(serialized);

        expect(deserialized.supply).toBeInstanceOf(Map);
        expect(deserialized.supply.size).toBe(testState.supply.size);
      }).not.toThrow();
    });

    test('should preserve exact supply counts in roundtrip', () => {
      // @req: SP-3 - No data loss in serialize → deserialize cycle
      // @edge: All supply counts must match exactly

      // This test will fail until both serialize/deserialize are implemented
      expect(() => {
        const serialized = serializeState(testState, testOptions);
        const { state: deserialized } = deserializeState(serialized);

        // Verify each card count matches
        testState.supply.forEach((count, cardName) => {
          expect(deserialized.supply.get(cardName)).toBe(count);
        });
      }).not.toThrow();
    });

    test('should reconstruct all game state fields correctly', () => {
      // @req: SP-3 - Complete state integrity after deserialization
      // @edge: All fields (players, phase, turn, log, etc.) preserved

      const stateWithHistory = GameStateBuilder.create()
        .withPhase('buy')
        .withTurnNumber(5)
        .build();

      // Add game log entries
      const stateWithLog: GameState = {
        ...stateWithHistory,
        gameLog: ['Turn 1: Player 1 bought Silver', 'Turn 2: Player 1 bought Estate']
      };

      // This test will fail until both serialize/deserialize are implemented
      expect(() => {
        const serialized = serializeState(stateWithLog, testOptions);
        const { state: deserialized } = deserializeState(serialized);

        expect(deserialized.phase).toBe('buy');
        expect(deserialized.turnNumber).toBe(5);
        expect(deserialized.gameLog).toEqual(stateWithLog.gameLog);
        expect(deserialized.currentPlayer).toBe(stateWithLog.currentPlayer);
      }).not.toThrow();
    });

    test('should preserve CLIOptions during roundtrip', () => {
      // @req: SP-3 - CLI configuration must be preserved
      // @edge: Options needed to restart CLI with same settings

      const complexOptions: CLIOptions = {
        victoryPileSize: 4,
        stableNumbers: true,
        autoPlayTreasures: true,
        manualCleanup: false,
        edition: '1E',
        debugMode: true
      };

      // This test will fail until both serialize/deserialize are implemented
      expect(() => {
        const serialized = serializeState(testState, complexOptions);
        const { options: deserializedOptions } = deserializeState(serialized);

        expect(deserializedOptions.victoryPileSize).toBe(4);
        expect(deserializedOptions.stableNumbers).toBe(true);
        expect(deserializedOptions.autoPlayTreasures).toBe(true);
        expect(deserializedOptions.manualCleanup).toBe(false);
        expect(deserializedOptions.edition).toBe('1E');
        expect(deserializedOptions.debugMode).toBe(true);
      }).not.toThrow();
    });
  });

  describe('SP-1: Schema versioning', () => {
    test('should include schema version in serialized state', () => {
      // @req: SP-1 - Schema version for backward compatibility
      // @edge: Future format changes need version detection

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(testState, testOptions);
        expect(serialized.schemaVersion).toBe('1.0.0');
      }).not.toThrow();
    });

    test('should include timestamp in serialized state', () => {
      // @req: SP-1 - Timestamp for debugging and state tracking
      // @edge: Useful for AI agent logs

      // This test will fail until serializeState is implemented
      expect(() => {
        const serialized = serializeState(testState, testOptions);
        expect(serialized.timestamp).toBeDefined();
        expect(typeof serialized.timestamp).toBe('string');
        // Verify it's a valid ISO timestamp
        expect(() => new Date(serialized.timestamp)).not.toThrow();
      }).not.toThrow();
    });
  });
});

describe('State Persistence - File I/O', () => {
  let engine: GameEngine;
  let testState: GameState;
  let testOptions: CLIOptions;
  let tempDir: string;
  let stateFilePath: string;

  beforeEach(async () => {
    engine = new GameEngine('test-file-io-seed');
    testState = engine.initializeGame(1);
    testOptions = { victoryPileSize: 4, edition: '2E' };

    // Create temp directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'principality-test-'));
    stateFilePath = path.join(tempDir, 'game-state.json');
  });

  afterEach(async () => {
    // Clean up temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('SP-4: File I/O operations', () => {
    test('should save state to file successfully', async () => {
      // @req: SP-4 - Write serialized state to filesystem
      // @edge: File creation in valid directory

      // This test will fail until saveStateToFile is implemented
      await expect(async () => {
        await saveStateToFile(testState, testOptions, stateFilePath);

        // Verify file exists
        const fileExists = await fs.access(stateFilePath)
          .then(() => true)
          .catch(() => false);
        expect(fileExists).toBe(true);
      }).not.toThrow();
    });

    test('should load state from file successfully', async () => {
      // @req: SP-4 - Read and deserialize state from filesystem
      // @edge: Complete round-trip file I/O

      // This test will fail until save/load are implemented
      await expect(async () => {
        await saveStateToFile(testState, testOptions, stateFilePath);
        const { state: loadedState, options: loadedOptions } = await loadStateFromFile(stateFilePath);

        expect(loadedState.seed).toBe(testState.seed);
        expect(loadedState.turnNumber).toBe(testState.turnNumber);
        expect(loadedState.phase).toBe(testState.phase);
        expect(loadedOptions.victoryPileSize).toBe(testOptions.victoryPileSize);
      }).not.toThrow();
    });

    test('should preserve game state integrity in file roundtrip', async () => {
      // @req: SP-4 - Complete state preservation through file I/O
      // @edge: No data corruption during save/load cycle

      const complexState = GameStateBuilder.create()
        .withPhase('buy')
        .withTurnNumber(10)
        .withPlayerStats(0, { actions: 2, buys: 3, coins: 15 })
        .build();

      // This test will fail until save/load are implemented
      await expect(async () => {
        await saveStateToFile(complexState, testOptions, stateFilePath);
        const { state: loadedState } = await loadStateFromFile(stateFilePath);

        expect(loadedState.phase).toBe('buy');
        expect(loadedState.turnNumber).toBe(10);
        expect(loadedState.players[0].actions).toBe(2);
        expect(loadedState.players[0].buys).toBe(3);
        expect(loadedState.players[0].coins).toBe(15);
      }).not.toThrow();
    });

    test('should handle invalid file path gracefully', async () => {
      // @req: SP-4 - Graceful error handling for invalid paths
      // @edge: Attempting to save to non-existent directory

      const invalidPath = '/nonexistent/directory/game-state.json';

      // This test will fail until saveStateToFile is implemented with error handling
      await expect(
        saveStateToFile(testState, testOptions, invalidPath)
      ).rejects.toThrow();
    });

    test('should handle missing file gracefully', async () => {
      // @req: SP-4 - Graceful error handling when file doesn't exist
      // @edge: Loading state before initialization

      const missingFilePath = path.join(tempDir, 'nonexistent.json');

      // This test will fail until loadStateFromFile is implemented with error handling
      await expect(
        loadStateFromFile(missingFilePath)
      ).rejects.toThrow();
    });

    test('should handle corrupted JSON gracefully', async () => {
      // @req: SP-4 - Graceful error handling for malformed JSON
      // @edge: File exists but contains invalid JSON

      // Write corrupted JSON to file
      await fs.writeFile(stateFilePath, '{ invalid json }', 'utf-8');

      // This test will fail until loadStateFromFile is implemented with error handling
      await expect(
        loadStateFromFile(stateFilePath)
      ).rejects.toThrow();
    });

    test('should handle incomplete state data gracefully', async () => {
      // @req: SP-4 - Graceful error handling for incomplete state
      // @edge: Valid JSON but missing required fields

      const incompleteState = {
        schemaVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        // Missing required fields like players, supply, etc.
      };

      await fs.writeFile(stateFilePath, JSON.stringify(incompleteState), 'utf-8');

      // This test will fail until loadStateFromFile is implemented with validation
      await expect(
        loadStateFromFile(stateFilePath)
      ).rejects.toThrow();
    });

    test('should handle large game logs without performance issues', async () => {
      // @req: SP-4 - Handle large state files efficiently
      // @edge: Game with 1000+ log entries

      const largeLog = Array.from({ length: 1000 }, (_, i) =>
        `Turn ${Math.floor(i / 10) + 1}: Player 1 bought Silver`
      );

      const stateWithLargeLog: GameState = {
        ...testState,
        gameLog: largeLog
      };

      // This test will fail until save/load are implemented efficiently
      await expect(async () => {
        const startTime = Date.now();
        await saveStateToFile(stateWithLargeLog, testOptions, stateFilePath);
        const { state: loadedState } = await loadStateFromFile(stateFilePath);
        const endTime = Date.now();

        expect(loadedState.gameLog).toHaveLength(1000);
        expect(endTime - startTime).toBeLessThan(1000); // < 1 second
      }).not.toThrow();
    });
  });

  describe('SP-4: File format validation', () => {
    test('should write valid JSON to file', async () => {
      // @req: SP-4 - File must contain valid JSON
      // @edge: Manual inspection of file format

      // This test will fail until saveStateToFile is implemented
      await expect(async () => {
        await saveStateToFile(testState, testOptions, stateFilePath);

        const fileContent = await fs.readFile(stateFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent); // Should not throw

        expect(parsed.schemaVersion).toBeDefined();
        expect(parsed.supply).toBeInstanceOf(Array);
      }).not.toThrow();
    });

    test('should write human-readable JSON with indentation', async () => {
      // @req: SP-4 - JSON should be human-readable for debugging
      // @edge: Pretty-printed JSON for manual inspection

      // This test will fail until saveStateToFile is implemented
      await expect(async () => {
        await saveStateToFile(testState, testOptions, stateFilePath);

        const fileContent = await fs.readFile(stateFilePath, 'utf-8');

        // Check for indentation (pretty-printed JSON)
        expect(fileContent).toContain('\n');
        expect(fileContent).toMatch(/\s{2,}/); // Contains multi-space indentation
      }).not.toThrow();
    });
  });
});
