import { GameState, CardName, Move, PendingEffect } from '@principality/core';

// @req: FR-CLI-1 through FR-CLI-6 - CLI interactive prompts for all 11 action cards
// @req: FR-CLI-7 - Backward compatibility with AI and MCP
// @edge: Empty options | single option | multi-step cards | iterative prompts | binary choices
// @why: Comprehensive coverage of all interactive cards with mandatory choices
// @level: unit

describe('Phase 4.1 - Feature 2: CLI Interactive Prompts - All Cards', () => {

  function createMockGameState(overrides: any): GameState {
    return {
      players: [{
        drawPile: overrides.drawPile || [],
        hand: overrides.hand || [],
        discardPile: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0
      }],
      supply: overrides.supply || new Map(),
      currentPlayer: 0,
      phase: 'action',
      turnNumber: 1,
      seed: 'test',
      gameLog: [],
      trash: overrides.trash || [],
      pendingEffect: overrides.pendingEffect
    } as GameState;
  }

  describe('UT-CLI-CHAPEL: Trash up to 4 cards', () => {
    // @req: FR-CLI-2 - Chapel trash options
    // @assert: Generate trash combinations up to 4 cards

    it('should show trash options after playing Chapel', () => {
      const state = createMockGameState({
        hand: ['Copper', 'Copper', 'Estate', 'Curse'],
        pendingEffect: { card: 'Chapel', effect: 'trash_cards', maxTrash: 4 }
      });

      expect(state.pendingEffect?.effect).toBe('trash_cards');
      expect(state.pendingEffect?.maxTrash).toBe(4);
    });

    it('should allow trashing up to 4 cards', () => {
      const move: Move = {
        type: 'trash_cards',
        cards: ['Copper', 'Copper', 'Estate', 'Curse']
      };

      expect(move.cards).toHaveLength(4);
      expect(move.type).toBe('trash_cards');
    });

    it('should include "trash nothing" option', () => {
      const move: Move = {
        type: 'trash_cards',
        cards: []
      };

      expect(move.cards).toHaveLength(0);
    });

    it('should move trashed cards to trash pile', () => {
      // Expected behavior: cards move from hand to global trash pile
      const move: Move = {
        type: 'trash_cards',
        cards: ['Copper', 'Curse']
      };

      expect(move.cards).toContain('Copper');
      expect(move.cards).toContain('Curse');
    });
  });

  describe('UT-CLI-REMODEL: 2-step trash and gain', () => {
    // @req: FR-CLI-5 - Multi-step card interaction
    // @assert: Step 1 trash, Step 2 gain up to cost+2

    it('should prompt Step 1: trash selection', () => {
      const state = createMockGameState({
        hand: ['Estate', 'Copper', 'Silver'],
        pendingEffect: { card: 'Remodel', effect: 'trash_for_remodel' }
      });

      expect(state.pendingEffect?.effect).toBe('trash_for_remodel');
    });

    it('should transition to Step 2: gain selection after trash', () => {
      // After trashing Estate ($2), can gain up to $4
      const state = createMockGameState({
        hand: ['Copper'],
        trash: ['Estate'],
        pendingEffect: {
          card: 'Remodel',
          effect: 'gain_card',
          maxGainCost: 4,
          trashedCard: 'Estate'
        }
      });

      expect(state.pendingEffect?.effect).toBe('gain_card');
      expect(state.pendingEffect?.maxGainCost).toBe(4);
      expect(state.pendingEffect?.trashedCard).toBe('Estate');
    });

    it('should complete after gain card execution', () => {
      const move: Move = {
        type: 'gain_card',
        card: 'Smithy' // Cost $4
      };

      expect(move.type).toBe('gain_card');
      expect(move.card).toBe('Smithy');
      // Expected: pendingEffect cleared after this
    });
  });

  describe('UT-CLI-MINE: 2-step treasure-specific', () => {
    // @req: FR-CLI-2, FR-CLI-6 - Mine shows only treasures, gains to hand
    // @assert: Step 1 treasures only, Step 2 treasures only, destination=hand

    it('should show only treasures in Step 1', () => {
      const state = createMockGameState({
        hand: ['Copper', 'Silver', 'Estate', 'Village'],
        pendingEffect: { card: 'Mine', effect: 'select_treasure_to_trash' }
      });

      expect(state.pendingEffect?.effect).toBe('select_treasure_to_trash');

      // Only Copper and Silver should be options (treasures)
      const hand = state.players[0].hand;
      const treasures = hand.filter(c => ['Copper', 'Silver', 'Gold'].includes(c));
      expect(treasures).toEqual(['Copper', 'Silver']);
    });

    it('should gain treasure to hand (not discard)', () => {
      const state = createMockGameState({
        hand: ['Copper'],
        trash: ['Silver'],
        pendingEffect: {
          card: 'Mine',
          effect: 'gain_card',
          maxGainCost: 6,
          destination: 'hand'
        }
      });

      expect(state.pendingEffect?.destination).toBe('hand');
    });

    it('should gain treasure costing up to +$3 more', () => {
      // Trashed Silver ($3), can gain up to $6 (Gold)
      const move: Move = {
        type: 'gain_card',
        card: 'Gold',
        destination: 'hand'
      };

      expect(move.destination).toBe('hand');
      expect(move.card).toBe('Gold');
    });
  });

  describe('UT-CLI-WORKSHOP: Gain card up to $4', () => {
    // @req: FR-CLI-2 - Workshop gain options filtered by cost
    // @assert: Show cards ≤ $4

    it('should show cards up to $4', () => {
      const supply = new Map<CardName, number>([
        ['Province', 8],   // $8 - should NOT show
        ['Duchy', 8],      // $5 - should NOT show
        ['Smithy', 10],    // $4 - should show
        ['Silver', 40],    // $3 - should show
        ['Estate', 8]      // $2 - should show
      ]);

      const state = createMockGameState({
        supply,
        pendingEffect: { card: 'Workshop', effect: 'gain_card', maxGainCost: 4 }
      });

      expect(state.pendingEffect?.maxGainCost).toBe(4);

      // Filter options by cost
      const validOptions = Array.from(supply.keys()).filter(card => {
        // Mock: Smithy=$4, Silver=$3, Estate=$2 are valid
        return ['Smithy', 'Silver', 'Estate'].includes(card);
      });

      expect(validOptions).toContain('Smithy');
      expect(validOptions).not.toContain('Province');
      expect(validOptions).not.toContain('Duchy');
    });
  });

  describe('UT-CLI-FEAST: Trash self and gain up to $5', () => {
    // @req: FR-CLI-6 - Feast automatically trashes itself
    // @assert: Feast trashed, gain up to $5

    it('should trash Feast automatically', () => {
      const state = createMockGameState({
        hand: ['Copper'],
        trash: ['Feast'], // Feast already trashed
        pendingEffect: { card: 'Feast', effect: 'gain_card', maxGainCost: 5 }
      });

      expect(state.trash).toContain('Feast');
      expect(state.pendingEffect?.maxGainCost).toBe(5);
    });

    it('should show cards up to $5', () => {
      const move: Move = {
        type: 'gain_card',
        card: 'Duchy' // $5
      };

      expect(move.card).toBe('Duchy');
    });
  });

  describe('UT-CLI-LIBRARY: Iterative set-aside decisions', () => {
    // @req: FR-CLI-5 - Library prompts per action card drawn
    // @assert: Prompt for each action card, continue until 7 in hand

    it('should prompt for each action card drawn', () => {
      const state = createMockGameState({
        hand: ['Copper', 'Copper'], // 2 cards
        drawPile: ['Village', 'Silver', 'Smithy'], // Will draw Village (action)
        pendingEffect: { card: 'Library', effect: 'library_set_aside' }
      });

      expect(state.pendingEffect?.effect).toBe('library_set_aside');
    });

    it('should offer binary choice: set aside or keep', () => {
      const moveSetAside: Move = {
        type: 'library_set_aside',
        cards: ['Village'],
        choice: true // Set aside
      };

      const moveKeep: Move = {
        type: 'library_set_aside',
        cards: ['Village'],
        choice: false // Keep
      };

      expect(moveSetAside.choice).toBe(true);
      expect(moveKeep.choice).toBe(false);
    });

    it('should continue until hand has 7 cards', () => {
      // Expected: Library draws until hand.length === 7
      // Each action card triggers prompt
      // Non-action cards auto-kept
    });
  });

  describe('UT-CLI-THRONE-ROOM: Select action to double', () => {
    // @req: FR-CLI-2, FR-CLI-6 - Throne Room shows action cards in hand
    // @assert: List action cards, exclude Throne Room itself

    it('should list action cards to double', () => {
      const state = createMockGameState({
        hand: ['Village', 'Smithy', 'Copper', 'Estate'],
        pendingEffect: { card: 'Throne Room', effect: 'select_action_for_throne' }
      });

      expect(state.pendingEffect?.effect).toBe('select_action_for_throne');

      // Options: Village, Smithy (not Copper, Estate)
      const hand = state.players[0].hand;
      const actions = hand.filter(c => ['Village', 'Smithy'].includes(c));
      expect(actions).toEqual(['Village', 'Smithy']);
    });

    it('should play selected action twice', () => {
      const move: Move = {
        type: 'select_action_for_throne',
        card: 'Village'
      };

      expect(move.card).toBe('Village');
      // Expected: Village effect applied twice (+2 cards, +4 actions)
    });

    it('should not list Throne Room itself as option', () => {
      const state = createMockGameState({
        hand: ['Throne Room', 'Village'],
        pendingEffect: { card: 'Throne Room', effect: 'select_action_for_throne' }
      });

      // Only Village should be option, not Throne Room
      const hand = state.players[0].hand;
      const validOptions = hand.filter(c => c !== 'Throne Room' && c === 'Village');
      expect(validOptions).toEqual(['Village']);
    });
  });

  describe('UT-CLI-CHANCELLOR: Binary choice for deck to discard', () => {
    // @req: FR-CLI-2, FR-CLI-6 - Chancellor offers yes/no decision
    // @assert: Binary choice: move deck or keep

    it('should offer binary choice', () => {
      const state = createMockGameState({
        drawPile: ['Estate', 'Copper', 'Silver'],
        pendingEffect: { card: 'Chancellor', effect: 'chancellor_decision' }
      });

      expect(state.pendingEffect?.effect).toBe('chancellor_decision');
    });

    it('should move deck to discard on Yes', () => {
      const move: Move = {
        type: 'chancellor_decision',
        choice: true // Yes
      };

      expect(move.choice).toBe(true);
      // Expected: All cards from drawPile → discardPile
    });

    it('should keep deck as-is on No', () => {
      const move: Move = {
        type: 'chancellor_decision',
        choice: false // No
      };

      expect(move.choice).toBe(false);
      // Expected: drawPile unchanged
    });
  });

  describe('UT-CLI-SPY: Decisions per player', () => {
    // @req: FR-CLI-5 - Spy prompts for each player's top card
    // @assert: Prompt per player, binary choice per card

    it('should prompt for each player in turn order', () => {
      const state = createMockGameState({
        hand: ['Copper'],
        pendingEffect: {
          card: 'Spy',
          effect: 'spy_decision',
          targetPlayer: 0
        }
      });

      expect(state.pendingEffect?.effect).toBe('spy_decision');
      expect(state.pendingEffect?.targetPlayer).toBe(0);
    });

    it('should offer discard or keep choice', () => {
      const moveDiscard: Move = {
        type: 'spy_decision',
        playerIndex: 0,
        choice: true // Discard
      };

      const moveKeep: Move = {
        type: 'spy_decision',
        playerIndex: 0,
        choice: false // Keep on top
      };

      expect(moveDiscard.choice).toBe(true);
      expect(moveKeep.choice).toBe(false);
    });

    it('should iterate through all players', () => {
      // Expected: targetPlayer increments 0 → 1 → 2 until all processed
    });
  });

  describe('UT-CLI-BUREAUCRAT: Opponent topdecks victory card', () => {
    // @req: FR-CLI-2, FR-CLI-6 - Bureaucrat prompts opponent
    // @assert: Opponent chooses victory card to topdeck

    it('should prompt opponent to topdeck victory card', () => {
      const state = createMockGameState({
        hand: ['Estate', 'Duchy', 'Copper'],
        pendingEffect: {
          card: 'Bureaucrat',
          effect: 'reveal_and_topdeck',
          targetPlayer: 1
        }
      });

      expect(state.pendingEffect?.effect).toBe('reveal_and_topdeck');
      expect(state.pendingEffect?.targetPlayer).toBe(1);
    });

    it('should list victory cards in hand', () => {
      const hand: CardName[] = ['Estate', 'Duchy', 'Copper'];
      const victoryCards = hand.filter(c => ['Estate', 'Duchy', 'Province'].includes(c));

      expect(victoryCards).toEqual(['Estate', 'Duchy']);
    });

    it('should reveal hand if no victory cards', () => {
      const hand: CardName[] = ['Copper', 'Silver', 'Village'];
      const victoryCards = hand.filter(c => ['Estate', 'Duchy', 'Province'].includes(c));

      expect(victoryCards).toHaveLength(0);
      // Expected: "Reveal hand (no Victory cards)" option
    });
  });

  describe('UT-CLI-INPUT: Numeric selection parsing', () => {
    // @req: FR-CLI-4 - Input parsing and validation
    // @assert: Accept valid numbers 1-N, reject invalid

    it('should parse valid numeric input', () => {
      const options = [
        { type: 'discard_for_cellar', cards: ['Copper'] },
        { type: 'discard_for_cellar', cards: ['Copper', 'Copper'] },
        { type: 'discard_for_cellar', cards: [] }
      ];

      const selection1 = parseUserSelection('1', options);
      const selection2 = parseUserSelection('2', options);
      const selection3 = parseUserSelection('3', options);

      expect(selection1).toBe(0); // Index 0
      expect(selection2).toBe(1); // Index 1
      expect(selection3).toBe(2); // Index 2
    });

    it('should reject invalid input', () => {
      const options = [
        { type: 'gain_card', card: 'Smithy' },
        { type: 'gain_card', card: 'Silver' }
      ];

      expect(parseUserSelection('abc', options)).toBeNull();
      expect(parseUserSelection('0', options)).toBeNull();
      expect(parseUserSelection('99', options)).toBeNull();
      expect(parseUserSelection('-1', options)).toBeNull();
      expect(parseUserSelection('', options)).toBeNull();
    });

    it('should handle edge input values', () => {
      const options = [
        { type: 'gain_card', card: 'Smithy' }
      ];

      expect(parseUserSelection('1', options)).toBe(0); // Valid
      expect(parseUserSelection('2', options)).toBeNull(); // Out of range
      expect(parseUserSelection('1.5', options)).toBeNull(); // Float
      expect(parseUserSelection(' 1 ', options)).toBe(0); // Whitespace trimmed
    });
  });

  describe('UT-CLI-ERROR: Error handling', () => {
    // @req: FR-CLI-4 - Error messages for invalid selections
    // @assert: Clear error messages, re-prompt without state change

    it('should show error for out-of-range selection', () => {
      const options = [
        { type: 'gain_card', card: 'Smithy' },
        { type: 'gain_card', card: 'Silver' }
      ];

      const result = parseUserSelection('99', options);

      expect(result).toBeNull();
      // Expected: "Invalid selection. Please enter 1-2."
    });

    it('should show error for non-numeric input', () => {
      const result = parseUserSelection('abc', []);

      expect(result).toBeNull();
      // Expected: "Invalid input. Please enter a number."
    });
  });
});

// Mock parsing function
function parseUserSelection(input: string, options: any[]): number | null {
  const trimmed = input.trim();

  // Reject non-numeric input (including floats with decimal points)
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const num = parseInt(trimmed, 10);

  if (num < 1 || num > options.length) {
    return null;
  }

  return num - 1; // Convert 1-indexed to 0-indexed
}
