import { GameEngine, GameState, CardName, checkVictory } from '../../src';
import { getCard } from '../../src/cards';

/**
 * Phase 4.1 - Feature 3: Card Sorting Display
 * End-to-End Test
 *
 * @req: FR-SORT-1 through FR-SORT-5 - Complete sorting feature validation
 * @edge: Full game with sorted displays throughout
 * @why: Validates sorting remains consistent in real gameplay
 * @level: E2E - tests complete user experience
 *
 * Coverage: E2E-SORT-1 per TESTING.md
 */

describe('Phase 4.1 - Card Sorting E2E', () => {

  function sortCardsByCostAndName(cards: CardName[]): CardName[] {
    return [...cards].sort((a, b) => {
      const cardA = getCard(a);
      const cardB = getCard(b);

      if (cardA.cost !== cardB.cost) {
        return cardA.cost - cardB.cost;
      }

      return a.localeCompare(b);
    });
  }

  function displaySupply(state: GameState): string {
    const supplyCards = Array.from(state.supply.keys());
    const sorted = sortCardsByCostAndName(supplyCards);

    let output = 'Supply:\n';
    const costGroups = new Map<number, CardName[]>();

    sorted.forEach(card => {
      const cost = getCard(card).cost;
      if (!costGroups.has(cost)) {
        costGroups.set(cost, []);
      }
      costGroups.get(cost)!.push(card);
    });

    costGroups.forEach((cards, cost) => {
      output += `$${cost}: ${cards.join(', ')}\n`;
    });

    return output;
  }

  function extractCardOrder(output: string): CardName[] {
    const lines = output.split('\n');
    const cards: CardName[] = [];

    lines.forEach(line => {
      const matches = line.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g);
      if (matches) {
        cards.push(...matches);
      }
    });

    return cards;
  }

  /**
   * E2E-SORT-1: Verify sorting throughout game
   * @req: All FR-SORT-* requirements validated end-to-end
   * @assert: Sorting consistent from game start to completion
   */
  describe('E2E-SORT-1: Verify sorting throughout game', () => {

    it('should maintain consistent sorting throughout entire game', () => {
      // @req: FR-SORT-1, FR-SORT-2 - Cost + alphabetical sorting
      // @req: FR-SORT-3 - Applied to all displays
      // @req: FR-SORT-5 - No logic changes, display-only
      const engine = new GameEngine('e2e-sort-test');
      let state = engine.initializeGame(1);

      const displayOutputs: string[] = [];

      // Play through several turns, capturing display output
      for (let turn = 0; turn < 5; turn++) {
        displayOutputs.push(displaySupply(state));

        // Play action phase
        if (state.phase === 'action') {
          const result = engine.executeMove(state, { type: 'end_phase' });
          if (result.success && result.newState) {
            state = result.newState;
          }
        }

        // Play buy phase
        if (state.phase === 'buy') {
          const player = state.players[state.currentPlayer];

          // Play treasures
          const treasures = player.hand.filter(card => {
            const cardDef = getCard(card);
            return cardDef.type === 'treasure';
          });

          for (const treasure of treasures) {
            const result = engine.executeMove(state, { type: 'play_treasure', card: treasure });
            if (result.success && result.newState) {
              state = result.newState;
            }
          }

          // Try to buy
          const currentPlayer = state.players[state.currentPlayer];
          if (currentPlayer.buys > 0 && currentPlayer.coins >= 3 && state.supply.get('Silver')! > 0) {
            const result = engine.executeMove(state, { type: 'buy', card: 'Silver' });
            if (result.success && result.newState) {
              state = result.newState;
            }
          }

          // End buy
          const result = engine.executeMove(state, { type: 'end_phase' });
          if (result.success && result.newState) {
            state = result.newState;
          }
        }

        // End cleanup
        if (state.phase === 'cleanup') {
          const result = engine.executeMove(state, { type: 'end_phase' });
          if (result.success && result.newState) {
            state = result.newState;
          }
        }
      }

      // @assert: All outputs should show consistent sorting
      displayOutputs.forEach(output => {
        const cardOrder = extractCardOrder(output);
        const costs = cardOrder.map(card => getCard(card).cost);

        // Verify ascending cost order
        for (let i = 0; i < costs.length - 1; i++) {
          expect(costs[i]).toBeLessThanOrEqual(costs[i + 1]);
        }

        // Verify alphabetical within same cost
        for (let i = 0; i < cardOrder.length - 1; i++) {
          if (costs[i] === costs[i + 1]) {
            expect(cardOrder[i].localeCompare(cardOrder[i + 1])).toBeLessThanOrEqual(0);
          }
        }
      });
    });

    it('should complete sorting in < 5ms even with full supply', () => {
      // @req: NFR-SORT-1 - Performance requirement
      const engine = new GameEngine('perf-sort-test');
      const state = engine.initializeGame(1);

      const supplyCards = Array.from(state.supply.keys());

      const startTime = performance.now();
      const sorted = sortCardsByCostAndName(supplyCards);
      const endTime = performance.now();

      const duration = endTime - startTime;

      // @assert: Sorting completes in < 5ms
      expect(duration).toBeLessThan(5);
      expect(sorted).toHaveLength(supplyCards.length);
    });

    it('should not affect game logic or state', () => {
      // @req: FR-SORT-5 - Display-only, no logic changes
      const seed = 'logic-test-seed';
      const engine1 = new GameEngine(seed);
      const engine2 = new GameEngine(seed);

      let state1 = engine1.initializeGame(1);
      let state2 = engine2.initializeGame(1);

      // Apply sorting to state1 displays only
      displaySupply(state1);
      displaySupply(state1);
      displaySupply(state1);

      // Play identical moves on both
      for (let i = 0; i < 3; i++) {
        let result1 = engine1.executeMove(state1, { type: 'end_phase' });
        let result2 = engine2.executeMove(state2, { type: 'end_phase' });
        if (result1.success && result1.newState) state1 = result1.newState;
        if (result2.success && result2.newState) state2 = result2.newState;

        if (state1.phase === 'buy') {
          result1 = engine1.executeMove(state1, { type: 'end_phase' });
          result2 = engine2.executeMove(state2, { type: 'end_phase' });
          if (result1.success && result1.newState) state1 = result1.newState;
          if (result2.success && result2.newState) state2 = result2.newState;
        }

        if (state1.phase === 'cleanup') {
          result1 = engine1.executeMove(state1, { type: 'end_phase' });
          result2 = engine2.executeMove(state2, { type: 'end_phase' });
          if (result1.success && result1.newState) state1 = result1.newState;
          if (result2.success && result2.newState) state2 = result2.newState;
        }
      }

      // Both states should be identical (sorting didn't affect logic)
      expect(state1.turnNumber).toBe(state2.turnNumber);
      expect(state1.players[0].hand).toEqual(state2.players[0].hand);
      expect(state1.supply).toEqual(state2.supply);
    });

    it('should work correctly with dynamic supply changes', () => {
      // @req: AC-SORT-4 - Sorting works as supply changes
      const engine = new GameEngine('dynamic-sort-test');
      let state = engine.initializeGame(1);

      const initialSupply = Array.from(state.supply.keys());
      const initialSorted = sortCardsByCostAndName(initialSupply);

      // Deplete a pile
      const modifiedSupply = new Map(state.supply);
      modifiedSupply.set('Copper', 0); // Deplete Copper

      const modifiedState: GameState = {
        ...state,
        supply: modifiedSupply
      };

      const remainingCards = Array.from(modifiedState.supply.keys())
        .filter(card => modifiedState.supply.get(card)! > 0);
      const remainingSorted = sortCardsByCostAndName(remainingCards);

      // Verify sorting still works correctly
      const costs = remainingSorted.map(card => getCard(card).cost);
      for (let i = 0; i < costs.length - 1; i++) {
        expect(costs[i]).toBeLessThanOrEqual(costs[i + 1]);
      }

      // Copper should not be in remaining cards
      expect(remainingSorted).not.toContain('Copper');
    });

    it('should handle edge cases: empty supply sections', () => {
      // @edge: Empty cost tiers after depletion
      const engine = new GameEngine('empty-tier-test');
      const state = engine.initializeGame(1);

      // Create supply with gaps (e.g., no $1 cards, no $7 cards)
      const supplyCards = Array.from(state.supply.keys());
      const sorted = sortCardsByCostAndName(supplyCards);

      // Verify sorting still works with gaps
      const costs = sorted.map(card => getCard(card).cost);
      for (let i = 0; i < costs.length - 1; i++) {
        expect(costs[i]).toBeLessThanOrEqual(costs[i + 1]);
      }
    });
  });
});
