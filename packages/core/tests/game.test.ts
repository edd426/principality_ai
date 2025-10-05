import { GameEngine } from '../src/game';
import { GameState } from '../src/types';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('test-seed-123');
  });

  test('should initialize game with correct starting state', () => {
    const state = engine.initializeGame(1);
    
    expect(state.players).toHaveLength(1);
    expect(state.currentPlayer).toBe(0);
    expect(state.phase).toBe('action');
    expect(state.turnNumber).toBe(1);
    
    const player = state.players[0];
    expect(player.hand).toHaveLength(5);
    expect(player.deck).toHaveLength(5);
    expect(player.discard).toHaveLength(0);
    expect(player.actions).toBe(1);
    expect(player.buys).toBe(1);
    expect(player.coins).toBe(0);
    
    // Check starting cards (7 Copper + 3 Estate)
    const allCards = [...player.hand, ...player.deck];
    const copperCount = allCards.filter(card => card === 'Copper').length;
    const estateCount = allCards.filter(card => card === 'Estate').length;
    expect(copperCount).toBe(7);
    expect(estateCount).toBe(3);
  });

  test('should play action cards correctly', () => {
    const state = engine.initializeGame(1);
    
    // Manually set hand to include Village
    const modifiedState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Village', 'Copper', 'Copper', 'Silver', 'Estate'],
        deck: ['Smithy', 'Market', 'Gold']
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Village' });
    
    expect(result.success).toBe(true);
    expect(result.newState).toBeDefined();
    
    if (result.newState) {
      const player = result.newState.players[0];
      expect(player.actions).toBe(2); // Started with 1, spent 1, gained 2 = 2
      expect(player.hand).toHaveLength(5); // Removed Village, drew 1 card
      expect(player.playArea).toContain('Village');
      expect(player.hand).not.toContain('Village');
    }
  });

  test('should handle treasure playing in buy phase', () => {
    const state = engine.initializeGame(1);
    
    // Move to buy phase with copper in hand
    const buyPhaseState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        hand: ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy'],
        actions: 0,
        coins: 0
      }]
    };

    const result = engine.executeMove(buyPhaseState, { type: 'play_treasure', card: 'Silver' });
    
    expect(result.success).toBe(true);
    if (result.newState) {
      const player = result.newState.players[0];
      expect(player.coins).toBe(2);
      expect(player.playArea).toContain('Silver');
      expect(player.hand).not.toContain('Silver');
    }
  });

  test('should handle card purchases', () => {
    const state = engine.initializeGame(1);
    
    // Set up buy phase with enough coins
    const buyPhaseState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Estate', 'Estate', 'Estate'],
        coins: 4,
        buys: 1
      }]
    };

    const result = engine.executeMove(buyPhaseState, { type: 'buy', card: 'Smithy' });
    
    expect(result.success).toBe(true);
    if (result.newState) {
      const player = result.newState.players[0];
      expect(player.coins).toBe(0); // 4 - 4 = 0
      expect(player.buys).toBe(0);
      expect(player.discard).toContain('Smithy');
      
      // Check supply decreased
      expect(result.newState.supply.get('Smithy')).toBe(9);
    }
  });

  test('should handle phase transitions', () => {
    const state = engine.initializeGame(1);
    
    // End action phase
    const result1 = engine.executeMove(state, { type: 'end_phase' });
    expect(result1.success).toBe(true);
    expect(result1.newState?.phase).toBe('buy');
    
    // End buy phase
    const result2 = engine.executeMove(result1.newState!, { type: 'end_phase' });
    expect(result2.success).toBe(true);
    expect(result2.newState?.phase).toBe('cleanup');
    
    // End cleanup phase (should advance turn)
    const result3 = engine.executeMove(result2.newState!, { type: 'end_phase' });
    expect(result3.success).toBe(true);
    expect(result3.newState?.phase).toBe('action');
    expect(result3.newState?.turnNumber).toBe(2);
    
    // Player should have new hand of 5 cards
    const player = result3.newState?.players[0];
    expect(player?.hand).toHaveLength(5);
    expect(player?.playArea).toHaveLength(0);
    expect(player?.actions).toBe(1);
    expect(player?.buys).toBe(1);
    expect(player?.coins).toBe(0);
  });

  test('should detect game over when Province pile is empty', () => {
    const state = engine.initializeGame(1);
    
    // Set Province pile to 0
    const emptyProvinceState: GameState = {
      ...state,
      supply: new Map(state.supply).set('Province', 0)
    };

    const victory = engine.checkGameOver(emptyProvinceState);
    expect(victory.isGameOver).toBe(true);
    expect(victory.scores).toBeDefined();
  });

  test('should validate invalid moves', () => {
    const state = engine.initializeGame(1);
    
    // Try to play card not in hand
    const result1 = engine.executeMove(state, { type: 'play_action', card: 'Market' });
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('Market not in hand');
    
    // Try to buy without enough coins
    const buyPhaseState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        coins: 1,
        buys: 1
      }]
    };
    
    const result2 = engine.executeMove(buyPhaseState, { type: 'buy', card: 'Gold' });
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('Not enough coins');
  });

  test('should get valid moves for each phase', () => {
    const state = engine.initializeGame(1);

    // Action phase - should include action cards and end phase
    const actionMoves = engine.getValidMoves(state);
    expect(actionMoves).toContainEqual({ type: 'end_phase' });

    // Buy phase
    const buyPhaseState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        coins: 10,
        buys: 1
      }]
    };

    const buyMoves = engine.getValidMoves(buyPhaseState);
    expect(buyMoves).toContainEqual({ type: 'end_phase' });
    expect(buyMoves.some(move => move.type === 'buy')).toBe(true);
  });

  test('should handle Cellar card discard and draw', () => {
    const state = engine.initializeGame(1);

    // Set up hand with Cellar and cards to discard
    const modifiedState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Cellar', 'Estate', 'Estate', 'Copper', 'Copper'],
        deck: ['Village', 'Smithy', 'Market', 'Gold', 'Silver'],
        discard: []
      }]
    };

    // Play Cellar card first
    const cellarResult = engine.executeMove(modifiedState, { type: 'play_action', card: 'Cellar' });
    expect(cellarResult.success).toBe(true);

    if (cellarResult.newState) {
      const afterCellar = cellarResult.newState;

      // Now discard 2 Estate cards
      const discardResult = engine.executeMove(afterCellar, {
        type: 'discard_for_cellar',
        cards: ['Estate', 'Estate']
      });

      expect(discardResult.success).toBe(true);
      if (discardResult.newState) {
        const player = discardResult.newState.players[0];

        // Should have drawn 2 cards (same as discarded count)
        expect(player.hand).toHaveLength(4); // Started with 4 after Cellar, discarded 2, drew 2
        expect(player.hand).not.toContain('Estate'); // Estates should be discarded
        expect(player.discard).toHaveLength(2); // 2 Estates discarded
        expect(player.discard.filter(c => c === 'Estate')).toHaveLength(2);
      }
    }
  });

  test('should handle deck exhaustion and shuffle discard pile', () => {
    const state = engine.initializeGame(1);

    // Set up scenario where drawing will exhaust deck
    const modifiedState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Smithy', 'Copper'],
        deck: ['Village', 'Market'], // Only 2 cards in deck
        discard: ['Estate', 'Duchy', 'Province', 'Gold'] // 4 cards in discard
      }]
    };

    // Play Smithy (draws 3 cards)
    const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Smithy' });

    expect(result.success).toBe(true);
    if (result.newState) {
      const player = result.newState.players[0];

      // Should have drawn 3 cards total
      expect(player.hand).toHaveLength(4); // Started with 2, removed Smithy, drew 3 = 4

      // Deck should have remaining cards after shuffle
      // Total: 2 starting hand + 2 deck + 4 discard = 8 cards
      // After: 4 in hand, 1 in play area (Smithy), 3 remaining in deck/discard
      const totalCards = player.deck.length + player.discard.length + player.hand.length + player.playArea.length;
      expect(totalCards).toBe(8); // All cards accounted for

      // Discard should be empty or deck should have cards (shuffle occurred)
      expect(player.deck.length + player.discard.length).toBeGreaterThan(0);
    }
  });

  test('should handle drawing more cards than available', () => {
    const state = engine.initializeGame(1);

    // Set up scenario with very few cards
    const modifiedState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Council Room'], // Draws 4 cards
        deck: ['Copper'], // Only 1 card
        discard: ['Estate'] // Only 1 card
      }]
    };

    // Play Council Room (tries to draw 4 cards, only 2 available)
    const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Council Room' });

    expect(result.success).toBe(true);
    if (result.newState) {
      const player = result.newState.players[0];

      // Should draw all available cards (2) even though card says draw 4
      expect(player.hand).toHaveLength(2); // Drew all available cards
      expect(player.deck).toHaveLength(0);
      expect(player.discard).toHaveLength(0);
    }
  });

  test('should validate playing treasures only in buy phase', () => {
    const state = engine.initializeGame(1);

    // Try to play treasure in action phase
    const modifiedState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Copper', 'Silver', 'Gold', 'Estate', 'Estate']
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Copper' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot play treasures outside buy phase');
  });

  test('should validate playing actions only in action phase', () => {
    const state = engine.initializeGame(1);

    // Try to play action in buy phase
    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        hand: ['Village', 'Copper', 'Silver', 'Estate', 'Estate']
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Village' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot play actions outside action phase');
  });

  test('should validate no actions remaining', () => {
    const state = engine.initializeGame(1);

    const modifiedState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Village', 'Smithy', 'Market', 'Copper', 'Estate'],
        actions: 0 // No actions left
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Village' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No actions remaining');
  });

  test('should validate no buys remaining', () => {
    const state = engine.initializeGame(1);

    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        coins: 10,
        buys: 0 // No buys left
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'buy', card: 'Silver' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No buys remaining');
  });

  test('should validate supply exhaustion', () => {
    const state = engine.initializeGame(1);

    // Empty the Silver supply
    const modifiedSupply = new Map(state.supply);
    modifiedSupply.set('Silver', 0);

    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      supply: modifiedSupply,
      players: [{
        ...state.players[0],
        coins: 10,
        buys: 1
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'buy', card: 'Silver' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not available in supply');
  });

  test('should detect game over with 3 empty piles', () => {
    const state = engine.initializeGame(1);

    // Empty 3 piles (not Province)
    const modifiedSupply = new Map(state.supply);
    modifiedSupply.set('Village', 0);
    modifiedSupply.set('Smithy', 0);
    modifiedSupply.set('Market', 0);

    const modifiedState: GameState = {
      ...state,
      supply: modifiedSupply
    };

    const victory = engine.checkGameOver(modifiedState);
    expect(victory.isGameOver).toBe(true);
    expect(victory.scores).toBeDefined();
  });

  test('should verify seeded randomness is deterministic', () => {
    const engine1 = new GameEngine('same-seed');
    const engine2 = new GameEngine('same-seed');

    const state1 = engine1.initializeGame(1);
    const state2 = engine2.initializeGame(1);

    // Same seed should produce same shuffle
    expect(state1.players[0].hand).toEqual(state2.players[0].hand);
    expect(state1.players[0].deck).toEqual(state2.players[0].deck);
  });

  test('should verify different seeds produce different results', () => {
    const engine1 = new GameEngine('seed-one');
    const engine2 = new GameEngine('seed-two');

    const state1 = engine1.initializeGame(1);
    const state2 = engine2.initializeGame(1);

    // Different seeds should produce different shuffles (very high probability)
    const sameHand = JSON.stringify(state1.players[0].hand) === JSON.stringify(state2.players[0].hand);
    const sameDeck = JSON.stringify(state1.players[0].deck) === JSON.stringify(state2.players[0].deck);

    expect(sameHand && sameDeck).toBe(false);
  });

  test('should complete a full turn cycle', () => {
    const state = engine.initializeGame(1);

    // Set up a complete turn scenario
    const modifiedState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Village', 'Copper', 'Copper', 'Silver', 'Estate'],
        deck: ['Smithy', 'Market', 'Gold', 'Silver', 'Province']
      }]
    };

    // Action phase: Play Village
    let result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Village' });
    expect(result.success).toBe(true);
    let currentState = result.newState!;

    expect(currentState.players[0].actions).toBe(2);
    expect(currentState.players[0].hand).toHaveLength(5);

    // End action phase
    result = engine.executeMove(currentState, { type: 'end_phase' });
    expect(result.success).toBe(true);
    currentState = result.newState!;
    expect(currentState.phase).toBe('buy');

    // Buy phase: Play treasures (play 2 coppers = 2 coins)
    result = engine.executeMove(currentState, { type: 'play_treasure', card: 'Copper' });
    expect(result.success).toBe(true);
    currentState = result.newState!;

    result = engine.executeMove(currentState, { type: 'play_treasure', card: 'Copper' });
    expect(result.success).toBe(true);
    currentState = result.newState!;
    expect(currentState.players[0].coins).toBe(2);

    // Buy a card (Estate costs 2)
    result = engine.executeMove(currentState, { type: 'buy', card: 'Estate' });
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error('Buy failed:', result.error);
    }
    currentState = result.newState!;
    expect(currentState.players[0].discard).toContain('Estate');

    // End buy phase
    result = engine.executeMove(currentState, { type: 'end_phase' });
    expect(result.success).toBe(true);
    currentState = result.newState!;
    expect(currentState.phase).toBe('cleanup');

    // End cleanup phase (triggers cleanup and new turn)
    result = engine.executeMove(currentState, { type: 'end_phase' });
    expect(result.success).toBe(true);
    currentState = result.newState!;

    // Verify new turn started
    expect(currentState.phase).toBe('action');
    expect(currentState.turnNumber).toBe(2);
    expect(currentState.players[0].hand).toHaveLength(5);
    expect(currentState.players[0].playArea).toHaveLength(0);
    expect(currentState.players[0].actions).toBe(1);
    expect(currentState.players[0].buys).toBe(1);
    expect(currentState.players[0].coins).toBe(0);
  });
});

