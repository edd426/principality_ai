/**
 * Presentation Layer Tests
 *
 * Comprehensive tests for all presentation layer functions:
 * - formatters.ts: State/hand/supply formatting, VP calculation, game-over detection
 * - move-parser.ts: Unified move parsing (string → Move object)
 * - move-descriptions.ts: Move → human-readable descriptions
 * - error-messages.ts: Error analysis and suggestion generation
 *
 * @req: PRESENTATION-LAYER - All presentation functions tested
 * @edge: Multi-word cards, case sensitivity, whitespace, empty piles, all phases
 * @why: Centralized presentation layer must be thoroughly tested for CLI/MCP consistency
 */

import {
  // Formatters
  groupHand,
  formatHand,
  formatSupply,
  formatValidMoves,
  calculateVictoryPoints,
  isGameOver,
  countEmptyPiles,
  getGameOverReason,
  groupSupplyByType,
  // Move Parser
  parseMove,
  isMoveValid,
  getCardCost,
  // Move Descriptions
  getMoveDescription,
  getMoveDescriptionCompact,
  getMoveCommand,
  getMoveExamples,
  getNextPhaseName,
  // Error Messages
  analyzeRejectionReason,
  generateSuggestion,
  // Types
  type FormattedCard,
  type GroupedHand,
  type SupplyPile,
  type FormattedMove,
  type DetailLevel,
  type ParseMoveResult,
  type RejectionReason
} from '../src/presentation';

import { GameState, PlayerState, Move, CardName } from '../src/types';

// ============================================================================
// FORMATTERS TESTS
// ============================================================================

