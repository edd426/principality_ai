/**
 * @file Unit tests for shared presentation layer (move-options.ts)
 * @phase 4.2
 * @status RED (implementation doesn't exist yet - TDD approach)
 *
 * These tests validate the shared presentation layer that will be used by both
 * CLI and MCP interfaces to generate interactive card move options.
 */

import { CardName, GameState } from '../src/types';

// NOTE: These imports will fail until implementation is created
// This is EXPECTED and CORRECT in TDD red phase
import {
  MoveOption,
  generateMoveOptions,
  generateCellarOptions,
  generateChapelOptions,
  generateRemodelStep1Options,
  generateRemodelStep2Options,
  generateMineStep1Options,
  generateMineStep2Options,
  generateWorkshopOptions,
  generateFeastOptions,
  generateLibraryOptions,
  generateThroneRoomOptions,
  generateChancellorOptions,
  generateSpyOptions,
  generateBureaucratOptions,
  generateMoneylenderOptions,
  generateMilitiaOptions,
  formatMoveCommand,
  getCombinations,
  formatCardList,
} from '../src/presentation/move-options';

describe('Helper Functions', () => {
  describe('getCombinations', () => {
    // @req: FR-SHARED-4 - Deterministic option generation
    // @assert: Helper function produces all valid combinations
    it('should return empty combination for empty array', () => {
      const result = getCombinations([], 5);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual([]);
    });

    it('should return 2 combinations for single element', () => {
      const result = getCombinations(['A'], 5);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual([]);
      expect(result).toContainEqual(['A']);
    });

    it('should return 8 combinations for 3-element array', () => {
      const result = getCombinations(['A', 'B', 'C'], 3);

      // 2^3 = 8 combinations
      expect(result).toHaveLength(8);
      expect(result).toContainEqual([]);
      expect(result).toContainEqual(['A']);
      expect(result).toContainEqual(['B']);
      expect(result).toContainEqual(['C']);
      expect(result).toContainEqual(['A', 'B']);
      expect(result).toContainEqual(['A', 'C']);
      expect(result).toContainEqual(['B', 'C']);
      expect(result).toContainEqual(['A', 'B', 'C']);
    });

    it('should respect maxSize limit', () => {
      const result = getCombinations(['A', 'B', 'C', 'D'], 2);

      // Should only return combinations with ≤ 2 elements
      expect(result.every(combo => combo.length <= 2)).toBe(true);
      expect(result).not.toContainEqual(['A', 'B', 'C']);
      expect(result).not.toContainEqual(['A', 'B', 'C', 'D']);
    });

    // @req: FR-SHARED-4 - Deterministic option order
    // @assert: Same input produces same output
    it('should produce deterministic results', () => {
      const input = ['X', 'Y', 'Z'];
      const result1 = getCombinations(input, 3);
      const result2 = getCombinations(input, 3);

      expect(result1).toEqual(result2);
    });
  });

  describe('formatMoveCommand', () => {
    // @req: FR-MCP-3 - Move command format
    // @assert: All move types format correctly
    it('should format discard_for_cellar move with cards', () => {
      const move = { type: 'discard_for_cellar' as const, cards: ['Copper', 'Copper'] };
      const command = formatMoveCommand(move);

      expect(command).toBe('discard_for_cellar Copper,Copper');
    });

    it('should format discard_for_cellar with no cards', () => {
      const move = { type: 'discard_for_cellar' as const, cards: [] };
      const command = formatMoveCommand(move);

      expect(command).toBe('discard_for_cellar');
    });

    it('should format trash_cards move', () => {
      const move = { type: 'trash_cards' as const, cards: ['Copper', 'Estate'] };
      const command = formatMoveCommand(move);

      expect(command).toBe('trash_cards Copper,Estate');
    });

    it('should format gain_card move', () => {
      const move = { type: 'gain_card' as const, card: 'Smithy' };
      const command = formatMoveCommand(move);

      expect(command).toBe('gain_card Smithy');
    });

    it('should format select_treasure_to_trash move', () => {
      const move = { type: 'select_treasure_to_trash' as const, card: 'Copper' };
      const command = formatMoveCommand(move);

      expect(command).toBe('select_treasure_to_trash Copper');
    });

    it('should format library_set_aside move', () => {
      const move = { type: 'library_set_aside' as const, cards: ['Village'], choice: true };
      const command = formatMoveCommand(move);

      expect(command).toBe('library_set_aside Village');
    });

    it('should format select_action_for_throne move', () => {
      const move = { type: 'select_action_for_throne' as const, card: 'Village' };
      const command = formatMoveCommand(move);

      expect(command).toBe('select_action_for_throne Village');
    });

    it('should format chancellor_decision move', () => {
      const move = { type: 'chancellor_decision' as const, choice: true };
      const command = formatMoveCommand(move);

      expect(command).toBe('chancellor_decision yes');
    });

    it('should format spy_decision move', () => {
      const move = { type: 'spy_decision' as const, choice: false };
      const command = formatMoveCommand(move);

      expect(command).toBe('spy_decision no');
    });

    it('should format reveal_and_topdeck move', () => {
      const move = { type: 'reveal_and_topdeck' as const, card: 'Estate' };
      const command = formatMoveCommand(move);

      expect(command).toBe('reveal_and_topdeck Estate');
    });

    // @req: Issue #28 - Missing move type formatting tests
    it('should format discard_to_hand_size move with cards', () => {
      const move = { type: 'discard_to_hand_size' as const, cards: ['Copper', 'Estate'] };
      const command = formatMoveCommand(move);

      expect(command).toBe('discard_to_hand_size Copper,Estate');
    });

    it('should format discard_to_hand_size move with no cards', () => {
      const move = { type: 'discard_to_hand_size' as const, cards: [] };
      const command = formatMoveCommand(move);

      expect(command).toBe('discard_to_hand_size');
    });

    it('should format reveal_reaction move', () => {
      const move = { type: 'reveal_reaction' as const, card: 'Moat' };
      const command = formatMoveCommand(move);

      expect(command).toBe('reveal_reaction Moat');
    });

    it('should format gain_trashed_card move', () => {
      const move = { type: 'gain_trashed_card' as const, card: 'Silver' };
      const command = formatMoveCommand(move);

      expect(command).toBe('gain_trashed_card Silver');
    });
  });

  describe('formatCardList', () => {
    it('should format empty list', () => {
      expect(formatCardList([])).toBe('');
    });

    it('should format single card', () => {
      expect(formatCardList(['Copper'])).toBe('Copper');
    });

    it('should format multiple cards with commas', () => {
      expect(formatCardList(['Copper', 'Silver', 'Gold'])).toBe('Copper, Silver, Gold');
    });
  });
});

