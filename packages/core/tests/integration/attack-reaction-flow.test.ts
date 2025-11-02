import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Integration Tests: Attack/Reaction Flow
 * Source: docs/requirements/phase-4/TESTING.md
 *
 * @req: Test attack resolution with reactions in multiplayer
 * @level: Integration
 * @count: 10 tests total
 */

describe('IT: Attack/Reaction Flow', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('attack-flow-test');
  });

  test('IT-ATTACK-1: should resolve Militia in 3-player game', () => {
    const state = engine.initializeGame(3);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      players: [
        { ...state.players[0], hand: ['Militia'], actions: 1 },
        { ...state.players[1], hand: Array(6).fill('Copper') }, // 6 cards
        { ...state.players[2], hand: Array(4).fill('Silver') }  // 4 cards
      ]
    };

    const militia = engine.executeMove(testState, { type: 'play_action', card: 'Militia' });
    expect(militia.success).toBe(true);

    // P1 discards to 3, P2 discards to 3
    expect(militia.message).toContain('discard');
  });

  test('IT-ATTACK-2: should handle mixed Moat reveals (3-player)', () => {
    const state = engine.initializeGame(3);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      supply: new Map([...state.supply, ['Curse', 20]]),
      players: [
        { ...state.players[0], hand: ['Witch'], actions: 1 },
        { ...state.players[1], hand: ['Moat', 'Copper'] }, // Has Moat
        { ...state.players[2], hand: ['Copper', 'Silver'] } // No Moat
      ]
    };

    const witch = engine.executeMove(testState, { type: 'play_action', card: 'Witch' });

    // P1 reveals Moat (blocked)
    const moat = engine.executeMove(witch.newState!, { type: 'reveal_reaction', card: 'Moat' });

    expect(moat.newState!.players[1].discard).not.toContain('Curse'); // Blocked
    expect(moat.newState!.players[2].discard).toContain('Curse'); // Not blocked
  });

  test('IT-ATTACK-3: should process attacks sequentially', () => {
    const state = engine.initializeGame(3);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      players: [
        { ...state.players[0], hand: ['Spy'], deck: ['Copper'], actions: 1 },
        { ...state.players[1], deck: ['Estate'] },
        { ...state.players[2], deck: ['Gold'] }
      ]
    };

    const spy = engine.executeMove(testState, { type: 'play_action', card: 'Spy' });

    // P0 decides on own card
    const decision1 = engine.executeMove(spy.newState!, {
      type: 'spy_decision', player: 0, card: 'Copper', decision: 'discard'
    });

    // P0 decides on P1's card
    const decision2 = engine.executeMove(decision1.newState!, {
      type: 'spy_decision', player: 1, card: 'Estate', decision: 'keep'
    });

    // P0 decides on P2's card
    const decision3 = engine.executeMove(decision2.newState!, {
      type: 'spy_decision', player: 2, card: 'Gold', decision: 'discard'
    });

    expect(decision3.success).toBe(true);
    expect(decision3.newState!.players[0].discard).toContain('Copper');
    expect(decision3.newState!.players[1].deck[0]).toBe('Estate');
    expect(decision3.newState!.players[2].discard).toContain('Gold');
  });

  test('IT-ATTACK-4: should handle attack chain (Militia + Witch)', () => {
    const state = engine.initializeGame(2);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      supply: new Map([...state.supply, ['Curse', 10]]),
      players: [
        { ...state.players[0], hand: ['Militia', 'Witch'], actions: 2 },
        { ...state.players[1], hand: Array(5).fill('Copper') } // 5 cards
      ]
    };

    // Play Militia first
    const militia = engine.executeMove(testState, { type: 'play_action', card: 'Militia' });
    const discard = engine.executeMove(militia.newState!, {
      type: 'discard_to_hand_size',
      cards: ['Copper', 'Copper'],
      target_size: 3
    });

    expect(discard.newState!.players[1].hand.length).toBe(3);

    // Play Witch second
    const witch = engine.executeMove(discard.newState!, { type: 'play_action', card: 'Witch' });

    expect(witch.newState!.players[1].discard).toContain('Curse');
    expect(witch.newState!.players[1].hand.length).toBe(3); // Still 3
  });

  test('IT-ATTACK-5: Moat stays in hand after reveal', () => {
    const state = engine.initializeGame(2);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      players: [
        { ...state.players[0], hand: ['Militia'], actions: 1 },
        { ...state.players[1], hand: ['Moat', 'Copper', 'Copper', 'Silver', 'Estate'] }
      ]
    };

    const militia = engine.executeMove(testState, { type: 'play_action', card: 'Militia' });
    const moat = engine.executeMove(militia.newState!, { type: 'reveal_reaction', card: 'Moat' });

    expect(moat.newState!.players[1].hand).toContain('Moat'); // Still in hand
    expect(moat.newState!.players[1].hand.length).toBe(5); // Unchanged
  });

  test('IT-ATTACK-6: Multiple attacks blocked by same Moat', () => {
    const state = engine.initializeGame(2);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      supply: new Map([...state.supply, ['Curse', 10]]),
      players: [
        { ...state.players[0], hand: ['Militia', 'Witch', 'Bureaucrat'], actions: 3 },
        { ...state.players[1], hand: ['Moat', 'Estate', 'Copper', 'Silver', 'Gold'] }
      ]
    };

    // Attack 1: Militia
    const militia = engine.executeMove(testState, { type: 'play_action', card: 'Militia' });
    const moat1 = engine.executeMove(militia.newState!, { type: 'reveal_reaction', card: 'Moat' });

    // Attack 2: Witch
    const witch = engine.executeMove(moat1.newState!, { type: 'play_action', card: 'Witch' });
    const moat2 = engine.executeMove(witch.newState!, { type: 'reveal_reaction', card: 'Moat' });

    // Attack 3: Bureaucrat
    const bureaucrat = engine.executeMove(moat2.newState!, { type: 'play_action', card: 'Bureaucrat' });
    const moat3 = engine.executeMove(bureaucrat.newState!, { type: 'reveal_reaction', card: 'Moat' });

    expect(moat3.newState!.players[1].hand.length).toBe(5); // All attacks blocked
    expect(moat3.newState!.players[1].discard).not.toContain('Curse');
  });

  test('IT-ATTACK-7: Throne Room + Militia (+$4, discard once)', () => {
    const state = engine.initializeGame(2);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      players: [
        { ...state.players[0], hand: ['Throne Room', 'Militia'], actions: 1, coins: 0 },
        { ...state.players[1], hand: Array(7).fill('Copper') } // 7 cards
      ]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const militia = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Militia' });

    expect(militia.newState!.players[0].coins).toBe(4); // +$2 twice

    // First discard: 7 → 3
    const discard1 = engine.executeMove(militia.newState!, {
      type: 'discard_to_hand_size',
      cards: ['Copper', 'Copper', 'Copper', 'Copper'],
      target_size: 3
    });

    expect(discard1.newState!.players[1].hand.length).toBe(3);

    // Second Militia: already at 3, no additional discard
    expect(discard1.newState!.players[1].hand.length).toBe(3);
  });

  test('IT-ATTACK-8: Throne Room + Witch (+4 Cards, 2 Curses)', () => {
    const state = engine.initializeGame(2);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      supply: new Map([...state.supply, ['Curse', 10]]),
      players: [
        { ...state.players[0], hand: ['Throne Room', 'Witch'], deck: Array(4).fill('Silver'), actions: 1 },
        { ...state.players[1], hand: ['Copper'] }
      ]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const witch = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Witch' });

    expect(witch.newState!.players[0].hand.length).toBe(4); // +2 Cards twice
    expect(witch.newState!.players[1].discard.filter(c => c === 'Curse').length).toBe(2);
    expect(witch.newState!.supply.get('Curse')).toBe(8);
  });

  test('IT-ATTACK-9: Throne Room + Bureaucrat (2 Silvers to deck)', () => {
    const state = engine.initializeGame(2);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      supply: new Map([...state.supply, ['Silver', 40]]),
      players: [
        { ...state.players[0], hand: ['Throne Room', 'Bureaucrat'], deck: ['Copper'], actions: 1 },
        { ...state.players[1], hand: ['Estate', 'Duchy'] }
      ]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const bureaucrat = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Bureaucrat' });

    expect(bureaucrat.newState!.players[0].deck[0]).toBe('Silver');
    expect(bureaucrat.newState!.players[0].deck[1]).toBe('Silver');
    expect(bureaucrat.newState!.supply.get('Silver')).toBe(38);
  });

  test('IT-ATTACK-10: Throne Room + Thief (reveal 4, steal 2)', () => {
    const state = engine.initializeGame(2);

    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      players: [
        { ...state.players[0], hand: ['Throne Room', 'Thief'], actions: 1 },
        { ...state.players[1], deck: ['Silver', 'Copper', 'Gold', 'Estate'] }
      ]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const thief = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Thief' });

    // First reveal: Silver, Copper
    const trash1 = engine.executeMove(thief.newState!, {
      type: 'select_treasure_to_trash', player: 1, card: 'Silver'
    });

    // Second reveal: Gold, Estate
    const trash2 = engine.executeMove(trash1.newState!, {
      type: 'select_treasure_to_trash', player: 1, card: 'Gold'
    });

    expect(trash2.newState!.trash).toContain('Silver');
    expect(trash2.newState!.trash).toContain('Gold');
  });
});