describe('Presentation Layer: Formatters', () => {

  // Helper to create minimal game state for testing
  const createTestState = (overrides?: Partial<GameState>): GameState => ({
    players: [{
      hand: ['Copper', 'Copper', 'Estate', 'Silver', 'Village'],
      drawPile: ['Gold'],
      discardPile: ['Duchy'],
      inPlay: [],
      actions: 1,
      buys: 1,
      coins: 0
    }],
    currentPlayer: 0,
    phase: 'action',
    turnNumber: 1,
    supply: new Map([
      ['Copper', 60],
      ['Silver', 40],
      ['Gold', 30],
      ['Estate', 12],
      ['Duchy', 12],
      ['Province', 12],
      ['Village', 10],
      ['Smithy', 10],
      ['Market', 10]
    ]),
    seed: 'test-seed',
    gameLog: [],
    trash: [],
    ...overrides
  });

  describe('groupHand()', () => {
    // @req: Group hand cards by name with counts
    // @input: Array of card names
    // @output: Record<string, number> with card counts
    // @assert: Correct counts for each unique card
    // @level: Unit

    test('should group cards by name with correct counts', () => {
      const hand: readonly CardName[] = ['Copper', 'Copper', 'Estate', 'Silver', 'Copper'];
      const grouped = groupHand(hand);

      expect(grouped).toEqual({
        'Copper': 3,
        'Estate': 1,
        'Silver': 1
      });
    });

    test('should handle empty hand', () => {
      const grouped = groupHand([]);
      expect(grouped).toEqual({});
    });

    test('should handle single card', () => {
      const grouped = groupHand(['Gold']);
      expect(grouped).toEqual({ 'Gold': 1 });
    });

    test('should handle all same cards', () => {
      const grouped = groupHand(['Province', 'Province', 'Province']);
      expect(grouped).toEqual({ 'Province': 3 });
    });
  });

  describe('formatHand()', () => {
    // @req: Format hand with indices and card type classification
    // @input: Array of card names
    // @output: Array of FormattedCard with index, name, type
    // @assert: Correct type classification for treasures/victory/action
    // @level: Unit

    test('should format hand with correct indices', () => {
      const hand: readonly CardName[] = ['Copper', 'Silver', 'Estate'];
      const formatted = formatHand(hand);

      expect(formatted).toHaveLength(3);
      expect(formatted[0]).toEqual({ index: 0, name: 'Copper', type: 'treasure' });
      expect(formatted[1]).toEqual({ index: 1, name: 'Silver', type: 'treasure' });
      expect(formatted[2]).toEqual({ index: 2, name: 'Estate', type: 'victory' });
    });

    test('should classify treasure cards correctly', () => {
      const hand: readonly CardName[] = ['Copper', 'Silver', 'Gold'];
      const formatted = formatHand(hand);

      formatted.forEach(card => {
        expect(card.type).toBe('treasure');
      });
    });

    test('should classify victory cards correctly', () => {
      const hand: readonly CardName[] = ['Estate', 'Duchy', 'Province'];
      const formatted = formatHand(hand);

      formatted.forEach(card => {
        expect(card.type).toBe('victory');
      });
    });

    test('should classify action cards correctly', () => {
      const hand: readonly CardName[] = ['Village', 'Smithy', 'Market'];
      const formatted = formatHand(hand);

      formatted.forEach(card => {
        expect(card.type).toBe('action');
      });
    });

    test('should handle empty hand', () => {
      const formatted = formatHand([]);
      expect(formatted).toEqual([]);
    });

    test('should handle mixed card types', () => {
      const hand: readonly CardName[] = ['Village', 'Copper', 'Estate', 'Gold'];
      const formatted = formatHand(hand);

      expect(formatted[0].type).toBe('action');
      expect(formatted[1].type).toBe('treasure');
      expect(formatted[2].type).toBe('victory');
      expect(formatted[3].type).toBe('treasure');
    });

    test('should handle unknown cards gracefully', () => {
      const hand: readonly CardName[] = ['UnknownCard'];
      const formatted = formatHand(hand);

      expect(formatted[0]).toEqual({
        index: 0,
        name: 'UnknownCard',
        type: 'unknown'
      });
    });

    test('should use fallback classification for unknown cards', () => {
      // Cards that exist in getCard() should use card definition
      const hand1: readonly CardName[] = ['Council Room'];
      const formatted1 = formatHand(hand1);
      expect(formatted1[0].type).toBe('action');
    });
  });

  describe('formatSupply()', () => {
    // @req: Format supply piles with card costs
    // @input: GameState with supply Map
    // @output: Array of SupplyPile with name, remaining, cost
    // @assert: All supply piles formatted with correct costs
    // @level: Unit

    test('should format supply with correct costs', () => {
      const state = createTestState();
      const supply = formatSupply(state);

      expect(supply.length).toBeGreaterThan(0);

      const copper = supply.find(p => p.name === 'Copper');
      expect(copper).toEqual({ name: 'Copper', remaining: 60, cost: 0 });

      const village = supply.find(p => p.name === 'Village');
      expect(village).toEqual({ name: 'Village', remaining: 10, cost: 3 });

      const province = supply.find(p => p.name === 'Province');
      expect(province).toEqual({ name: 'Province', remaining: 12, cost: 8 });
    });

    test('should handle empty supply', () => {
      const state = createTestState({ supply: new Map() });
      const supply = formatSupply(state);
      expect(supply).toEqual([]);
    });

    test('should include all supply piles', () => {
      const state = createTestState();
      const supply = formatSupply(state);
      expect(supply).toHaveLength(9); // 3 treasures + 3 victory + 3 kingdom
    });

    test('should handle unknown cards in supply gracefully', () => {
      const state = createTestState({
        supply: new Map([
          ['Copper', 60],
          ['UnknownCard', 10]
        ])
      });
      const supply = formatSupply(state);

      const copper = supply.find(p => p.name === 'Copper');
      expect(copper).toEqual({ name: 'Copper', remaining: 60, cost: 0 });

      const unknown = supply.find(p => p.name === 'UnknownCard');
      expect(unknown).toEqual({ name: 'UnknownCard', remaining: 10 }); // No cost
    });
  });

  describe('formatValidMoves()', () => {
    // @req: Format valid moves with detail levels (minimal/standard/full)
    // @input: Array of moves, detail level
    // @output: FormattedMove[] with descriptions and commands
    // @assert: Minimal shows type/card only, standard+ shows descriptions
    // @level: Unit

    test('minimal detail level should return type and card only', () => {
      const moves: readonly Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'buy', card: 'Province' },
        { type: 'end_phase' }
      ];

      const formatted = formatValidMoves(moves, 'minimal');

      expect(formatted[0]).toEqual({ type: 'play_action', card: 'Village' });
      expect(formatted[1]).toEqual({ type: 'buy', card: 'Province' });
      expect(formatted[2]).toEqual({ type: 'end_phase', card: undefined });

      // Should NOT have description or command in minimal mode
      expect(formatted[0].description).toBeUndefined();
      expect(formatted[0].command).toBeUndefined();
    });

    test('standard detail level should include descriptions and commands', () => {
      const moves: readonly Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'buy', card: 'Province' }
      ];

      const formatted = formatValidMoves(moves, 'standard');

      expect(formatted[0]).toHaveProperty('description');
      expect(formatted[0]).toHaveProperty('command');
      expect(formatted[0].description).toContain('Play action card: Village');
      expect(formatted[0].command).toBe('play_action Village');

      expect(formatted[1].description).toContain('Buy card: Province');
      expect(formatted[1].command).toBe('buy Province');
    });

    test('full detail level should include descriptions and commands', () => {
      const moves: readonly Move[] = [
        { type: 'play_treasure', card: 'Copper' }
      ];

      const formatted = formatValidMoves(moves, 'full');

      expect(formatted[0].description).toContain('Play treasure card: Copper');
      expect(formatted[0].command).toBe('play_treasure Copper');
    });

    test('should format end_phase move correctly', () => {
      const moves: readonly Move[] = [{ type: 'end_phase' }];
      const formatted = formatValidMoves(moves, 'standard');

      expect(formatted[0].description).toContain('End current phase');
      expect(formatted[0].command).toBe('end');
    });

    test('should handle empty moves array', () => {
      const formatted = formatValidMoves([], 'standard');
      expect(formatted).toEqual([]);
    });
  });

  describe('calculateVictoryPoints()', () => {
    // @req: Calculate VP across all player zones (hand, draw, discard, inPlay)
    // @input: PlayerState with cards in all zones
    // @output: Total victory points (Estate=1, Duchy=3, Province=6)
    // @assert: Counts all zones correctly
    // @level: Unit

    test('should calculate VP from all zones', () => {
      const player: PlayerState = {
        hand: ['Estate', 'Copper'],
        drawPile: ['Duchy', 'Silver'],
        discardPile: ['Province'],
        inPlay: ['Estate', 'Gold'],
        actions: 0,
        buys: 0,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(11); // Estate(1) + Duchy(3) + Province(6) + Estate(1) = 11
    });

    test('should return 0 for no victory cards', () => {
      const player: PlayerState = {
        hand: ['Copper', 'Silver'],
        drawPile: ['Gold'],
        discardPile: [],
        inPlay: ['Village'],
        actions: 0,
        buys: 0,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(0);
    });

    test('should handle only Estates', () => {
      const player: PlayerState = {
        hand: ['Estate', 'Estate'],
        drawPile: ['Estate'],
        discardPile: [],
        inPlay: [],
        actions: 0,
        buys: 0,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(3); // 3 Estates = 3 VP
    });

    test('should handle only Duchies', () => {
      const player: PlayerState = {
        hand: ['Duchy'],
        drawPile: ['Duchy'],
        discardPile: [],
        inPlay: [],
        actions: 0,
        buys: 0,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(6); // 2 Duchies = 6 VP
    });

    test('should handle only Provinces', () => {
      const player: PlayerState = {
        hand: ['Province'],
        drawPile: [],
        discardPile: ['Province'],
        inPlay: [],
        actions: 0,
        buys: 0,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(12); // 2 Provinces = 12 VP
    });

    test('should count cards in inPlay zone', () => {
      const player: PlayerState = {
        hand: [],
        drawPile: [],
        discardPile: [],
        inPlay: ['Province', 'Duchy', 'Estate'],
        actions: 0,
        buys: 0,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(10); // Province(6) + Duchy(3) + Estate(1) = 10
    });
  });

  describe('isGameOver()', () => {
    // @req: Detect game over when Province empty OR 3+ piles empty
    // @input: GameState with supply
    // @output: Boolean indicating game over
    // @assert: Correct detection for both end conditions
    // @level: Unit

    test('should return true when Province pile is empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 0],
          ['Copper', 60],
          ['Silver', 40]
        ])
      });

      expect(isGameOver(state)).toBe(true);
    });

    test('should return true when 3 piles are empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 0],
          ['Silver', 0],
          ['Gold', 0],
          ['Estate', 12]
        ])
      });

      expect(isGameOver(state)).toBe(true);
    });

    test('should return false when Province not empty and < 3 piles empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 60],
          ['Silver', 0],
          ['Gold', 30]
        ])
      });

      expect(isGameOver(state)).toBe(false);
    });

    test('should return false when exactly 2 piles empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 0],
          ['Silver', 0],
          ['Gold', 30]
        ])
      });

      expect(isGameOver(state)).toBe(false);
    });

    test('should return true when exactly 3 piles empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 0],
          ['Silver', 0],
          ['Gold', 0]
        ])
      });

      expect(isGameOver(state)).toBe(true);
    });

    test('should return true when more than 3 piles empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 0],
          ['Silver', 0],
          ['Gold', 0],
          ['Estate', 0]
        ])
      });

      expect(isGameOver(state)).toBe(true);
    });
  });

  describe('countEmptyPiles()', () => {
    // @req: Count number of empty supply piles
    // @input: GameState with supply
    // @output: Number of empty piles
    // @assert: Correct count of piles with quantity = 0
    // @level: Unit

    test('should count empty piles correctly', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 0],
          ['Copper', 0],
          ['Silver', 40],
          ['Gold', 0]
        ])
      });

      expect(countEmptyPiles(state)).toBe(3);
    });

    test('should return 0 when no piles empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 60],
          ['Silver', 40]
        ])
      });

      expect(countEmptyPiles(state)).toBe(0);
    });

    test('should handle all piles empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 0],
          ['Copper', 0],
          ['Silver', 0]
        ])
      });

      expect(countEmptyPiles(state)).toBe(3);
    });

    test('should handle empty supply Map', () => {
      const state = createTestState({ supply: new Map() });
      expect(countEmptyPiles(state)).toBe(0);
    });
  });

  describe('getGameOverReason()', () => {
    // @req: Generate human-readable game over reason
    // @input: GameState with empty piles
    // @output: String explaining why game ended
    // @assert: Correct message for Province empty vs 3-pile condition
    // @level: Unit

    test('should return Province empty message', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 0],
          ['Copper', 60]
        ])
      });

      const reason = getGameOverReason(state);
      expect(reason).toBe('Province pile is empty');
    });

    test('should list empty piles when 3 or more empty', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 0],
          ['Silver', 0],
          ['Gold', 0]
        ])
      });

      const reason = getGameOverReason(state);
      expect(reason).toContain('3 supply piles are empty');
      expect(reason).toContain('Copper');
      expect(reason).toContain('Silver');
      expect(reason).toContain('Gold');
    });

    test('should handle more than 3 empty piles', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 0],
          ['Silver', 0],
          ['Gold', 0],
          ['Estate', 0],
          ['Duchy', 0]
        ])
      });

      const reason = getGameOverReason(state);
      expect(reason).toContain('5 supply piles are empty');
      expect(reason).toContain('and more');
    });

    test('should prioritize Province empty message', () => {
      const state = createTestState({
        supply: new Map([
          ['Province', 0],
          ['Copper', 0],
          ['Silver', 0],
          ['Gold', 0]
        ])
      });

      const reason = getGameOverReason(state);
      expect(reason).toBe('Province pile is empty');
    });

    test('should return unknown game end condition as fallback', () => {
      // Create a state that's not game over but we call getGameOverReason anyway
      const state = createTestState({
        supply: new Map([
          ['Province', 12],
          ['Copper', 60],
          ['Silver', 0], // Only 1 empty
          ['Gold', 30]
        ])
      });

      const reason = getGameOverReason(state);
      expect(reason).toBe('Unknown game end condition');
    });
  });

  describe('groupSupplyByType()', () => {
    // @req: Group supply into treasures, victory, kingdom categories
    // @input: GameState with mixed supply
    // @output: Object with treasures[], victory[], kingdom[] arrays
    // @assert: Correct categorization of all supply piles
    // @level: Unit

    test('should group supply by type correctly', () => {
      const state = createTestState();
      const grouped = groupSupplyByType(state);

      expect(grouped.treasures).toHaveLength(3);
      expect(grouped.victory).toHaveLength(3);
      expect(grouped.kingdom).toHaveLength(3);

      const treasureNames = grouped.treasures.map(p => p.name);
      expect(treasureNames).toContain('Copper');
      expect(treasureNames).toContain('Silver');
      expect(treasureNames).toContain('Gold');

      const victoryNames = grouped.victory.map(p => p.name);
      expect(victoryNames).toContain('Estate');
      expect(victoryNames).toContain('Duchy');
      expect(victoryNames).toContain('Province');

      const kingdomNames = grouped.kingdom.map(p => p.name);
      expect(kingdomNames).toContain('Village');
      expect(kingdomNames).toContain('Smithy');
      expect(kingdomNames).toContain('Market');
    });

    test('should handle supply with only treasures', () => {
      const state = createTestState({
        supply: new Map([
          ['Copper', 60],
          ['Silver', 40],
          ['Gold', 30]
        ])
      });

      const grouped = groupSupplyByType(state);

      expect(grouped.treasures).toHaveLength(3);
      expect(grouped.victory).toHaveLength(0);
      expect(grouped.kingdom).toHaveLength(0);
    });

    test('should handle empty supply', () => {
      const state = createTestState({ supply: new Map() });
      const grouped = groupSupplyByType(state);

      expect(grouped.treasures).toHaveLength(0);
      expect(grouped.victory).toHaveLength(0);
      expect(grouped.kingdom).toHaveLength(0);
    });

    // @req: GH-100 - Curse should be in its own category, not kingdom
    // @why: Curse is a special card type that deserves separate display treatment
    // @edge: Curse pile should not appear in kingdom cards section
    test('should have curse category separate from kingdom', () => {
      const state = createTestState({
        supply: new Map([
          ['Copper', 60],
          ['Silver', 40],
          ['Gold', 30],
          ['Estate', 12],
          ['Duchy', 12],
          ['Province', 12],
          ['Curse', 10],
          ['Village', 10],
          ['Smithy', 10]
        ])
      });
      const grouped = groupSupplyByType(state) as { treasures: SupplyPile[]; victory: SupplyPile[]; kingdom: SupplyPile[]; curse: SupplyPile[] };

      // Curse should be in its own category
      expect(grouped).toHaveProperty('curse');
      expect(grouped.curse).toHaveLength(1);
      expect(grouped.curse[0].name).toBe('Curse');

      // Curse should NOT be in kingdom category
      const kingdomNames = grouped.kingdom.map(p => p.name);
      expect(kingdomNames).not.toContain('Curse');
    });

    // @req: GH-100 - Curse category should be empty when no Curse in supply
    test('should have empty curse category when no Curse in supply', () => {
      const state = createTestState(); // Default state has no Curse
      const grouped = groupSupplyByType(state) as { treasures: SupplyPile[]; victory: SupplyPile[]; kingdom: SupplyPile[]; curse: SupplyPile[] };

      expect(grouped).toHaveProperty('curse');
      expect(grouped.curse).toHaveLength(0);
    });
  });
});