describe('generateCellarOptions', () => {
  // @req: FR-SHARED-2 - Card-specific generators
  // @assert: Cellar generates all valid discard combinations
  it('should generate all combinations for 3-card hand', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
    const options = generateCellarOptions(hand);

    // 6 UNIQUE combinations (not 8 with duplicates)
    // [], [Copper], [Copper, Copper], [Estate], [Copper, Estate], [Copper, Copper, Estate]
    expect(options).toHaveLength(6);

    // Verify structure of each option
    options.forEach(opt => {
      expect(opt.index).toBeGreaterThan(0);
      expect(opt.move.type).toBe('discard_for_cellar');
      expect(opt.description).toBeTruthy();
      expect(opt.details?.drawCount).toBeTruthy();
      expect(typeof opt.details?.drawCount).toBe('number');
    });
  });

  // @edge: EC-CELLAR-1 - Empty hand
  it('should handle empty hand gracefully', () => {
    const hand: CardName[] = [];
    const options = generateCellarOptions(hand);

    expect(options).toHaveLength(1);
    expect(options[0].move.cards).toEqual([]);
    expect(options[0].description).toContain('nothing');
  });

  it('should generate 2 options for single card', () => {
    const hand: CardName[] = ['Copper'];
    const options = generateCellarOptions(hand);

    expect(options).toHaveLength(2);
    expect(options[0].move.cards).toEqual(['Copper']);
    expect(options[1].move.cards).toEqual([]);
  });

  // @req: FR-SHARED-4 - Deterministic option order
  // @assert: Options sorted by card count descending
  it('should sort options by card count descending', () => {
    const hand: CardName[] = ['Copper', 'Estate'];
    const options = generateCellarOptions(hand);

    // Check descending order
    for (let i = 0; i < options.length - 1; i++) {
      const currentCount = options[i].move.cards?.length || 0;
      const nextCount = options[i + 1].move.cards?.length || 0;
      expect(currentCount).toBeGreaterThanOrEqual(nextCount);
    }
  });

  // @req: FR-SHARED-1 - MoveOption structure
  // @assert: Indices are 1-based and sequential
  it('should have sequential indices starting from 1', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
    const options = generateCellarOptions(hand);

    options.forEach((opt, idx) => {
      expect(opt.index).toBe(idx + 1);
    });
  });

  // @req: FR-SHARED-4 - Deterministic option generation
  // @assert: Same hand produces identical options
  it('should generate consistent options for same hand', () => {
    const hand: CardName[] = ['Silver', 'Gold', 'Estate'];
    const options1 = generateCellarOptions(hand);
    const options2 = generateCellarOptions(hand);

    expect(options1).toEqual(options2);
  });

  it('should include draw count in details', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
    const options = generateCellarOptions(hand);

    // Find option that discards all 3 cards
    const discardAllOption = options.find(opt => opt.move.cards?.length === 3);
    expect(discardAllOption?.details.drawCount).toBe(3);

    // Find option that discards nothing
    const discardNoneOption = options.find(opt => opt.move.cards?.length === 0);
    expect(discardNoneOption?.details.drawCount).toBe(0);
  });

  it('should include cards in cardNames field', () => {
    const hand: CardName[] = ['Copper', 'Silver'];
    const options = generateCellarOptions(hand);

    options.forEach(opt => {
      expect(opt.cardNames).toEqual(opt.move.cards);
    });
  });
});