// ============================================================================
// COMPREHENSIVE CARD TESTS
// ============================================================================

describe('GameEngine - Kingdom Card Effects', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('card-test-seed');
  });

  describe('Laboratory', () => {
    test('should draw 2 cards and give 1 action', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Laboratory', 'Copper', 'Copper'],
          deck: ['Village', 'Smithy', 'Market', 'Gold'],
          actions: 1
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Laboratory' });

      expect(result.success).toBe(true);
      if (result.newState) {
        const player = result.newState.players[0];
        expect(player.hand).toHaveLength(4); // 2 original + 2 drawn - 1 played = 3, but Laboratory draws 2 so 4
        expect(player.actions).toBe(1); // Started with 1, used 1, gained 1 = 1
        expect(player.playArea).toContain('Laboratory');
      }
    });

    test('should allow chaining multiple Laboratories', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Laboratory', 'Laboratory', 'Laboratory'],
          deck: ['Village', 'Smithy', 'Market', 'Gold', 'Silver', 'Copper'],
          actions: 1
        }]
      };

      let currentState = modifiedState;

      // Play first Laboratory
      let result = engine.executeMove(currentState, { type: 'play_action', card: 'Laboratory' });
      expect(result.success).toBe(true);
      currentState = result.newState!;
      expect(currentState.players[0].actions).toBe(1);

      // Play second Laboratory
      result = engine.executeMove(currentState, { type: 'play_action', card: 'Laboratory' });
      expect(result.success).toBe(true);
      currentState = result.newState!;
      expect(currentState.players[0].actions).toBe(1);

      // Play third Laboratory
      result = engine.executeMove(currentState, { type: 'play_action', card: 'Laboratory' });
      expect(result.success).toBe(true);
      currentState = result.newState!;
      expect(currentState.players[0].actions).toBe(1); // Still action-neutral
      expect(currentState.players[0].hand).toHaveLength(6); // Drew 6 total cards
    });
  });

  describe('Market', () => {
    test('should give +1 Card, +1 Action, +1 Coin, +1 Buy', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Market', 'Copper', 'Copper'],
          deck: ['Village', 'Smithy'],
          actions: 1,
          buys: 1,
          coins: 0
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Market' });

      expect(result.success).toBe(true);
      if (result.newState) {
        const player = result.newState.players[0];
        expect(player.hand).toHaveLength(3); // 2 + 1 drawn
        expect(player.actions).toBe(1); // 1 - 1 + 1 = 1
        expect(player.coins).toBe(1);
        expect(player.buys).toBe(2); // 1 + 1 = 2
        expect(player.playArea).toContain('Market');
      }
    });

    test('should enable multiple card purchases in one turn', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'buy',
        players: [{
          ...state.players[0],
          hand: ['Copper'],
          playArea: ['Market', 'Market'], // Played 2 Markets
          coins: 6, // Enough for 2 Estates
          buys: 3, // 1 base + 2 from Markets
          actions: 0
        }]
      };

      // Buy first Estate
      let result = engine.executeMove(modifiedState, { type: 'buy', card: 'Estate' });
      expect(result.success).toBe(true);
      let currentState = result.newState!;
      expect(currentState.players[0].buys).toBe(2);
      expect(currentState.players[0].coins).toBe(4);

      // Buy second Estate
      result = engine.executeMove(currentState, { type: 'buy', card: 'Estate' });
      expect(result.success).toBe(true);
      currentState = result.newState!;
      expect(currentState.players[0].buys).toBe(1);
      expect(currentState.players[0].coins).toBe(2);
      expect(currentState.players[0].discard.filter(c => c === 'Estate')).toHaveLength(2);
    });
  });

  describe('Woodcutter', () => {
    test('should give +2 Coins and +1 Buy', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Woodcutter', 'Copper', 'Copper'],
          deck: ['Village'],
          actions: 1,
          buys: 1,
          coins: 0
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Woodcutter' });

      expect(result.success).toBe(true);
      if (result.newState) {
        const player = result.newState.players[0];
        expect(player.coins).toBe(2);
        expect(player.buys).toBe(2);
        expect(player.actions).toBe(0); // Terminal card
        expect(player.playArea).toContain('Woodcutter');
      }
    });
  });

  describe('Festival', () => {
    test('should give +2 Actions, +2 Coins, +1 Buy', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Festival', 'Copper', 'Copper'],
          deck: ['Village'],
          actions: 1,
          buys: 1,
          coins: 0
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Festival' });

      expect(result.success).toBe(true);
      if (result.newState) {
        const player = result.newState.players[0];
        expect(player.actions).toBe(2); // 1 - 1 + 2 = 2
        expect(player.coins).toBe(2);
        expect(player.buys).toBe(2);
        expect(player.hand).toHaveLength(2); // No cards drawn
        expect(player.playArea).toContain('Festival');
      }
    });

    test('should allow chaining Festivals', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Festival', 'Festival', 'Festival'],
          deck: ['Village'],
          actions: 1,
          coins: 0
        }]
      };

      let currentState = modifiedState;

      // Play three Festivals
      for (let i = 0; i < 3; i++) {
        const result = engine.executeMove(currentState, { type: 'play_action', card: 'Festival' });
        expect(result.success).toBe(true);
        currentState = result.newState!;
      }

      const player = currentState.players[0];
      expect(player.actions).toBe(4); // 1 + 2 + 2 + 2 - 3 = 4
      expect(player.coins).toBe(6); // 2 * 3 = 6
      expect(player.buys).toBe(4); // 1 + 1 + 1 + 1 = 4
    });
  });

  describe('Cellar - Edge Cases', () => {
    test('should allow discarding 0 cards', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Cellar', 'Copper', 'Copper', 'Silver'],
          deck: ['Village', 'Smithy'],
          playArea: []
        }]
      };

      // Play Cellar
      let result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Cellar' });
      expect(result.success).toBe(true);
      const afterCellar = result.newState!;

      // Discard 0 cards
      result = engine.executeMove(afterCellar, { type: 'discard_for_cellar', cards: [] });
      expect(result.success).toBe(true);
      if (result.newState) {
        const player = result.newState.players[0];
        expect(player.hand).toHaveLength(3); // No change in hand size
        expect(player.actions).toBe(1); // Still has action from Cellar
      }
    });

    test('should reject discarding cards not in hand', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Copper', 'Copper'],
          deck: ['Village', 'Smithy'],
          playArea: ['Cellar']
        }]
      };

      const result = engine.executeMove(modifiedState, {
        type: 'discard_for_cellar',
        cards: ['Estate']
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot discard');
    });

    test('should handle discarding multiple copies of same card', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Estate', 'Estate', 'Estate', 'Copper'],
          deck: ['Village', 'Smithy', 'Market'],
          playArea: ['Cellar']
        }]
      };

      const result = engine.executeMove(modifiedState, {
        type: 'discard_for_cellar',
        cards: ['Estate', 'Estate', 'Estate']
      });

      expect(result.success).toBe(true);
      if (result.newState) {
        const player = result.newState.players[0];
        expect(player.hand).toHaveLength(4); // 1 Copper + 3 drawn
        expect(player.discard.filter(c => c === 'Estate')).toHaveLength(3);
      }
    });
  });
});