// ============================================================================
// MOVE PARSER TESTS
// ============================================================================

describe('Presentation Layer: Move Parser', () => {

  const createTestState = (overrides?: Partial<GameState>): GameState => ({
    players: [{
      hand: ['Village', 'Copper', 'Silver', 'Estate', 'Duchy'],
      drawPile: [],
      discardPile: [],
      inPlay: [],
      actions: 1,
      buys: 1,
      coins: 0
    }],
    currentPlayer: 0,
    phase: 'action',
    turnNumber: 1,
    supply: new Map([
      ['Copper', 60],
      ['Province', 12],
      ['Village', 10],
      ['Smithy', 10]
    ]),
    seed: 'test',
    gameLog: [],
    trash: [],
    ...overrides
  });

  describe('parseMove()', () => {
    // @req: Parse all move formats (indexed, named, batch, end)
    // @input: String move command and game state
    // @output: ParseMoveResult with success and Move object
    // @assert: Correct parsing for all supported formats
    // @level: Unit

    test('should parse indexed play command', () => {
      const state = createTestState();
      const result = parseMove('play 0', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'play_action', card: 'Village' });
      expect(result.error).toBeUndefined();
    });

    test('should parse indexed treasure play', () => {
      const state = createTestState();
      const result = parseMove('play 1', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'play_treasure', card: 'Copper' });
    });

    test('should parse play_action named syntax', () => {
      const state = createTestState();
      const result = parseMove('play_action Village', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'play_action', card: 'Village' });
    });

    test('should parse play_treasure named syntax', () => {
      const state = createTestState();
      const result = parseMove('play_treasure Copper', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'play_treasure', card: 'Copper' });
    });

    test('should parse play_treasure all (batch)', () => {
      const state = createTestState();
      const result = parseMove('play_treasure all', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'play_all_treasures' });
    });

    test('should parse buy command', () => {
      const state = createTestState();
      const result = parseMove('buy Province', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'buy', card: 'Province' });
    });

    test('should parse end command', () => {
      const state = createTestState();
      const result = parseMove('end', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'end_phase' });
    });

    test('should parse end_phase command', () => {
      const state = createTestState();
      const result = parseMove('end_phase', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'end_phase' });
    });

    test('should parse end phase (with space)', () => {
      const state = createTestState();
      const result = parseMove('end phase', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({ type: 'end_phase' });
    });

    // Edge case: Case sensitivity
    test('should handle case insensitive card names', () => {
      const state = createTestState();

      const result1 = parseMove('play_action village', state);
      expect(result1.success).toBe(true);
      expect(result1.move?.card).toBe('Village');

      const result2 = parseMove('buy province', state);
      expect(result2.success).toBe(true);
      expect(result2.move?.card).toBe('Province');

      const result3 = parseMove('play_treasure COPPER', state);
      expect(result3.success).toBe(true);
      expect(result3.move?.card).toBe('Copper');
    });

    // Edge case: Whitespace handling
    test('should handle extra whitespace', () => {
      const state = createTestState();

      const result1 = parseMove('  play 0  ', state);
      expect(result1.success).toBe(true);

      const result2 = parseMove('buy   Province', state);
      expect(result2.success).toBe(true);

      const result3 = parseMove('  end  ', state);
      expect(result3.success).toBe(true);
    });

    // Edge case: Multi-word card names
    test('should handle multi-word card names', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Council Room', 'Copper', 'Silver', 'Estate', 'Duchy']
        }],
        supply: new Map([['Council Room', 10]])
      });

      const result = parseMove('play_action Council Room', state);
      expect(result.success).toBe(true);
      expect(result.move?.card).toBe('Council Room');
    });

    // Error cases
    test('should error on invalid index (negative)', () => {
      const state = createTestState();
      const result = parseMove('play -1', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid index');
    });

    test('should error on invalid index (out of bounds)', () => {
      const state = createTestState();
      const result = parseMove('play 10', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid index');
    });

    test('should error when card not in hand', () => {
      const state = createTestState();
      const result = parseMove('play_action Smithy', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in hand');
    });

    test('should error when card not in supply', () => {
      const state = createTestState();
      const result = parseMove('buy Gold', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in supply');
    });

    test('should error on unknown command', () => {
      const state = createTestState();
      const result = parseMove('invalid command', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot parse move');
    });

    test('should error when trying to play non-action as action', () => {
      const state = createTestState();
      const result = parseMove('play_action Copper', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not an action card');
    });

    test('should error when trying to play card not in hand as treasure', () => {
      const state = createTestState();
      const result = parseMove('play_treasure Gold', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in hand');
    });

    test('should error when trying to play unknown card', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Gold', 'Copper', 'Silver', 'Estate', 'Duchy']
        }]
      });
      const result = parseMove('play 0', state);

      // Gold is not an action, so it should try as treasure
      expect(result.success).toBe(true);
      expect(result.move?.type).toBe('play_treasure');
      expect(result.move?.card).toBe('Gold');
    });

    test('should error when trying to play non-playable card (victory card)', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Estate', 'Copper', 'Silver', 'Village', 'Duchy']
        }]
      });
      const result = parseMove('play 0', state);

      // Estate is not an action or treasure
      expect(result.success).toBe(false);
      expect(result.error).toContain('is not playable');
      expect(result.error).toContain('Estate');
    });
  });

  describe('isMoveValid()', () => {
    // @req: Validate parsed move against validMoves list
    // @input: Move object and validMoves array
    // @output: Boolean indicating if move is valid
    // @assert: Correct matching by type and card
    // @level: Unit

    test('should return true for valid move', () => {
      const move: Move = { type: 'play_action', card: 'Village' };
      const validMoves: readonly Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'end_phase' }
      ];

      expect(isMoveValid(move, validMoves)).toBe(true);
    });

    test('should return false for invalid move', () => {
      const move: Move = { type: 'play_action', card: 'Smithy' };
      const validMoves: readonly Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'end_phase' }
      ];

      expect(isMoveValid(move, validMoves)).toBe(false);
    });

    test('should match end_phase move', () => {
      const move: Move = { type: 'end_phase' };
      const validMoves: readonly Move[] = [
        { type: 'end_phase' }
      ];

      expect(isMoveValid(move, validMoves)).toBe(true);
    });

    test('should match by both type and card', () => {
      const move: Move = { type: 'buy', card: 'Province' };
      const validMoves: readonly Move[] = [
        { type: 'buy', card: 'Copper' },
        { type: 'buy', card: 'Province' }
      ];

      expect(isMoveValid(move, validMoves)).toBe(true);
    });

    test('should not match different card of same type', () => {
      const move: Move = { type: 'buy', card: 'Province' };
      const validMoves: readonly Move[] = [
        { type: 'buy', card: 'Copper' }
      ];

      expect(isMoveValid(move, validMoves)).toBe(false);
    });

    test('should return false for empty validMoves', () => {
      const move: Move = { type: 'play_action', card: 'Village' };
      const validMoves: readonly Move[] = [];

      expect(isMoveValid(move, validMoves)).toBe(false);
    });
  });

  describe('getCardCost()', () => {
    // @req: Get card cost (wrapper around getCard)
    // @input: Card name or undefined
    // @output: Cost number or null
    // @assert: Correct costs for all cards, null for undefined/unknown
    // @level: Unit

    test('should return correct cost for treasure cards', () => {
      expect(getCardCost('Copper')).toBe(0);
      expect(getCardCost('Silver')).toBe(3);
      expect(getCardCost('Gold')).toBe(6);
    });

    test('should return correct cost for victory cards', () => {
      expect(getCardCost('Estate')).toBe(2);
      expect(getCardCost('Duchy')).toBe(5);
      expect(getCardCost('Province')).toBe(8);
    });

    test('should return correct cost for action cards', () => {
      expect(getCardCost('Village')).toBe(3);
      expect(getCardCost('Smithy')).toBe(4);
      expect(getCardCost('Market')).toBe(5);
    });

    test('should return null for undefined', () => {
      expect(getCardCost(undefined)).toBeNull();
    });

    test('should return null for unknown card', () => {
      expect(getCardCost('UnknownCard' as CardName)).toBeNull();
    });
  });
});