describe('generateChapelOptions', () => {
  // @req: FR-SHARED-2 - Card-specific generators
  // @assert: Chapel generates combinations up to maxTrash limit
  it('should generate combinations up to maxTrash limit', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate', 'Curse', 'Silver'];
    const options = generateChapelOptions(hand, 4);

    // Should not include combinations with > 4 cards
    expect(options.every(opt => (opt.move.cards?.length || 0) <= 4)).toBe(true);

    // Should include "trash nothing" option
    expect(options.some(opt => (opt.move.cards?.length || 0) === 0)).toBe(true);
  });

  // @edge: EC-CHAPEL-1 - Hand smaller than maxTrash
  it('should generate all combinations when hand < maxTrash', () => {
    const hand: CardName[] = ['Copper', 'Estate'];
    const options = generateChapelOptions(hand, 4);

    // 2^2 = 4 combinations (hand only has 2 cards)
    expect(options).toHaveLength(4);
  });

  it('should handle empty hand', () => {
    const hand: CardName[] = [];
    const options = generateChapelOptions(hand, 4);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('nothing');
  });

  it('should sort by trash count descending', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
    const options = generateChapelOptions(hand, 4);

    for (let i = 0; i < options.length - 1; i++) {
      const currentCount = options[i].move.cards?.length || 0;
      const nextCount = options[i + 1].move.cards?.length || 0;
      expect(currentCount).toBeGreaterThanOrEqual(nextCount);
    }
  });

  it('should include trashCount in details', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
    const options = generateChapelOptions(hand, 4);

    const trashAllOption = options.find(opt => opt.move.cards?.length === 3);
    expect(trashAllOption?.details.trashCount).toBe(3);
  });
});

describe('generateRemodelStep1Options', () => {
  // @req: FR-SHARED-2 - Multi-step card generators
  // @assert: Remodel Step 1 generates trash options for each card
  it('should generate trash options for each card in hand', () => {
    const hand: CardName[] = ['Estate', 'Copper', 'Silver'];
    const options = generateRemodelStep1Options(hand);

    expect(options).toHaveLength(3);

    // Verify each card has correct gain cost calculation (+2)
    const estateOption = options.find(opt => opt.cardNames?.[0] === 'Estate');
    expect(estateOption?.details.trashCost).toBe(2);
    expect(estateOption?.details.maxGainCost).toBe(4); // 2 + 2

    const copperOption = options.find(opt => opt.cardNames?.[0] === 'Copper');
    expect(copperOption?.details.trashCost).toBe(0);
    expect(copperOption?.details.maxGainCost).toBe(2); // 0 + 2
  });

  // @edge: EC-REMODEL-1 - Empty hand
  it('should handle empty hand gracefully', () => {
    const hand: CardName[] = [];
    const options = generateRemodelStep1Options(hand);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('No cards');
  });

  it('should include move type trash_for_remodel', () => {
    const hand: CardName[] = ['Estate'];
    const options = generateRemodelStep1Options(hand);

    expect(options[0].move.type).toBe('select_treasure_to_trash'); // Actually should be a specific remodel type
  });

  it('should include maxGainCost in description', () => {
    const hand: CardName[] = ['Estate'];
    const options = generateRemodelStep1Options(hand);

    expect(options[0].description).toContain('$4'); // Can gain up to $4
  });
});