// ============================================================================
// TREASURE CARD TESTS
// ============================================================================

describe('GameEngine - Treasure Cards', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('treasure-test-seed');
  });

  test('should play Copper for +1 coin', () => {
    const state = engine.initializeGame(1);
    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Estate'],
        coins: 0
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Copper' });

    expect(result.success).toBe(true);
    if (result.newState) {
      expect(result.newState.players[0].coins).toBe(1);
      expect(result.newState.players[0].playArea).toContain('Copper');
    }
  });

  test('should play Silver for +2 coins', () => {
    const state = engine.initializeGame(1);
    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        hand: ['Silver', 'Copper', 'Estate'],
        coins: 0
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Silver' });

    expect(result.success).toBe(true);
    if (result.newState) {
      expect(result.newState.players[0].coins).toBe(2);
      expect(result.newState.players[0].playArea).toContain('Silver');
    }
  });

  test('should play Gold for +3 coins', () => {
    const state = engine.initializeGame(1);
    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        hand: ['Gold', 'Copper', 'Estate'],
        coins: 0
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Gold' });

    expect(result.success).toBe(true);
    if (result.newState) {
      expect(result.newState.players[0].coins).toBe(3);
      expect(result.newState.players[0].playArea).toContain('Gold');
    }
  });

  test('should accumulate coins from multiple treasures', () => {
    const state = engine.initializeGame(1);
    let modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Silver', 'Gold', 'Estate'],
        coins: 0
      }]
    };

    // Play all treasures
    let result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Copper' });
    expect(result.success).toBe(true);
    modifiedState = result.newState!;
    expect(modifiedState.players[0].coins).toBe(1);

    result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Copper' });
    modifiedState = result.newState!;
    expect(modifiedState.players[0].coins).toBe(2);

    result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Silver' });
    modifiedState = result.newState!;
    expect(modifiedState.players[0].coins).toBe(4);

    result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Gold' });
    modifiedState = result.newState!;
    expect(modifiedState.players[0].coins).toBe(7);
  });
});

