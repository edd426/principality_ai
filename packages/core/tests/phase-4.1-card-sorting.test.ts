import { CardName } from '../src/types';
import { sortCardsByCostAndName } from '../src/utils';
import { getCard } from '../src/cards';

// @req: FR-SORT-1 - System SHALL sort cards by cost in ascending order
// @req: FR-SORT-2 - Within same cost, system SHALL sort alphabetically
// @req: FR-SORT-3 - Sorting SHALL apply to all card displays (supply, buy, hand, etc.)
// @req: FR-SORT-4 - Basic cards SHALL be included in sort
// @req: FR-SORT-5 - Sorting is display-only, no logic changes
// @edge: Empty arrays | single card | duplicate costs | all same cost | mixed costs
// @why: Makes card navigation easier for players, reduces cognitive load
// @level: unit

describe('Phase 4.1 - Feature 3: Card Sorting Display', () => {

  describe('UT-SORT-1: Should sort by cost ascending', () => {
    // @req: FR-SORT-1 - Primary sort by cost
    // @assert: Lower cost cards appear before higher cost cards
    // @edge: Mixed costs from $0 to $8

    it('should sort cards by cost in ascending order', () => {
      const cards: CardName[] = ['Province', 'Copper', 'Silver', 'Village', 'Gold', 'Estate'];

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual([
        'Copper',   // $0
        'Estate',   // $2
        'Silver',   // $3 (alphabetically before Village)
        'Village',  // $3
        'Gold',     // $6
        'Province'  // $8
      ]);
    });

    it('should place Copper ($0) before all other cards', () => {
      const cards: CardName[] = ['Gold', 'Silver', 'Copper', 'Province'];

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted[0]).toBe('Copper');
    });

    it('should place Province ($8) last among these cards', () => {
      const cards: CardName[] = ['Province', 'Copper', 'Silver', 'Gold'];

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted[sorted.length - 1]).toBe('Province');
    });
  });

  describe('UT-SORT-2: Should sort alphabetically within cost tier', () => {
    // @req: FR-SORT-2 - Secondary sort alphabetically
    // @assert: Same-cost cards sorted A-Z
    // @edge: All $4 cards, all $3 cards, all $5 cards

    it('should sort $4 cards alphabetically', () => {
      const cards: CardName[] = ['Smithy', 'Militia', 'Remodel', 'Bureaucrat', 'Feast'];
      // All cost $4

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual([
        'Bureaucrat',
        'Feast',
        'Militia',
        'Remodel',
        'Smithy'
      ]);
    });

    it('should sort $3 cards alphabetically', () => {
      const cards: CardName[] = ['Woodcutter', 'Village', 'Silver', 'Workshop'];
      // All cost $3

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual([
        'Silver',
        'Village',
        'Woodcutter',
        'Workshop'
      ]);
    });

    it('should sort $5 cards alphabetically', () => {
      const cards: CardName[] = ['Market', 'Laboratory', 'Duchy', 'Festival', 'Mine'];
      // All cost $5

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual([
        'Duchy',
        'Festival',
        'Laboratory',
        'Market',
        'Mine'
      ]);
    });
  });

  describe('UT-SORT-3: Should handle edge cases', () => {
    // @edge: Empty array, single card, all same cost, mixed costs and names
    // @why: Defensive programming and robustness

    it('should handle empty array', () => {
      const cards: CardName[] = [];

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual([]);
    });

    it('should handle single card', () => {
      const cards: CardName[] = ['Village'];

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual(['Village']);
    });

    it('should handle two cards same cost', () => {
      const cards: CardName[] = ['Woodcutter', 'Village']; // Both $3

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual(['Village', 'Woodcutter']); // Alphabetical
    });

    it('should handle two cards different cost', () => {
      const cards: CardName[] = ['Province', 'Copper']; // $8 and $0

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual(['Copper', 'Province']);
    });
  });

  describe('UT-SORT-4: Should sort basic cards properly', () => {
    // @req: FR-SORT-4 - Basic cards included in sort
    // @assert: Copper, Silver, Gold, Estate, Duchy, Province sorted correctly
    // @edge: Basic treasures and victory cards

    it('should sort basic treasures by cost', () => {
      const cards: CardName[] = ['Gold', 'Copper', 'Silver'];

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual([
        'Copper',  // $0
        'Silver',  // $3
        'Gold'     // $6
      ]);
    });

    it('should sort basic victory cards by cost', () => {
      const cards: CardName[] = ['Province', 'Estate', 'Duchy'];

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual([
        'Estate',   // $2
        'Duchy',    // $5
        'Province'  // $8
      ]);
    });

    it('should sort mix of basic treasures and victory cards', () => {
      const cards: CardName[] = ['Province', 'Gold', 'Estate', 'Copper', 'Duchy', 'Silver'];

      const sorted = sortCardsByCostAndName(cards);

      expect(sorted).toEqual([
        'Copper',   // $0
        'Estate',   // $2
        'Silver',   // $3
        'Duchy',    // $5
        'Gold',     // $6
        'Province'  // $8
      ]);
    });
  });

  describe('UT-SORT-5: Should not mutate original array', () => {
    // @req: FR-SORT-5 - Display-only, no side effects
    // @assert: Original array unchanged after sort
    // @why: Functional programming best practice, prevents bugs

    it('should return new array without mutating original', () => {
      const cards: CardName[] = ['Province', 'Copper', 'Silver'];
      const original = [...cards];

      const sorted = sortCardsByCostAndName(cards);

      expect(cards).toEqual(original); // Original unchanged
      expect(sorted).not.toBe(cards); // New array
      expect(sorted).toEqual(['Copper', 'Silver', 'Province']);
    });

    it('should allow multiple sorts without affecting original', () => {
      const cards: CardName[] = ['Gold', 'Copper', 'Silver'];

      const sorted1 = sortCardsByCostAndName(cards);
      const sorted2 = sortCardsByCostAndName(cards);

      expect(cards).toEqual(['Gold', 'Copper', 'Silver']); // Still original order
      expect(sorted1).toEqual(sorted2); // Both sorts identical
    });
  });

  describe('UT-SORT-6: Should complete in < 5ms', () => {
    // @req: NFR-SORT-1 - Performance requirement
    // @assert: Sorting completes in under 5ms for typical card lists
    // @why: Must not impact display rendering performance

    it('should sort typical card list (17 cards) in under 5ms', () => {
      const allCards: CardName[] = [
        'Province', 'Duchy', 'Estate', 'Gold', 'Silver', 'Copper', 'Curse',
        'Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
        'Woodcutter', 'Cellar', 'Chapel', 'Remodel', 'Mine'
      ];

      const startTime = performance.now();
      const sorted = sortCardsByCostAndName(allCards);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5); // milliseconds
      expect(sorted).toHaveLength(17);
    });

    it('should maintain performance over multiple sorts', () => {
      const cards: CardName[] = [
        'Province', 'Duchy', 'Estate', 'Gold', 'Silver', 'Copper',
        'Village', 'Smithy', 'Market', 'Laboratory'
      ];
      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        sortCardsByCostAndName(cards);
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      expect(avgDuration).toBeLessThan(5);
    });
  });

  describe('UT-SORT-7: Complex mixed sorting scenarios', () => {
    // @req: FR-SORT-1, FR-SORT-2 - Combined cost and alphabetical sorting
    // @assert: Complex real-world scenarios work correctly
    // @edge: Multiple cards at each cost level

    it('should sort complete supply with multiple cards per cost', () => {
      const cards: CardName[] = [
        'Province', 'Duchy', 'Estate', 'Curse',
        'Gold', 'Silver', 'Copper',
        'Market', 'Laboratory', 'Festival', 'Mine', 'Duchy',
        'Smithy', 'Remodel', 'Militia', 'Bureaucrat',
        'Village', 'Woodcutter', 'Workshop',
        'Cellar', 'Chapel'
      ];

      const sorted = sortCardsByCostAndName(cards);

      // Verify cost order
      for (let i = 0; i < sorted.length - 1; i++) {
        const costI = getCard(sorted[i]).cost;
        const costNext = getCard(sorted[i + 1]).cost;
        expect(costI).toBeLessThanOrEqual(costNext);
      }

      // Verify alphabetical within same cost
      for (let i = 0; i < sorted.length - 1; i++) {
        const costI = getCard(sorted[i]).cost;
        const costNext = getCard(sorted[i + 1]).cost;
        if (costI === costNext) {
          expect(sorted[i].localeCompare(sorted[i + 1])).toBeLessThanOrEqual(0);
        }
      }
    });

    it('should correctly sort full kingdom set', () => {
      const cards: CardName[] = [
        'Throne Room', 'Spy', 'Bureaucrat', 'Feast', 'Militia',
        'Laboratory', 'Market', 'Mine', 'Festival', 'Witch'
      ];

      const sorted = sortCardsByCostAndName(cards);

      // First card should be lowest cost
      const firstCost = getCard(sorted[0]).cost;
      sorted.forEach(card => {
        expect(getCard(card).cost).toBeGreaterThanOrEqual(firstCost);
      });

      // Last card should be highest cost
      const lastCost = getCard(sorted[sorted.length - 1]).cost;
      sorted.forEach(card => {
        expect(getCard(card).cost).toBeLessThanOrEqual(lastCost);
      });
    });
  });
});