describe('generateRemodelStep2Options', () => {
  // @req: FR-SHARED-2 - Multi-step card generators
  // @assert: Remodel Step 2 generates gain options up to maxCost
  it('should generate gain options up to maxCost', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 46],
      ['Silver', 40],
      ['Village', 10],
      ['Smithy', 10],
      ['Gold', 30],
      ['Province', 12]
    ]);
    const options = generateRemodelStep2Options(4, supply);

    // Should include Smithy ($4), Village ($3), Silver ($3), Copper ($0)
    // Should NOT include Gold ($6), Province ($8)
    expect(options.some(opt => opt.cardNames?.[0] === 'Smithy')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Gold')).toBe(false);
    expect(options.some(opt => opt.cardNames?.[0] === 'Province')).toBe(false);
  });

  // @edge: EC-REMODEL-1 - Empty supply
  it('should handle empty supply gracefully', () => {
    const supply = new Map<CardName, number>();
    const options = generateRemodelStep2Options(4, supply);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('No cards available');
  });

  it('should sort options by cost ascending', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 46],      // $0
      ['Silver', 40],      // $3
      ['Smithy', 10]       // $4
    ]);
    const options = generateRemodelStep2Options(4, supply);

    // Check ascending cost order (consistent with rest of game)
    for (let i = 0; i < options.length - 1; i++) {
      expect(options[i].details.gainCost).toBeLessThanOrEqual(options[i + 1].details.gainCost);
    }
  });

  it('should exclude cards with 0 quantity', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 0],       // Sold out
      ['Silver', 40],
      ['Smithy', 0]        // Sold out
    ]);
    const options = generateRemodelStep2Options(4, supply);

    expect(options.some(opt => opt.cardNames?.[0] === 'Copper')).toBe(false);
    expect(options.some(opt => opt.cardNames?.[0] === 'Smithy')).toBe(false);
    expect(options.some(opt => opt.cardNames?.[0] === 'Silver')).toBe(true);
  });
});

describe('generateMineStep1Options', () => {
  // @req: FR-SHARED-2 - Multi-step card generators
  // @assert: Mine Step 1 only shows treasures
  it('should generate options only for treasures', () => {
    const hand: CardName[] = ['Copper', 'Silver', 'Estate', 'Village'];
    const options = generateMineStep1Options(hand);

    expect(options).toHaveLength(2); // Only Copper and Silver
    // This test assumes we can check if card is treasure - may need helper
  });

  // @edge: EC-MINE-1 - No treasures in hand
  it('should handle no treasures gracefully', () => {
    const hand: CardName[] = ['Estate', 'Village'];
    const options = generateMineStep1Options(hand);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('No treasures');
  });

  it('should include move type for treasure trashing', () => {
    const hand: CardName[] = ['Copper'];
    const options = generateMineStep1Options(hand);

    expect(options[0].move.type).toBe('select_treasure_to_trash');
  });
});

describe('generateMineStep2Options', () => {
  // @req: FR-SHARED-2 - Multi-step card generators
  // @assert: Mine Step 2 only shows treasures
  it('should only include treasures', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 46],
      ['Silver', 40],
      ['Gold', 30],
      ['Village', 10] // Not a treasure
    ]);
    const options = generateMineStep2Options(6, supply);

    // Should include Copper, Silver, Gold
    // Should NOT include Village
    expect(options.some(opt => opt.cardNames?.[0] === 'Village')).toBe(false);
  });

  it('should respect maxCost limit', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 46],   // $0
      ['Silver', 40],   // $3
      ['Gold', 30]      // $6
    ]);
    const options = generateMineStep2Options(5, supply);

    // Should include Copper and Silver, NOT Gold
    expect(options.some(opt => opt.cardNames?.[0] === 'Gold')).toBe(false);
  });

  it('should include destination: hand in move details', () => {
    const supply = new Map<CardName, number>([
      ['Silver', 40]
    ]);
    const options = generateMineStep2Options(5, supply);

    expect(options[0].move.destination).toBe('hand');
  });
});

describe('generateWorkshopOptions', () => {
  // @req: FR-SHARED-2 - Card-specific generators
  // @assert: Workshop shows cards up to $4
  it('should generate options for cards up to $4', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 46],     // $0
      ['Estate', 8],      // $2
      ['Silver', 40],     // $3
      ['Smithy', 10],     // $4
      ['Laboratory', 10], // $5
      ['Gold', 30]        // $6
    ]);
    const options = generateWorkshopOptions(supply, 4);

    expect(options.some(opt => opt.cardNames?.[0] === 'Smithy')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Laboratory')).toBe(false);
  });

  // @edge: EC-WORKSHOP-1 - Empty supply
  it('should handle empty supply gracefully', () => {
    const supply = new Map<CardName, number>();
    const options = generateWorkshopOptions(supply, 4);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('No cards available');
  });

  it('should exclude cards with 0 quantity', () => {
    const supply = new Map<CardName, number>([
      ['Smithy', 0],    // Sold out
      ['Village', 10]
    ]);
    const options = generateWorkshopOptions(supply, 4);

    expect(options.some(opt => opt.cardNames?.[0] === 'Smithy')).toBe(false);
  });
});

