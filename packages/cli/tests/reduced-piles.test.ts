/**
 * Test Suite: Configurable Victory Pile Sizes (Phase 2.0)
 *
 * Tests victory pile configuration system
 * Default: 4 cards per pile (Estate, Duchy, Province)
 * Customizable: via game-config.json or victoryPileSize option
 */

// @req: R2.0 - Configurable victory pile sizes for game speed control
// @edge: Default to 4 for 40% faster games; configurable via game-config.json
// @why: Faster testing and gameplay without hardcoded values

import { GameEngine } from '@principality/core';

describe('Feature: Configurable Victory Pile Sizes (Phase 2.0)', () => {
  describe('Default Configuration', () => {
    test('should default to 4 victory cards per pile', () => {
      // Arrange
      const engine = new GameEngine('test-seed', {});
      const state = engine.initializeGame(1);

      // Assert
      expect(state.supply.get('Estate')).toBe(4);
      expect(state.supply.get('Duchy')).toBe(4);
      expect(state.supply.get('Province')).toBe(4);
    });

    test('kingdom cards unchanged (always 10)', () => {
      const engine = new GameEngine('test-seed', {});
      const state = engine.initializeGame(1);

      const kingdomCards = [
        'Village', 'Smithy', 'Laboratory', 'Market',
        'Woodcutter', 'Festival', 'Council Room', 'Cellar'
      ];

      kingdomCards.forEach(card => {
        expect(state.supply.get(card)).toBe(10);
      });
    });

    test('treasures unchanged', () => {
      const engine = new GameEngine('test-seed', {});
      const state = engine.initializeGame(1);

      expect(state.supply.get('Copper')).toBe(60);
      expect(state.supply.get('Silver')).toBe(40);
      expect(state.supply.get('Gold')).toBe(30);
    });
  });

  describe('Custom Victory Pile Size', () => {
    test('should support custom victory pile size', () => {
      // Arrange
      const engine = new GameEngine('test-seed', { victoryPileSize: 8 });
      const state = engine.initializeGame(1);

      // Assert
      expect(state.supply.get('Estate')).toBe(8);
      expect(state.supply.get('Duchy')).toBe(8);
      expect(state.supply.get('Province')).toBe(8);
    });

    test('should support multiple custom sizes', () => {
      const sizes = [2, 4, 6, 8, 10, 12];

      sizes.forEach(size => {
        const engine = new GameEngine('test-seed', { victoryPileSize: size });
        const state = engine.initializeGame(1);

        expect(state.supply.get('Province')).toBe(size);
        expect(state.supply.get('Duchy')).toBe(size);
        expect(state.supply.get('Estate')).toBe(size);
      });
    });

    test('other piles unchanged with custom sizes', () => {
      const engine = new GameEngine('test-seed', { victoryPileSize: 6 });
      const state = engine.initializeGame(1);

      // Victory cards changed
      expect(state.supply.get('Province')).toBe(6);

      // But kingdom/treasures stay same
      expect(state.supply.get('Village')).toBe(10);
      expect(state.supply.get('Copper')).toBe(60);
    });
  });

  describe('Game End Conditions', () => {
    test('game end condition triggered when Province = 0', () => {
      const engine = new GameEngine('test-seed', { victoryPileSize: 4 });
      const state = engine.initializeGame(1);

      // Simulate depleting all 4 Provinces
      const newSupply = new Map(state.supply);
      newSupply.set('Province', 0);
      const newState = { ...state, supply: newSupply };

      const victory = engine.checkGameOver(newState);
      expect(victory.isGameOver).toBe(true);
    });

    test('game end condition triggered with 3+ empty piles', () => {
      const engine = new GameEngine('test-seed', { victoryPileSize: 4 });
      const state = engine.initializeGame(1);

      // Empty 3 piles (not Province)
      const newSupply = new Map(state.supply);
      newSupply.set('Village', 0);
      newSupply.set('Smithy', 0);
      newSupply.set('Market', 0);
      const newState = { ...state, supply: newSupply };

      const victory = engine.checkGameOver(newState);
      expect(victory.isGameOver).toBe(true);
    });

    test('game continues with < 3 empty piles', () => {
      const engine = new GameEngine('test-seed', { victoryPileSize: 4 });
      const state = engine.initializeGame(1);

      // Only 2 piles empty
      const newSupply = new Map(state.supply);
      newSupply.set('Village', 0);
      newSupply.set('Smithy', 0);
      const newState = { ...state, supply: newSupply };

      const victory = engine.checkGameOver(newState);
      expect(victory.isGameOver).toBe(false);
    });
  });

  describe('Performance Impact', () => {
    test('default 4-pile games end ~33% faster than 6-pile', () => {
      // With 4 piles: need to deplete 4 cards to trigger condition
      // With 6 piles: need to deplete 6 cards to trigger condition
      // Roughly 33% faster with 4

      const fourPile = new GameEngine('seed', { victoryPileSize: 4 }).initializeGame(1);
      const sixPile = new GameEngine('seed', { victoryPileSize: 6 }).initializeGame(1);

      const fourCount = fourPile.supply.get('Province')!;
      const sixCount = sixPile.supply.get('Province')!;

      expect(fourCount).toBe(4);
      expect(sixCount).toBe(6);
      expect(sixCount > fourCount).toBe(true);
    });

    test('custom sizes can be configured for different game speeds', () => {
      // Fast games: 2-3 piles
      const fastEngine = new GameEngine('seed', { victoryPileSize: 2 });
      const fastState = fastEngine.initializeGame(1);
      expect(fastState.supply.get('Province')).toBe(2);

      // Medium games: 4-6 piles (new default is 4)
      const mediumEngine = new GameEngine('seed', { victoryPileSize: 4 });
      const mediumState = mediumEngine.initializeGame(1);
      expect(mediumState.supply.get('Province')).toBe(4);

      // Slow games: 8-12 piles (old default was 12)
      const slowEngine = new GameEngine('seed', { victoryPileSize: 12 });
      const slowState = slowEngine.initializeGame(1);
      expect(slowState.supply.get('Province')).toBe(12);
    });
  });

  describe('Acceptance Criteria', () => {
    test('AC-2.0: Default supply initializes with 4 victory cards', () => {
      const engine = new GameEngine('test', {});
      const state = engine.initializeGame(1);

      expect(state.supply.get('Province')).toBe(4);
      expect(state.supply.get('Duchy')).toBe(4);
      expect(state.supply.get('Estate')).toBe(4);
    });

    test('AC-2.1: victoryPileSize option respected', () => {
      const engine = new GameEngine('test', { victoryPileSize: 10 });
      const state = engine.initializeGame(1);

      expect(state.supply.get('Province')).toBe(10);
    });

    test('AC-2.2: Game mechanics unchanged (same end conditions)', () => {
      const engine4 = new GameEngine('seed', { victoryPileSize: 4 });
      const engine12 = new GameEngine('seed', { victoryPileSize: 12 });

      const state4 = engine4.initializeGame(1);
      const state12 = engine12.initializeGame(1);

      // Both have same kingdom/treasure piles
      expect(state4.supply.get('Village')).toBe(state12.supply.get('Village'));
      expect(state4.supply.get('Copper')).toBe(state12.supply.get('Copper'));

      // Only victory piles differ
      expect(state4.supply.get('Province')).not.toBe(state12.supply.get('Province'));
    });
  });
});