// ============================================================================
// MOVE DESCRIPTIONS TESTS
// ============================================================================

describe('Presentation Layer: Move Descriptions', () => {

  describe('getMoveDescription()', () => {
    // @req: Generate human-readable move descriptions
    // @input: Move object
    // @output: String description
    // @assert: Correct descriptions for all move types
    // @level: Unit

    test('should describe play_action move', () => {
      const move: Move = { type: 'play_action', card: 'Village' };
      expect(getMoveDescription(move)).toBe('Play Village');
    });

    test('should describe play_treasure move', () => {
      const move: Move = { type: 'play_treasure', card: 'Copper' };
      expect(getMoveDescription(move)).toBe('Play Copper');
    });

    test('should describe play_all_treasures move', () => {
      const move: Move = { type: 'play_all_treasures' };
      expect(getMoveDescription(move)).toBe('Play all treasures');
    });

    test('should describe buy move', () => {
      const move: Move = { type: 'buy', card: 'Province' };
      expect(getMoveDescription(move)).toBe('Buy Province');
    });

    test('should describe end_phase move', () => {
      const move: Move = { type: 'end_phase' };
      expect(getMoveDescription(move)).toBe('End Phase');
    });

    test('should describe discard_for_cellar move', () => {
      const move: Move = { type: 'discard_for_cellar' };
      expect(getMoveDescription(move)).toBe('Discard cards for Cellar');
    });

    test('should handle unknown move type', () => {
      const move = { type: 'unknown_type' } as unknown as Move;
      expect(getMoveDescription(move)).toBe('Unknown move');
    });
  });

  describe('getMoveDescriptionCompact()', () => {
    // @req: Generate compact descriptions with costs for buy moves
    // @input: Move object
    // @output: String with cost (for buy) or standard description
    // @assert: Buy moves show cost, others match standard description
    // @level: Unit

    test('should show cost for buy move', () => {
      const move: Move = { type: 'buy', card: 'Village' };
      expect(getMoveDescriptionCompact(move)).toBe('Buy Village ($3)');
    });

    test('should handle buy with different costs', () => {
      const move1: Move = { type: 'buy', card: 'Copper' };
      expect(getMoveDescriptionCompact(move1)).toBe('Buy Copper ($0)');

      const move2: Move = { type: 'buy', card: 'Province' };
      expect(getMoveDescriptionCompact(move2)).toBe('Buy Province ($8)');
    });

    test('should not show cost for non-buy moves', () => {
      const move: Move = { type: 'play_action', card: 'Village' };
      expect(getMoveDescriptionCompact(move)).toBe('Play Village');
    });

    test('should handle end_phase', () => {
      const move: Move = { type: 'end_phase' };
      expect(getMoveDescriptionCompact(move)).toBe('End Phase');
    });

    test('should handle unknown card in buy move gracefully', () => {
      const move: Move = { type: 'buy', card: 'UnknownCard' };
      expect(getMoveDescriptionCompact(move)).toBe('Buy UnknownCard');
    });

    test('should handle play_action in compact mode', () => {
      const move: Move = { type: 'play_action', card: 'Village' };
      expect(getMoveDescriptionCompact(move)).toBe('Play Village');
    });

    test('should handle play_treasure in compact mode', () => {
      const move: Move = { type: 'play_treasure', card: 'Copper' };
      expect(getMoveDescriptionCompact(move)).toBe('Play Copper');
    });

    test('should handle discard_for_cellar in compact mode', () => {
      const move: Move = { type: 'discard_for_cellar' };
      expect(getMoveDescriptionCompact(move)).toBe('Discard cards for Cellar');
    });

    test('should handle play_all_treasures', () => {
      const move: Move = { type: 'play_all_treasures' };
      expect(getMoveDescriptionCompact(move)).toBe('Play all treasures');
    });

    test('should handle trash_cards with cards', () => {
      const move: Move = { type: 'trash_cards', cards: ['Copper', 'Estate'] };
      expect(getMoveDescriptionCompact(move)).toBe('Trash: Copper, Estate');
    });

    test('should handle trash_cards without cards', () => {
      const move: Move = { type: 'trash_cards' };
      expect(getMoveDescriptionCompact(move)).toBe('Trash cards');
    });

    test('should handle gain_card with cost', () => {
      const move: Move = { type: 'gain_card', card: 'Silver' };
      expect(getMoveDescriptionCompact(move)).toBe('Gain: Silver ($3)');
    });

    test('should handle gain_card without card', () => {
      const move: Move = { type: 'gain_card' };
      expect(getMoveDescriptionCompact(move)).toBe('Gain card');
    });

    test('should handle reveal_reaction with card', () => {
      const move: Move = { type: 'reveal_reaction', card: 'Moat' };
      expect(getMoveDescriptionCompact(move)).toBe('Reveal Moat');
    });

    test('should handle reveal_reaction without card', () => {
      const move: Move = { type: 'reveal_reaction' };
      expect(getMoveDescriptionCompact(move)).toBe('Reveal reaction');
    });

    test('should handle discard_to_hand_size with cards', () => {
      const move: Move = { type: 'discard_to_hand_size', cards: ['Copper', 'Estate'] };
      expect(getMoveDescriptionCompact(move)).toBe('Discard to hand size: Copper, Estate');
    });

    test('should handle discard_to_hand_size without cards', () => {
      const move: Move = { type: 'discard_to_hand_size' };
      expect(getMoveDescriptionCompact(move)).toBe('Discard to hand size');
    });

    test('should handle reveal_and_topdeck with card', () => {
      const move: Move = { type: 'reveal_and_topdeck', card: 'Estate' };
      expect(getMoveDescriptionCompact(move)).toBe('Topdeck: Estate');
    });

    test('should handle reveal_and_topdeck without card', () => {
      const move: Move = { type: 'reveal_and_topdeck' };
      expect(getMoveDescriptionCompact(move)).toBe('Topdeck victory card');
    });

    test('should handle spy_decision to discard', () => {
      const move: Move = { type: 'spy_decision', choice: true };
      expect(getMoveDescriptionCompact(move)).toBe('Discard revealed card');
    });

    test('should handle spy_decision to keep', () => {
      const move: Move = { type: 'spy_decision', choice: false };
      expect(getMoveDescriptionCompact(move)).toBe('Keep revealed card on top');
    });

    test('should handle select_treasure_to_trash with card', () => {
      const move: Move = { type: 'select_treasure_to_trash', card: 'Copper' };
      expect(getMoveDescriptionCompact(move)).toBe('Trash: Copper');
    });

    test('should handle select_treasure_to_trash without card', () => {
      const move: Move = { type: 'select_treasure_to_trash' };
      expect(getMoveDescriptionCompact(move)).toBe('Select treasure to trash');
    });

    test('should handle gain_trashed_card with card', () => {
      const move: Move = { type: 'gain_trashed_card', card: 'Silver' };
      expect(getMoveDescriptionCompact(move)).toBe('Gain from trash: Silver ($3)');
    });

    test('should handle gain_trashed_card without card', () => {
      const move: Move = { type: 'gain_trashed_card' };
      expect(getMoveDescriptionCompact(move)).toBe('Gain trashed treasure');
    });

    test('should handle select_action_for_throne with card', () => {
      const move: Move = { type: 'select_action_for_throne', card: 'Village' };
      expect(getMoveDescriptionCompact(move)).toBe('Play twice: Village');
    });

    test('should handle select_action_for_throne without card', () => {
      const move: Move = { type: 'select_action_for_throne' };
      expect(getMoveDescriptionCompact(move)).toBe('Select action for Throne Room');
    });

    test('should handle chancellor_decision to shuffle', () => {
      const move: Move = { type: 'chancellor_decision', choice: true };
      expect(getMoveDescriptionCompact(move)).toBe('Shuffle deck into discard');
    });

    test('should handle chancellor_decision to keep', () => {
      const move: Move = { type: 'chancellor_decision', choice: false };
      expect(getMoveDescriptionCompact(move)).toBe('Keep deck as is');
    });

    test('should handle library_set_aside with card', () => {
      const move: Move = { type: 'library_set_aside', card: 'Village' };
      expect(getMoveDescriptionCompact(move)).toBe('Set aside: Village');
    });

    test('should handle library_set_aside without cards', () => {
      const move: Move = { type: 'library_set_aside' };
      expect(getMoveDescriptionCompact(move)).toBe('Set aside action card');
    });
  });

  describe('getMoveCommand()', () => {
    // @req: Generate command syntax for executing moves
    // @input: Move object
    // @output: String command
    // @assert: Correct syntax for all move types
    // @level: Unit

    test('should generate play_action command', () => {
      const move: Move = { type: 'play_action', card: 'Village' };
      expect(getMoveCommand(move)).toBe('play_action Village');
    });

    test('should generate play_treasure command', () => {
      const move: Move = { type: 'play_treasure', card: 'Copper' };
      expect(getMoveCommand(move)).toBe('play_treasure Copper');
    });

    test('should generate play_treasure all command', () => {
      const move: Move = { type: 'play_all_treasures' };
      expect(getMoveCommand(move)).toBe('play_treasure all');
    });

    test('should generate buy command', () => {
      const move: Move = { type: 'buy', card: 'Province' };
      expect(getMoveCommand(move)).toBe('buy Province');
    });

    test('should generate end command', () => {
      const move: Move = { type: 'end_phase' };
      expect(getMoveCommand(move)).toBe('end');
    });

    test('should handle unknown move type', () => {
      const move = { type: 'unknown_type' } as unknown as Move;
      expect(getMoveCommand(move)).toBe('unknown_type');
    });

    test('should generate discard_for_cellar command', () => {
      const move: Move = { type: 'discard_for_cellar', cards: ['Copper', 'Estate'] };
      expect(getMoveCommand(move)).toBe('discard_for_cellar Copper,Estate');
    });

    test('should generate discard_for_cellar command without cards', () => {
      const move: Move = { type: 'discard_for_cellar' };
      expect(getMoveCommand(move)).toBe('discard_for_cellar');
    });

    test('should generate trash_cards command', () => {
      const move: Move = { type: 'trash_cards', cards: ['Copper'] };
      expect(getMoveCommand(move)).toBe('trash_cards Copper');
    });

    test('should generate gain_card command', () => {
      const move: Move = { type: 'gain_card', card: 'Silver' };
      expect(getMoveCommand(move)).toBe('gain_card Silver');
    });

    test('should generate reveal_reaction command', () => {
      const move: Move = { type: 'reveal_reaction', card: 'Moat' };
      expect(getMoveCommand(move)).toBe('reveal_reaction Moat');
    });

    test('should generate discard_to_hand_size command', () => {
      const move: Move = { type: 'discard_to_hand_size', cards: ['Copper', 'Estate'] };
      expect(getMoveCommand(move)).toBe('discard_to_hand_size Copper,Estate');
    });

    test('should generate reveal_and_topdeck command', () => {
      const move: Move = { type: 'reveal_and_topdeck', card: 'Estate' };
      expect(getMoveCommand(move)).toBe('reveal_and_topdeck Estate');
    });

    test('should generate spy_decision command for yes', () => {
      const move: Move = { type: 'spy_decision', choice: true };
      expect(getMoveCommand(move)).toBe('spy_decision yes');
    });

    test('should generate spy_decision command for no', () => {
      const move: Move = { type: 'spy_decision', choice: false };
      expect(getMoveCommand(move)).toBe('spy_decision no');
    });

    test('should generate select_treasure_to_trash command', () => {
      const move: Move = { type: 'select_treasure_to_trash', card: 'Copper' };
      expect(getMoveCommand(move)).toBe('select_treasure_to_trash Copper');
    });

    test('should generate gain_trashed_card command', () => {
      const move: Move = { type: 'gain_trashed_card', card: 'Silver' };
      expect(getMoveCommand(move)).toBe('gain_trashed_card Silver');
    });

    test('should generate select_action_for_throne command', () => {
      const move: Move = { type: 'select_action_for_throne', card: 'Village' };
      expect(getMoveCommand(move)).toBe('select_action_for_throne Village');
    });

    test('should generate chancellor_decision command for yes', () => {
      const move: Move = { type: 'chancellor_decision', choice: true };
      expect(getMoveCommand(move)).toBe('chancellor_decision yes');
    });

    test('should generate chancellor_decision command for no', () => {
      const move: Move = { type: 'chancellor_decision', choice: false };
      expect(getMoveCommand(move)).toBe('chancellor_decision no');
    });

    test('should generate library_set_aside command', () => {
      const move: Move = { type: 'library_set_aside', card: 'Village' };
      expect(getMoveCommand(move)).toBe('library_set_aside Village');
    });
  });

  describe('getMoveExamples()', () => {
    // @req: Generate example commands for each phase
    // @input: Phase name
    // @output: Array of example command strings
    // @assert: Relevant examples for action/buy/cleanup phases
    // @level: Unit

    test('should provide action phase examples', () => {
      const examples = getMoveExamples('action');
      expect(examples).toHaveLength(3);
      expect(examples).toContain('"play 0" (play card at index 0)');
      expect(examples).toContain('"play_action Village"');
      expect(examples).toContain('"end" (move to buy phase)');
    });

    test('should provide buy phase examples', () => {
      const examples = getMoveExamples('buy');
      expect(examples).toHaveLength(4);
      expect(examples).toContain('"play_treasure Copper"');
      expect(examples).toContain('"play_treasure all" (play all treasures)');
      expect(examples).toContain('"buy Province"');
      expect(examples).toContain('"end" (move to cleanup)');
    });

    test('should provide cleanup phase examples', () => {
      const examples = getMoveExamples('cleanup');
      expect(examples).toHaveLength(1);
      expect(examples).toContain('"end" (end turn)');
    });

    test('should provide default examples for unknown phase', () => {
      const examples = getMoveExamples('unknown_phase' as any);
      expect(examples).toEqual(['"end"']);
    });
  });

  describe('getNextPhaseName()', () => {
    // @req: Get next phase name for display
    // @input: Current phase
    // @output: String describing next phase
    // @assert: Correct phase transitions
    // @level: Unit

    test('should return next phase from action', () => {
      expect(getNextPhaseName('action')).toBe('buy phase');
    });

    test('should return next phase from buy', () => {
      expect(getNextPhaseName('buy')).toBe('cleanup phase');
    });

    test('should return next phase from cleanup', () => {
      expect(getNextPhaseName('cleanup')).toBe("next player's action phase");
    });

    test('should return default for unknown phase', () => {
      expect(getNextPhaseName('unknown_phase' as any)).toBe('next phase');
    });
  });
});