describe('generateFeastOptions', () => {
  // @req: FR-SHARED-2 - Card-specific generators
  // @assert: Feast shows cards up to $5
  it('should generate options for cards up to $5', () => {
    const supply = new Map<CardName, number>([
      ['Smithy', 10],     // $4
      ['Laboratory', 10], // $5
      ['Gold', 30]        // $6
    ]);
    const options = generateFeastOptions(supply, 5);

    expect(options.some(opt => opt.cardNames?.[0] === 'Laboratory')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Gold')).toBe(false);
  });

  it('should handle empty supply gracefully', () => {
    const supply = new Map<CardName, number>();
    const options = generateFeastOptions(supply, 5);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('No cards available');
  });
});

describe('generateLibraryOptions', () => {
  // @req: FR-SHARED-2 - Iterative card generators
  // @assert: Library provides binary choice for action cards
  it('should generate 2 options for action card', () => {
    const options = generateLibraryOptions('Village');

    expect(options).toHaveLength(2);
    expect(options[0].details.action).toBe('set_aside');
    expect(options[1].details.action).toBe('keep');
  });

  it('should include card name in descriptions', () => {
    const options = generateLibraryOptions('Smithy');

    expect(options[0].description).toContain('Smithy');
    expect(options[1].description).toContain('Smithy');
  });

  it('should use library_set_aside move type', () => {
    const options = generateLibraryOptions('Village');

    expect(options[0].move.type).toBe('library_set_aside');
    expect(options[1].move.type).toBe('library_set_aside');
  });

  it('should have choice boolean in move', () => {
    const options = generateLibraryOptions('Village');

    expect(options[0].move.choice).toBe(true);  // Set aside
    expect(options[1].move.choice).toBe(false); // Keep
  });
});

describe('generateThroneRoomOptions', () => {
  // @req: FR-SHARED-2 - Card-specific generators
  // @assert: Throne Room shows action cards + skip option
  it('should generate options for action cards + skip', () => {
    const hand: CardName[] = ['Village', 'Smithy', 'Copper', 'Estate'];
    const options = generateThroneRoomOptions(hand);

    // Should have Village, Smithy, and Skip options
    expect(options).toHaveLength(3);
    expect(options.some(opt => opt.cardNames?.[0] === 'Village')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Smithy')).toBe(true);
    expect(options.some(opt => opt.details?.action === 'skip')).toBe(true);
  });

  // @edge: EC-THRONE-1 - No actions in hand
  it('should handle no actions gracefully', () => {
    const hand: CardName[] = ['Copper', 'Estate'];
    const options = generateThroneRoomOptions(hand);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('no action');
  });

  it('should not include non-action cards', () => {
    const hand: CardName[] = ['Village', 'Copper', 'Silver', 'Estate'];
    const options = generateThroneRoomOptions(hand);

    expect(options.some(opt => opt.cardNames?.[0] === 'Copper')).toBe(false);
    expect(options.some(opt => opt.cardNames?.[0] === 'Estate')).toBe(false);
  });

  it('should use select_action_for_throne move type', () => {
    const hand: CardName[] = ['Village'];
    const options = generateThroneRoomOptions(hand);

    expect(options[0].move.type).toBe('select_action_for_throne');
  });

  it('should describe doubled effect in description', () => {
    const hand: CardName[] = ['Village'];
    const options = generateThroneRoomOptions(hand);

    expect(options[0].description).toContain('twice');
  });
});

describe('generateChancellorOptions', () => {
  // @req: FR-SHARED-2 - Card-specific generators
  // @assert: Chancellor provides binary deck choice
  it('should generate 2 options for deck decision', () => {
    const options = generateChancellorOptions(5);

    expect(options).toHaveLength(2);
    expect(options[0].details.action).toBe('move_to_discard');
    expect(options[1].details.action).toBe('keep_deck');
  });

  it('should include deck size in description', () => {
    const options = generateChancellorOptions(7);

    expect(options[0].description).toContain('7');
  });

  it('should handle empty deck', () => {
    const options = generateChancellorOptions(0);

    expect(options).toHaveLength(2);
    expect(options[0].description).toContain('0');
  });

  it('should use chancellor_decision move type', () => {
    const options = generateChancellorOptions(5);

    expect(options[0].move.type).toBe('chancellor_decision');
    expect(options[1].move.type).toBe('chancellor_decision');
  });

  it('should have choice boolean in move', () => {
    const options = generateChancellorOptions(5);

    expect(options[0].move.choice).toBe(true);  // Move to discard
    expect(options[1].move.choice).toBe(false); // Keep deck
  });
});

describe('generateSpyOptions', () => {
  // @req: FR-SHARED-2 - Iterative card generators
  // @assert: Spy provides binary choice per revealed card
  it('should generate 2 options for revealed card', () => {
    const options = generateSpyOptions('Copper', 1);

    expect(options).toHaveLength(2);
    expect(options[0].details.action).toBe('discard');
    expect(options[1].details.action).toBe('keep');
  });

  it('should include card name in descriptions', () => {
    const options = generateSpyOptions('Province', 0);

    expect(options[0].description).toContain('Province');
    expect(options[1].description).toContain('Province');
  });

  it('should include player index in details', () => {
    const options = generateSpyOptions('Copper', 1);

    expect(options[0].details.player).toBe(1);
    expect(options[1].details.player).toBe(1);
  });

  it('should use spy_decision move type', () => {
    const options = generateSpyOptions('Copper', 0);

    expect(options[0].move.type).toBe('spy_decision');
    expect(options[1].move.type).toBe('spy_decision');
  });

  it('should have choice boolean in move', () => {
    const options = generateSpyOptions('Copper', 0);

    expect(options[0].move.choice).toBe(true);  // Discard
    expect(options[1].move.choice).toBe(false); // Keep
  });
});

describe('generateBureaucratOptions', () => {
  // @req: FR-SHARED-2 - Iterative card generators
  // @assert: Bureaucrat shows victory cards to topdeck
  it('should generate options for victory cards', () => {
    const hand: CardName[] = ['Estate', 'Duchy', 'Copper'];
    const options = generateBureaucratOptions(hand);

    // Should have Estate and Duchy options
    expect(options).toHaveLength(2);
    expect(options.some(opt => opt.cardNames?.[0] === 'Estate')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Duchy')).toBe(true);
  });

  // @edge: EC-BUREAUCRAT-1 - No victory cards
  it('should handle no victory cards gracefully', () => {
    const hand: CardName[] = ['Copper', 'Village'];
    const options = generateBureaucratOptions(hand);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('Reveal hand');
  });

  it('should not include non-victory cards', () => {
    const hand: CardName[] = ['Estate', 'Copper', 'Village'];
    const options = generateBureaucratOptions(hand);

    expect(options.some(opt => opt.cardNames?.[0] === 'Copper')).toBe(false);
    expect(options.some(opt => opt.cardNames?.[0] === 'Village')).toBe(false);
  });

  it('should use reveal_and_topdeck move type', () => {
    const hand: CardName[] = ['Estate'];
    const options = generateBureaucratOptions(hand);

    expect(options[0].move.type).toBe('reveal_and_topdeck');
  });
});

// @req: Issue #28 - Missing generator tests
describe('generateMoneylenderOptions', () => {
  it('should generate trash and skip options when Copper is in hand', () => {
    const hand: CardName[] = ['Copper', 'Estate', 'Silver'];
    const options = generateMoneylenderOptions(hand);

    expect(options).toHaveLength(2);
    expect(options[0].move.type).toBe('trash_cards');
    expect(options[0].move.cards).toEqual(['Copper']);
    expect(options[0].description).toContain('Trash: Copper');
    expect(options[1].move.cards).toEqual([]);
    expect(options[1].description).toContain('Skip');
  });

  it('should handle no Copper gracefully', () => {
    const hand: CardName[] = ['Estate', 'Silver'];
    const options = generateMoneylenderOptions(hand);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('Skip');
    expect(options[0].description).toContain('no Copper');
  });

  it('should include coin bonus in description', () => {
    const hand: CardName[] = ['Copper'];
    const options = generateMoneylenderOptions(hand);

    expect(options[0].description).toContain('+$3');
  });
});

describe('generateMilitiaOptions', () => {
  it('should generate discard combinations when hand > target size', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate', 'Silver', 'Gold'];
    const options = generateMilitiaOptions(hand, 3);

    // Must discard exactly 2 cards from 5-card hand
    // Number of combinations: C(5,2) accounting for duplicates
    expect(options.length).toBeGreaterThan(0);
    options.forEach(opt => {
      expect(opt.move.type).toBe('discard_to_hand_size');
      expect(opt.move.cards?.length).toBe(2); // Exactly 2 discards
    });
  });

  it('should handle hand already at target size', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
    const options = generateMilitiaOptions(hand, 3);

    expect(options).toHaveLength(1);
    expect(options[0].move.cards).toEqual([]);
    expect(options[0].description).toContain('No discard needed');
  });

  it('should handle hand below target size', () => {
    const hand: CardName[] = ['Copper', 'Estate'];
    const options = generateMilitiaOptions(hand, 3);

    expect(options).toHaveLength(1);
    expect(options[0].move.cards).toEqual([]);
    expect(options[0].description).toContain('No discard needed');
  });

  it('should sort options alphabetically by card names', () => {
    const hand: CardName[] = ['Copper', 'Estate', 'Silver', 'Gold'];
    const options = generateMilitiaOptions(hand, 3);

    // Check that options are sorted
    for (let i = 0; i < options.length - 1; i++) {
      const currentNames = options[i].cardNames?.join(',') || '';
      const nextNames = options[i + 1].cardNames?.join(',') || '';
      expect(currentNames.localeCompare(nextNames)).toBeLessThanOrEqual(0);
    }
  });

  it('should include target size in details', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate', 'Silver'];
    const options = generateMilitiaOptions(hand, 3);

    options.forEach(opt => {
      expect(opt.details.targetSize).toBe(3);
    });
  });
});