// ============================================================================
// COMPREHENSIVE ERROR TESTS
// ============================================================================

describe('GameEngine - Error Validation', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('error-test-seed');
  });

  describe('E001 - Cannot play actions outside action phase', () => {
    test('should reject action play in buy phase', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'buy',
        players: [{
          ...state.players[0],
          hand: ['Village', 'Copper']
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Village' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot play actions outside action phase');
    });

    test('should reject action play in cleanup phase', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'cleanup',
        players: [{
          ...state.players[0],
          hand: ['Village', 'Copper']
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_action', card: 'Village' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot play actions outside action phase');
    });
  });

  describe('E002 - Cannot play treasures outside buy phase', () => {
    test('should reject treasure play in action phase', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Copper', 'Silver', 'Gold']
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Copper' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot play treasures outside buy phase');
    });

    test('should reject treasure play in cleanup phase', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'cleanup',
        players: [{
          ...state.players[0],
          hand: ['Copper']
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_treasure', card: 'Copper' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot play treasures outside buy phase');
    });
  });

  describe('E003 - Cannot buy cards outside buy phase', () => {
    test('should reject buy in action phase', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          coins: 10,
          buys: 1
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'buy', card: 'Silver' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot buy cards outside buy phase');
    });

    test('should reject buy in cleanup phase', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'cleanup',
        players: [{
          ...state.players[0],
          coins: 10,
          buys: 1
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'buy', card: 'Silver' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot buy cards outside buy phase');
    });
  });

  describe('E201 - Must specify card to play', () => {
    test('should reject play_action without card field', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          actions: 1
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'play_action' } as Move);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must specify card to play');
    });
  });

  describe('E202 - Must specify card to buy', () => {
    test('should reject buy without card field', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        phase: 'buy',
        players: [{
          ...state.players[0],
          coins: 10,
          buys: 1
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'buy' } as Move);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must specify card to buy');
    });
  });

  describe('E205 - Must specify cards to discard', () => {
    test('should reject discard_for_cellar without cards field', () => {
      const state = engine.initializeGame(1);
      const modifiedState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Estate', 'Copper'],
          playArea: ['Cellar']
        }]
      };

      const result = engine.executeMove(modifiedState, { type: 'discard_for_cellar' } as Move);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must specify cards to discard');
    });
  });

  describe('E301 - Unknown move type', () => {
    test('should reject invalid move type', () => {
      const state = engine.initializeGame(1);

      const result = engine.executeMove(state, { type: 'invalid_move' } as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown move type');
    });
  });
});