// ============================================================================
// ERROR MESSAGES TESTS
// ============================================================================

describe('Presentation Layer: Error Messages', () => {

  const createTestState = (overrides?: Partial<GameState>): GameState => ({
    players: [{
      hand: ['Village', 'Copper', 'Estate'],
      drawPile: [],
      discardPile: [],
      inPlay: [],
      actions: 1,
      buys: 1,
      coins: 3
    }],
    currentPlayer: 0,
    phase: 'buy',
    turnNumber: 1,
    supply: new Map([
      ['Copper', 60],
      ['Silver', 40],
      ['Gold', 30],
      ['Province', 0], // Empty
      ['Village', 10]
    ]),
    seed: 'test',
    gameLog: [],
    trash: [],
    ...overrides
  });

  describe('analyzeRejectionReason()', () => {
    // @req: Analyze why move was rejected with details
    // @input: Rejected move, validMoves, game state
    // @output: RejectionReason with reason string and details object
    // @assert: Correct reason identification for all rejection types
    // @level: Unit

    test('should detect insufficient coins', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          coins: 2
        }]
      });
      const move: Move = { type: 'buy', card: 'Silver' }; // Silver costs 3
      const validMoves: readonly Move[] = [
        { type: 'buy', card: 'Copper' }
      ];

      const reason = analyzeRejectionReason(move, validMoves, state);

      expect(reason.reason).toBe('Insufficient coins');
      expect(reason.details.playerCoins).toBe(2);
      expect(reason.details.cardCost).toBe(3);
      expect(reason.details.deficit).toBe(1);
    });

    test('should detect card pile empty', () => {
      // Player has enough coins (8+) but Province pile is empty
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          coins: 10 // More than enough for Province ($8)
        }]
      });
      const move: Move = { type: 'buy', card: 'Province' }; // Province costs 8
      const validMoves: readonly Move[] = [
        { type: 'buy', card: 'Copper' }
      ];

      const reason = analyzeRejectionReason(move, validMoves, state);

      expect(reason.reason).toBe('Card pile empty');
      expect(reason.details.card).toBe('Province');
    });

    test('should detect card not in hand', () => {
      const state = createTestState({ phase: 'action' });
      const move: Move = { type: 'play_action', card: 'Smithy' };
      const validMoves: readonly Move[] = [
        { type: 'play_action', card: 'Village' }
      ];

      const reason = analyzeRejectionReason(move, validMoves, state);

      expect(reason.reason).toBe('Card not in hand');
      expect(reason.details.card).toBe('Smithy');
      expect(reason.details.handSize).toBe(3);
    });

    test('should detect no valid moves of type (buy)', () => {
      const state = createTestState({ phase: 'action' });
      const move: Move = { type: 'buy', card: 'Copper' };
      const validMoves: readonly Move[] = [
        { type: 'play_action', card: 'Village' }
      ];

      const reason = analyzeRejectionReason(move, validMoves, state);

      expect(reason.reason).toBe('No valid purchases available');
    });

    test('should detect no valid moves of type (play_treasure)', () => {
      const state = createTestState({ phase: 'buy' });
      const move: Move = { type: 'play_treasure', card: 'Copper' };
      const validMoves: readonly Move[] = [];

      const reason = analyzeRejectionReason(move, validMoves, state);

      expect(reason.reason).toBe('No valid treasure plays available');
      expect(reason.details.phase).toBe('buy');
    });

    test('should detect wrong phase for action', () => {
      const state = createTestState({ phase: 'buy' });
      const move: Move = { type: 'play_action', card: 'Village' };
      const validMoves: readonly Move[] = [];

      const reason = analyzeRejectionReason(move, validMoves, state);

      expect(reason.reason).toBe('No valid action plays available');
      expect(reason.details.wrongPhase).toBe(true);
    });

    test('should detect card not in supply', () => {
      // Create state without Smithy in supply, player has enough coins
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          coins: 10 // More than enough for Smithy ($4)
        }],
        supply: new Map([
          ['Copper', 60],
          ['Silver', 40],
          ['Gold', 30],
          ['Province', 0],
          ['Village', 10]
          // Smithy not in supply
        ])
      });
      const move: Move = { type: 'buy', card: 'Smithy' }; // Smithy costs 4
      const validMoves: readonly Move[] = [
        { type: 'buy', card: 'Copper' }
      ];

      const reason = analyzeRejectionReason(move, validMoves, state);

      expect(reason.reason).toBe('Card not in supply');
      expect(reason.details.card).toBe('Smithy');
    });

    test('should return unknown rejection reason as fallback', () => {
      const state = createTestState();
      const move: Move = { type: 'end_phase' };
      const validMoves: readonly Move[] = [
        { type: 'play_action', card: 'Village' }
      ];

      const reason = analyzeRejectionReason(move, validMoves, state);

      expect(reason.reason).toBe('Unknown rejection reason');
      expect(reason.details.moveType).toBe('end_phase');
    });
  });

  describe('generateSuggestion()', () => {
    // @req: Generate helpful suggestions for invalid moves
    // @input: Rejected move, validMoves, game state
    // @output: String suggestion
    // @assert: Relevant suggestions based on move type and phase
    // @level: Unit

    test('should suggest valid actions when available', () => {
      const state = createTestState({ phase: 'action' });
      const move: Move = { type: 'play_action', card: 'Smithy' };
      const validMoves: readonly Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'play_action', card: 'Market' }
      ];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('Valid plays: Village, Market');
      expect(suggestion).toContain('play 0');
    });

    test('should suggest ending phase when no actions available', () => {
      const state = createTestState({ phase: 'action' });
      const move: Move = { type: 'play_action', card: 'Village' };
      const validMoves: readonly Move[] = [];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('No valid action plays available');
      expect(suggestion).toContain('end');
    });

    test('should explain wrong phase for action', () => {
      const state = createTestState({ phase: 'buy' });
      const move: Move = { type: 'play_action', card: 'Village' };
      const validMoves: readonly Move[] = [];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('Cannot play action cards in buy phase');
      expect(suggestion).toContain('play_treasure');
    });

    test('should suggest valid treasures', () => {
      const state = createTestState({ phase: 'buy' });
      const move: Move = { type: 'play_treasure', card: 'Gold' };
      const validMoves: readonly Move[] = [
        { type: 'play_treasure', card: 'Copper' },
        { type: 'play_treasure', card: 'Silver' }
      ];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('Valid treasures to play: Copper, Silver');
      expect(suggestion).toContain('play_treasure CARD');
    });

    test('should explain wrong phase for treasure', () => {
      const state = createTestState({ phase: 'action' });
      const move: Move = { type: 'play_treasure', card: 'Copper' };
      const validMoves: readonly Move[] = [];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('Cannot play treasures in action phase');
      expect(suggestion).toContain('action phase');
    });

    test('should suggest valid purchases', () => {
      const state = createTestState({ phase: 'buy' });
      const move: Move = { type: 'buy', card: 'Province' };
      const validMoves: readonly Move[] = [
        { type: 'buy', card: 'Copper' },
        { type: 'buy', card: 'Silver' }
      ];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('Valid purchases: Copper, Silver');
      expect(suggestion).toContain('buy CARD');
    });

    test('should suggest ending turn when no purchases available', () => {
      const state = createTestState({ phase: 'buy', players: [{ ...createTestState().players[0], coins: 0 }] });
      const move: Move = { type: 'buy', card: 'Copper' };
      const validMoves: readonly Move[] = [];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('No valid purchases available');
      expect(suggestion).toContain('end');
    });

    test('should explain wrong phase for buy', () => {
      const state = createTestState({ phase: 'action' });
      const move: Move = { type: 'buy', card: 'Province' };
      const validMoves: readonly Move[] = [];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('Cannot buy in action phase');
      expect(suggestion).toContain('end');
    });

    test('should suggest ending phase for end_phase move', () => {
      const state = createTestState({ phase: 'buy' });
      const move: Move = { type: 'end_phase' };
      const validMoves: readonly Move[] = [{ type: 'end_phase' }];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('end');
      expect(suggestion).toContain('cleanup phase');
    });

    test('should provide fallback suggestion', () => {
      const state = createTestState();
      const move = { type: 'unknown_type' } as unknown as Move;
      const validMoves: readonly Move[] = [];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('game_observe()');
    });

    test('should suggest treasures when no treasures available in hand', () => {
      const state = createTestState({
        phase: 'buy',
        players: [{
          ...createTestState().players[0],
          hand: ['Estate', 'Duchy', 'Province', 'Village', 'Smithy']
        }]
      });
      const move: Move = { type: 'play_treasure', card: 'Copper' };
      const validMoves: readonly Move[] = [];

      const suggestion = generateSuggestion(move, validMoves, state);

      expect(suggestion).toContain('No treasures in hand');
      expect(suggestion).toContain('buy CARD');
    });
  });
});
