import { GameEngine } from '../../src/game';
import { GameState, CardName, Move } from '../../src/types';
import { getCard } from '../../src/cards';

// @req: FR-RKS-1, FR-RKS-2, FR-RKS-4, FR-RKS-5 - Integration tests for kingdom selection
// @edge: Full game flow | move execution with random kingdom | explicit override
// @why: Validates kingdom selection integrates with game engine and move execution
// @level: integration

describe('Phase 4.1 - Feature 1: Random Kingdom Integration', () => {

  function extractKingdomCards(state: GameState): CardName[] {
    const basicCards = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];
    return Array.from(state.supply.keys())
      .filter(card => !basicCards.includes(card))
      .sort();
  }

  function playSimpleTurn(engine: GameEngine, state: GameState): GameState {
    // Play treasures and end phases
    let currentState = state;

    // Play all treasures
    const player = currentState.players[currentState.currentPlayer];
    const treasures = player.hand.filter(card => {
      const cardDef = getCard(card);
      return cardDef.type === 'treasure';
    });

    for (const treasure of treasures) {
      const result = engine.executeMove(currentState, { type: 'play_treasure', card: treasure });
      if (result.success && result.newState) {
        currentState = result.newState;
      }
    }

    // End action phase if still in it
    if (currentState.phase === 'action') {
      const result = engine.executeMove(currentState, { type: 'end_phase' });
      if (result.success && result.newState) {
        currentState = result.newState;
      }
    }

    // End buy phase
    if (currentState.phase === 'buy') {
      const result = engine.executeMove(currentState, { type: 'end_phase' });
      if (result.success && result.newState) {
        currentState = result.newState;
      }
    }

    // End cleanup phase
    if (currentState.phase === 'cleanup') {
      const result = engine.executeMove(currentState, { type: 'end_phase' });
      if (result.success && result.newState) {
        currentState = result.newState;
      }
    }

    return currentState;
  }

  describe('IT-RKS-1: Full game with random kingdom', () => {
    // @req: FR-RKS-1 - Validate complete game flow with random kingdom
    // @assert: Game plays correctly with randomly selected kingdom cards
    // @why: Ensures random kingdom doesn't break game mechanics

    it('should initialize and play multiple turns with random kingdom', () => {
      const engine = new GameEngine('integration-test-001');
      let state = engine.initializeGame(2);

      const selectedKingdom = extractKingdomCards(state);
      expect(selectedKingdom).toHaveLength(10);

      // Play 3 turns
      for (let i = 0; i < 3; i++) {
        state = playSimpleTurn(engine, state);
        expect(state.turnNumber).toBeGreaterThan(i + 1);
      }

      // Verify kingdom cards are still only the selected ones
      const kingdomAfter = extractKingdomCards(state);
      expect(kingdomAfter.sort()).toEqual(selectedKingdom.sort());
    });

    it('should allow buying selected kingdom cards', () => {
      const engine = new GameEngine('buy-test-001');
      let state = engine.initializeGame(1);

      const selectedKingdom = extractKingdomCards(state);
      const cardToBuy = selectedKingdom.find(card => getCard(card).cost <= 3);

      expect(cardToBuy).toBeDefined();

      // Set up buy phase with enough coins
      const buyState: GameState = {
        ...state,
        phase: 'buy',
        players: [{
          ...state.players[0],
          coins: 10,
          buys: 1
        }]
      };

      const result = engine.executeMove(buyState, { type: 'buy', card: cardToBuy! });

      expect(result.success).toBe(true);
      expect(result.newState).toBeDefined();
      expect(result.newState!.players[0].discardPile).toContain(cardToBuy!);
    });

    it('should NOT allow buying non-selected kingdom cards', () => {
      const engine = new GameEngine('exclusion-test-001');
      const state = engine.initializeGame(1);

      const selectedKingdom = extractKingdomCards(state);
      const allKingdomCards = Object.keys(require('../../src/cards').KINGDOM_CARDS);
      const notSelected = allKingdomCards.find(card => !selectedKingdom.includes(card));

      expect(notSelected).toBeDefined();

      // Card should not be in supply
      expect(state.supply.has(notSelected!)).toBe(false);

      // Set up buy phase
      const buyState: GameState = {
        ...state,
        phase: 'buy',
        players: [{
          ...state.players[0],
          coins: 10,
          buys: 1
        }]
      };

      const result = engine.executeMove(buyState, { type: 'buy', card: notSelected! });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not available|not in supply/i);
    });
  });

  describe('IT-RKS-2: CLI displays kingdom at game start', () => {
    // @req: FR-RKS-4 - Validate CLI integration
    // @assert: Selected kingdom is accessible for display
    // @why: Players need to see which cards are available

    it('should expose selected kingdom cards in game state', () => {
      const engine = new GameEngine('cli-display-test');
      const state = engine.initializeGame(1);

      const selectedKingdom = extractKingdomCards(state);

      // Verify kingdom is accessible from state
      expect(selectedKingdom).toHaveLength(10);
      expect(Array.isArray(selectedKingdom)).toBe(true);

      // Verify all selected cards are valid kingdom cards
      selectedKingdom.forEach(card => {
        const cardDef = getCard(card);
        expect(cardDef).toBeDefined();
        expect(['action', 'action-attack', 'action-reaction']).toContain(cardDef.type);
      });
    });

    it('should maintain kingdom selection throughout game', () => {
      const engine = new GameEngine('persistence-test');
      let state = engine.initializeGame(1);

      const initialKingdom = extractKingdomCards(state);

      // Play several turns
      for (let i = 0; i < 5; i++) {
        state = playSimpleTurn(engine, state);
      }

      const laterKingdom = extractKingdomCards(state);

      // Kingdom should not change mid-game
      expect(laterKingdom.sort()).toEqual(initialKingdom.sort());
    });
  });

  describe('IT-RKS-3: Explicit kingdom overrides random selection', () => {
    // @req: FR-RKS-5 - Validate option precedence
    // @assert: Explicit kingdomCards parameter takes precedence over random
    // @why: Critical for test stability and specific scenarios

    it('should use explicit kingdom regardless of seed', () => {
      const explicitCards: CardName[] = [
        'Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
        'Woodcutter', 'Cellar', 'Chapel', 'Remodel', 'Mine'
      ];
      const options = { kingdomCards: explicitCards };

      const engine1 = new GameEngine('seed-1');
      const engine2 = new GameEngine('seed-2');

      const state1 = engine1.initializeGame(1, options);
      const state2 = engine2.initializeGame(1, options);

      const kingdom1 = extractKingdomCards(state1);
      const kingdom2 = extractKingdomCards(state2);

      expect(kingdom1.sort()).toEqual(explicitCards.sort());
      expect(kingdom2.sort()).toEqual(explicitCards.sort());
      expect(kingdom1).toEqual(kingdom2);
    });

    it('should allow buying explicit kingdom cards', () => {
      const explicitCards: CardName[] = [
        'Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
        'Woodcutter', 'Cellar', 'Chapel', 'Remodel', 'Mine'
      ];
      const options = { kingdomCards: explicitCards };

      const engine = new GameEngine('explicit-buy-test');
      let state = engine.initializeGame(1, options);

      // Verify explicit cards are in supply
      explicitCards.forEach(card => {
        expect(state.supply.has(card)).toBe(true);
      });

      // Buy one of the explicit cards
      const buyState: GameState = {
        ...state,
        phase: 'buy',
        players: [{
          ...state.players[0],
          coins: 10,
          buys: 1
        }]
      };

      const result = engine.executeMove(buyState, { type: 'buy', card: 'Village' });

      expect(result.success).toBe(true);
      expect(result.newState!.players[0].discardPile).toContain('Village');
    });

    it('should maintain explicit kingdom across game sessions', () => {
      const explicitCards: CardName[] = [
        'Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
        'Woodcutter', 'Cellar', 'Chapel', 'Remodel', 'Mine'
      ];
      const options = { kingdomCards: explicitCards };

      const engine = new GameEngine('session-test');

      // Initialize multiple games with same explicit kingdom
      const state1 = engine.initializeGame(1, options);
      const state2 = engine.initializeGame(2, options);
      const state3 = engine.initializeGame(1, options);

      const kingdom1 = extractKingdomCards(state1);
      const kingdom2 = extractKingdomCards(state2);
      const kingdom3 = extractKingdomCards(state3);

      expect(kingdom1.sort()).toEqual(explicitCards.sort());
      expect(kingdom2.sort()).toEqual(explicitCards.sort());
      expect(kingdom3.sort()).toEqual(explicitCards.sort());
    });
  });
});