// ============================================================================
// MULTIPLAYER TESTS
// ============================================================================

describe('GameEngine - Multiplayer', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('multiplayer-seed');
  });

  test('should initialize 2-player game correctly', () => {
    const state = engine.initializeGame(2);

    expect(state.players).toHaveLength(2);
    expect(state.currentPlayer).toBe(0);
    expect(state.phase).toBe('action');

    // Each player should have proper starting conditions
    state.players.forEach(player => {
      expect(player.hand).toHaveLength(5);
      expect(player.deck).toHaveLength(5);
      expect(player.actions).toBe(1);
      expect(player.buys).toBe(1);
      expect(player.coins).toBe(0);
    });
  });

  test('should rotate turns between players', () => {
    const state = engine.initializeGame(2);

    // Player 0's turn
    expect(state.currentPlayer).toBe(0);

    // End player 0's turn (action -> buy -> cleanup -> next player)
    let result = engine.executeMove(state, { type: 'end_phase' }); // Action -> Buy
    result = engine.executeMove(result.newState!, { type: 'end_phase' }); // Buy -> Cleanup
    result = engine.executeMove(result.newState!, { type: 'end_phase' }); // Cleanup -> Next Player

    // Now it's player 1's turn
    expect(result.newState!.currentPlayer).toBe(1);
    expect(result.newState!.phase).toBe('action');
    expect(result.newState!.turnNumber).toBe(1); // Still turn 1

    // End player 1's turn
    result = engine.executeMove(result.newState!, { type: 'end_phase' });
    result = engine.executeMove(result.newState!, { type: 'end_phase' });
    result = engine.executeMove(result.newState!, { type: 'end_phase' });

    // Back to player 0, turn increments
    expect(result.newState!.currentPlayer).toBe(0);
    expect(result.newState!.turnNumber).toBe(2);
  });

  test('should correctly determine winner in 2-player game', () => {
    const state = engine.initializeGame(2);

    // Give player 0 more victory points
    const modifiedState: GameState = {
      ...state,
      players: [
        {
          ...state.players[0],
          deck: ['Province', 'Province', 'Duchy'],
          hand: ['Estate', 'Copper', 'Copper', 'Copper', 'Copper'],
          discard: []
        },
        {
          ...state.players[1],
          deck: ['Estate', 'Estate', 'Copper'],
          hand: ['Copper', 'Copper', 'Copper', 'Copper', 'Copper'],
          discard: []
        }
      ],
      supply: new Map(state.supply).set('Province', 0) // Trigger game end
    };

    const victory = engine.checkGameOver(modifiedState);

    expect(victory.isGameOver).toBe(true);
    expect(victory.winner).toBe(0);
    expect(victory.scores).toEqual([16, 1]); // Player 0: 12+3+1=16, Player 1: 1
  });
});

