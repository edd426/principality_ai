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
});