import { GameEngine, GameState, CardName } from '../../src';
import { getCard } from '../../src/cards';

/**
 * Phase 4.1 - Feature 3: Card Sorting Display
 * Integration Tests
 *
 * @req: FR-SORT-1 through FR-SORT-5 - Card sorting integration with display systems
 * @edge: Supply display | buy options | hand display | consistency across views
 * @why: Validates sorting integrates correctly with game engine and display logic
 * @level: Integration - tests component interactions
 *
 * Coverage: IT-SORT-1 through IT-SORT-3 per TESTING.md
 */

describe('Phase 4.1 - Card Sorting Integration', () => {

  /**
   * Helper: Sort cards by cost and name (function under test)
   * @hint: Implementation will be in display.ts or presentation.ts
   */
  function sortCardsByCostAndName(cards: CardName[]): CardName[] {
    return [...cards].sort((a, b) => {
      const cardA = getCard(a);
      const cardB = getCard(b);

      // Primary sort: cost ascending
      if (cardA.cost !== cardB.cost) {
        return cardA.cost - cardB.cost;
      }

      // Secondary sort: alphabetical
      return a.localeCompare(b);
    });
  }

  /**
   * Helper: Extract card order from formatted output
   */
  function extractCardOrder(output: string): CardName[] {
    // Extract card names from display output
    const lines = output.split('\n');
    const cards: CardName[] = [];

    lines.forEach(line => {
      // Look for patterns like "Copper (x10)", "Province", etc.
      const matches = line.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g);
      if (matches) {
        // Filter to only valid card names
        matches.forEach(match => {
          try {
            getCard(match);
            cards.push(match);
          } catch {
            // Not a valid card, skip it
          }
        });
      }
    });

    return cards;
  }

  /**
   * Mock display functions (will be implemented by dev-agent)
   */
  function displaySupply(state: GameState): string {
    // @hint: Implementation will sort cards and format for display
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

  function displayBuyOptions(state: GameState, availableCoins: number): string {
    const affordableCards = Array.from(state.supply.entries())
      .filter(([_, count]) => count > 0)
      .map(([card, _]) => card)
      .filter(card => getCard(card).cost <= availableCoins);

    const sorted = sortCardsByCostAndName(affordableCards);

    let output = 'Buy Options:\n';
    sorted.forEach((card, index) => {
      const cost = getCard(card).cost;
      output += `[${index + 1}] ${card} ($${cost})\n`;
    });

    return output;
  }

  function displayHand(hand: ReadonlyArray<CardName>): string {
    const sorted = sortCardsByCostAndName(Array.from(hand));

    let output = 'Hand:\n';
    sorted.forEach((card, index) => {
      const cost = getCard(card).cost;
      output += `[${index + 1}] ${card} ($${cost})\n`;
    });

    return output;
  }

  /**
   * IT-SORT-1: Supply command shows sorted cards
   * @req: FR-SORT-3 - Sorting applies to all card displays
   * @assert: Supply display uses cost+alphabetical sorting
   */
  describe('IT-SORT-1: Supply command shows sorted cards', () => {

    it('should display supply in sorted order', () => {
      const engine = new GameEngine('sort-test');
      const state = engine.initializeGame(1);

      const output = displaySupply(state);

      expect(output).toContain('$0:'); // Copper
      expect(output).toContain('$2:'); // Estate
      expect(output).toContain('$3:'); // Silver

      // Verify Copper ($0) appears before Silver ($3)
      const copperIndex = output.indexOf('Copper');
      const silverIndex = output.indexOf('Silver');
      expect(copperIndex).toBeLessThan(silverIndex);
    });

    it('should sort cards alphabetically within cost tier', () => {
      const engine = new GameEngine('alpha-sort-test');
      const state = engine.initializeGame(1);

      const output = displaySupply(state);

      // Find the $4 section
      const lines = output.split('\n');
      const fourDollarLine = lines.find(line => line.startsWith('$4:'));

      if (fourDollarLine) {
        // Extract card names from the line
        const cards = fourDollarLine.split(':')[1].trim().split(', ');

        // Verify alphabetical order
        for (let i = 0; i < cards.length - 1; i++) {
          expect(cards[i].localeCompare(cards[i + 1])).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  /**
   * IT-SORT-2: Buy phase shows sorted options
   * @req: FR-SORT-3 - Buy options sorted by cost
   * @assert: Affordable cards displayed in ascending cost order
   */
  describe('IT-SORT-2: Buy phase shows sorted options', () => {

    it('should display buy options in ascending cost order', () => {
      const engine = new GameEngine('buy-sort-test');
      const state = engine.initializeGame(1);
      const availableCoins = 5;

      const output = displayBuyOptions(state, availableCoins);

      const lines = output.split('\n').filter(line => line.startsWith('['));
      const costs: number[] = [];

      lines.forEach(line => {
        const match = line.match(/\$(\d+)\)/);
        if (match) {
          costs.push(parseInt(match[1], 10));
        }
      });

      // Verify ascending cost order
      for (let i = 0; i < costs.length - 1; i++) {
        expect(costs[i]).toBeLessThanOrEqual(costs[i + 1]);
      }
    });

    it('should not show cards costing more than available coins', () => {
      const engine = new GameEngine('affordable-test');
      const state = engine.initializeGame(1);
      const availableCoins = 4;

      const output = displayBuyOptions(state, availableCoins);

      // Should not contain Duchy ($5) or Province ($8)
      expect(output).not.toContain('Duchy');
      expect(output).not.toContain('Province');

      // Should contain Silver ($3) and cards ≤ $4
      expect(output).toContain('Silver');
    });
  });

  /**
   * IT-SORT-3: All displays consistent
   * @req: FR-SORT-3, AC-SORT-5 - Universal sorting across all displays
   * @assert: Same sorting algorithm used everywhere
   */
  describe('IT-SORT-3: All displays consistent', () => {

    it('should use same sort order in all displays', () => {
      const engine = new GameEngine('consistency-test');
      const state = engine.initializeGame(1);

      const supplyOutput = displaySupply(state);
      const buyOutput = displayBuyOptions(state, 10);

      const supplyCards = extractCardOrder(supplyOutput);
      const buyCards = extractCardOrder(buyOutput);

      // Buy cards should be subset of supply cards in same order
      const buyIndices = buyCards.map(card => supplyCards.indexOf(card));

      // Verify ascending indices (same relative order)
      for (let i = 0; i < buyIndices.length - 1; i++) {
        expect(buyIndices[i]).toBeLessThan(buyIndices[i + 1]);
      }
    });

    it('should maintain sort order throughout game', () => {
      const engine = new GameEngine('persistence-test');
      let state = engine.initializeGame(1);

      const initialOutput = displaySupply(state);
      const initialOrder = extractCardOrder(initialOutput);

      // Play several moves
      for (let i = 0; i < 3; i++) {
        let result = engine.executeMove(state, { type: 'end_phase' });
        if (result.success && result.newState) state = result.newState;

        if (state.phase === 'buy') {
          result = engine.executeMove(state, { type: 'end_phase' });
          if (result.success && result.newState) state = result.newState;
        }

        if (state.phase === 'cleanup') {
          result = engine.executeMove(state, { type: 'end_phase' });
          if (result.success && result.newState) state = result.newState;
        }
      }

      const laterOutput = displaySupply(state);
      const laterOrder = extractCardOrder(laterOutput);

      // Same cards should maintain same relative order
      const commonCards = initialOrder.filter(card => laterOrder.includes(card));
      const initialCommonIndices = commonCards.map(card => initialOrder.indexOf(card));
      const laterCommonIndices = commonCards.map(card => laterOrder.indexOf(card));

      // Relative order should be preserved
      for (let i = 0; i < initialCommonIndices.length - 1; i++) {
        const wasOrdered = initialCommonIndices[i] < initialCommonIndices[i + 1];
        const stillOrdered = laterCommonIndices[i] < laterCommonIndices[i + 1];
        expect(wasOrdered).toBe(stillOrdered);
      }
    });

    it('should sort hand display identically to supply', () => {
      const engine = new GameEngine('hand-sort-test');
      const state = engine.initializeGame(1);

      const hand = state.players[0].hand;
      const handOutput = displayHand(hand);
      const handCards = extractCardOrder(handOutput);

      // Verify hand cards are sorted
      const costs = handCards.map(card => getCard(card).cost);
      for (let i = 0; i < costs.length - 1; i++) {
        expect(costs[i]).toBeLessThanOrEqual(costs[i + 1]);
      }

      // Verify alphabetical within same cost
      for (let i = 0; i < handCards.length - 1; i++) {
        if (getCard(handCards[i]).cost === getCard(handCards[i + 1]).cost) {
          expect(handCards[i].localeCompare(handCards[i + 1])).toBeLessThanOrEqual(0);
        }
      }
    });
  });
});