// ============================================================================
// COMPLEX GAME SCENARIOS
// ============================================================================

describe('GameEngine - Complex Scenarios', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('complex-seed');
  });

  test('should handle Province + Duchy double buy', () => {
    const state = engine.initializeGame(1);
    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        hand: ['Copper'],
        playArea: ['Market', 'Market', 'Gold', 'Gold'], // 2+6=8 coins + 2 buys
        coins: 13, // Enough for Province + Duchy
        buys: 3,
        actions: 0
      }]
    };

    // Buy Province
    let result = engine.executeMove(modifiedState, { type: 'buy', card: 'Province' });
    expect(result.success).toBe(true);
    let currentState = result.newState!;
    expect(currentState.players[0].coins).toBe(5);
    expect(currentState.players[0].buys).toBe(2);

    // Buy Duchy
    result = engine.executeMove(currentState, { type: 'buy', card: 'Duchy' });
    expect(result.success).toBe(true);
    currentState = result.newState!;
    expect(currentState.players[0].coins).toBe(0);
    expect(currentState.players[0].buys).toBe(1);
    expect(currentState.players[0].discard).toContain('Province');
    expect(currentState.players[0].discard).toContain('Duchy');
  });

  test('should handle Village → Smithy → Market chain', () => {
    const state = engine.initializeGame(1);
    const modifiedState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Village', 'Smithy', 'Market'],
        deck: ['Copper', 'Copper', 'Copper', 'Silver', 'Gold', 'Estate'],
        actions: 1,
        buys: 1,
        coins: 0
      }]
    };

    let currentState = modifiedState;

    // Play Village
    let result = engine.executeMove(currentState, { type: 'play_action', card: 'Village' });
    currentState = result.newState!;
    expect(currentState.players[0].actions).toBe(2); // 1 - 1 + 2 = 2
    expect(currentState.players[0].hand).toHaveLength(3); // 2 + 1 drawn

    // Play Smithy
    result = engine.executeMove(currentState, { type: 'play_action', card: 'Smithy' });
    currentState = result.newState!;
    expect(currentState.players[0].actions).toBe(1); // 2 - 1 = 1
    expect(currentState.players[0].hand).toHaveLength(5); // 2 + 3 drawn

    // Play Market
    result = engine.executeMove(currentState, { type: 'play_action', card: 'Market' });
    currentState = result.newState!;
    expect(currentState.players[0].actions).toBe(1); // 1 - 1 + 1 = 1
    expect(currentState.players[0].coins).toBe(1);
    expect(currentState.players[0].buys).toBe(2);
    expect(currentState.players[0].hand).toHaveLength(5); // 4 + 1 drawn
  });

  test('should handle exact coin purchases', () => {
    const state = engine.initializeGame(1);
    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        coins: 8, // Exactly Province cost
        buys: 1
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'buy', card: 'Province' });

    expect(result.success).toBe(true);
    expect(result.newState!.players[0].coins).toBe(0);
    expect(result.newState!.players[0].discard).toContain('Province');
  });

  test('should handle buying with one coin short', () => {
    const state = engine.initializeGame(1);
    const modifiedState: GameState = {
      ...state,
      phase: 'buy',
      players: [{
        ...state.players[0],
        coins: 7, // One short of Province
        buys: 1
      }]
    };

    const result = engine.executeMove(modifiedState, { type: 'buy', card: 'Province' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not enough coins');
  });
});