describe('generateMoveOptions (Main Dispatcher)', () => {
  // @req: FR-SHARED-3 - Main generator dispatcher
  // @assert: Dispatcher routes to correct generator based on pendingEffect

  // Helper to create minimal game state for testing
  const createTestState = (pendingEffect: any) => ({
    players: [{
      drawPile: [],
      hand: ['Copper', 'Copper', 'Estate'],
      discardPile: [],
      inPlay: [],
      actions: 0,
      buys: 0,
      coins: 0
    }],
    supply: new Map<CardName, number>([
      ['Copper', 46],
      ['Silver', 40],
      ['Gold', 30],
      ['Estate', 8],
      ['Duchy', 8],
      ['Province', 8],
      ['Village', 10],
      ['Smithy', 10]
    ]),
    currentPlayer: 0,
    phase: 'action' as const,
    turnNumber: 1,
    seed: 'test',
    gameLog: [],
    trash: [],
    pendingEffect
  });

  it('should return empty array when no pendingEffect', () => {
    const state = createTestState(undefined);
    const options = generateMoveOptions(state, []);

    expect(options).toEqual([]);
  });

  it('should route to generateCellarOptions for discard_for_cellar', () => {
    const state = createTestState({
      card: 'Cellar',
      effect: 'discard_for_cellar'
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
    expect(options[0].move.type).toBe('discard_for_cellar');
  });

  it('should route to generateChapelOptions for trash_cards', () => {
    const state = createTestState({
      card: 'Chapel',
      effect: 'trash_cards',
      maxTrash: 4
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
    expect(options[0].move.type).toBe('trash_cards');
  });

  it('should route to generateRemodelStep1Options for trash_for_remodel', () => {
    const state = createTestState({
      card: 'Remodel',
      effect: 'trash_for_remodel'
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
  });

  it('should route to generateRemodelStep2Options for gain_card with Remodel', () => {
    const state = createTestState({
      card: 'Remodel',
      effect: 'gain_card',
      maxGainCost: 4
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
    expect(options[0].move.type).toBe('gain_card');
  });

  it('should route to generateMineStep2Options for gain_card with Mine', () => {
    const state = createTestState({
      card: 'Mine',
      effect: 'gain_card',
      maxGainCost: 5,
      destination: 'hand'
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
    expect(options[0].move.type).toBe('gain_card');
    expect(options[0].move.destination).toBe('hand');
  });

  it('should route to generateWorkshopOptions for gain_card with Workshop', () => {
    const state = createTestState({
      card: 'Workshop',
      effect: 'gain_card'
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
  });

  it('should route to generateFeastOptions for gain_card with Feast', () => {
    const state = createTestState({
      card: 'Feast',
      effect: 'gain_card'
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
  });

  it('should handle unknown effect type gracefully', () => {
    const state = createTestState({
      card: 'Unknown',
      effect: 'unknown_effect'
    });
    const options = generateMoveOptions(state, []);

    expect(options).toEqual([]);
  });

  it('should use targetPlayer hand for reveal_and_topdeck (Bureaucrat)', () => {
    // @req: Issue #10 fix - Bureaucrat should use target player's hand, not current player's hand
    // @assert: generateMoveOptions returns options based on targetPlayer's hand
    const state: GameState = {
      players: [
        {
          hand: ['Copper', 'Silver'], // Current player (P0) has no Victory cards
          drawPile: [],
          discardPile: [],
          inPlay: [],
          actions: 0,
          buys: 0,
          coins: 0
        },
        {
          hand: ['Estate', 'Duchy', 'Copper'], // Target player (P1) has Victory cards
          drawPile: [],
          discardPile: [],
          inPlay: [],
          actions: 0,
          buys: 0,
          coins: 0
        }
      ],
      currentPlayer: 0,
      phase: 'action',
      supply: new Map(),
      trash: [],
      turnNumber: 1,
      seed: 'test',
      gameLog: [],
      pendingEffect: {
        card: 'Bureaucrat',
        effect: 'reveal_and_topdeck',
        targetPlayer: 1 // Important: targeting player 1, not current player
      }
    };

    const options = generateMoveOptions(state, []);

    // Should have 2 options: Estate and Duchy (from player 1's hand, not player 0's)
    expect(options.length).toBe(2);
    expect(options[0].description).toBe('Topdeck: Estate');
    expect(options[1].description).toBe('Topdeck: Duchy');
  });

  // @req: Issue #28 - Edge case tests for dispatcher
  it('should route to generateMineStep2Options for gain_treasure effect', () => {
    const state = createTestState({
      card: 'Mine',
      effect: 'gain_treasure',
      maxGainCost: 5
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
    expect(options[0].move.type).toBe('gain_card');
  });

  it('should route to generateMoneylenderOptions for trash_copper effect', () => {
    const state = createTestState({
      card: 'Moneylender',
      effect: 'trash_copper'
    });
    const options = generateMoveOptions(state, []);

    expect(options.length).toBeGreaterThan(0);
    expect(options[0].move.type).toBe('trash_cards');
  });

  it('should route to generateMilitiaOptions for discard_to_hand_size effect', () => {
    const stateWithLargeHand: GameState = {
      players: [
        {
          hand: ['Copper', 'Copper', 'Estate', 'Silver', 'Gold'],
          drawPile: [],
          discardPile: [],
          inPlay: [],
          actions: 0,
          buys: 0,
          coins: 0
        }
      ],
      currentPlayer: 0,
      phase: 'action',
      supply: new Map(),
      trash: [],
      turnNumber: 1,
      seed: 'test',
      gameLog: [],
      pendingEffect: {
        card: 'Militia',
        effect: 'discard_to_hand_size',
        targetPlayer: 0
      }
    };
    const options = generateMoveOptions(stateWithLargeHand, []);

    expect(options.length).toBeGreaterThan(0);
    expect(options[0].move.type).toBe('discard_to_hand_size');
  });

  it('should warn when unknown effect type is encountered', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const state = createTestState({
      card: 'Unknown',
      effect: 'unknown_effect_type'
    });
    const options = generateMoveOptions(state, []);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown effect type: unknown_effect_type')
    );
    expect(options).toEqual([]);

    consoleSpy.mockRestore();
  });

  it('should warn when spy_decision is missing required data', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const state = createTestState({
      card: 'Spy',
      effect: 'spy_decision'
      // Missing revealedCard and targetPlayer
    });
    const options = generateMoveOptions(state, []);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('spy_decision missing required pendingEffect data')
    );
    expect(options).toEqual([]);

    consoleSpy.mockRestore();
  });
});

// Performance Tests
describe('Performance Requirements', () => {
  // @req: AC-PERF-1 - Generator performance < 50ms
  // @assert: Worst-case generation completes quickly
  it('should generate Cellar options in < 50ms (5-card hand)', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate', 'Silver', 'Gold'];

    const startTime = performance.now();
    const options = generateCellarOptions(hand);
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(50);
    // 24 UNIQUE combinations (not 32 with duplicates)
    // 2 Coppers (0,1,2) × 1 Estate (0,1) × 1 Silver (0,1) × 1 Gold (0,1) = 3×2×2×2 = 24
    expect(options.length).toBe(24);
  });

  it('should generate Chapel options in < 50ms', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate', 'Curse', 'Silver'];

    const startTime = performance.now();
    const options = generateChapelOptions(hand, 4);
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(50);
  });
});
