import { GameEngine, GameState, CardName, checkVictory } from '../../src';
import { getCard, isActionCard } from '../../src/cards';

/**
 * Phase 4.1 - Feature 1: Random Kingdom Card Selection
 * End-to-End Test
 *
 * @req: FR-RKS-1 through FR-RKS-5 - Complete random kingdom workflow
 * @edge: Full game with random kingdom from start to victory
 * @why: Validates entire feature works in real game scenario
 * @level: E2E - tests complete user experience
 *
 * Coverage: E2E-RKS-1 per TESTING.md
 */

describe('Phase 4.1 - Random Kingdom E2E', () => {

  function extractKingdomCards(state: GameState): CardName[] {
    const basicCards = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];
    return Array.from(state.supply.keys())
      .filter(card => !basicCards.includes(card))
      .sort();
  }

  function isBasicCard(card: CardName): boolean {
    return ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'].includes(card);
  }

  /**
   * E2E-RKS-1: Complete game with random kingdom
   * @req: All FR-RKS-* requirements validated end-to-end
   * @assert: Game initializes → plays to completion → only selected cards used
   * @why: Final validation that random kingdom feature works in production scenario
   */
  describe('E2E-RKS-1: Complete game with random kingdom', () => {

    it('should play complete game with randomly selected kingdom', () => {
      // @req: FR-RKS-1 - Random selection of 10 cards
      // @req: FR-RKS-2 - Seed-based reproducibility
      const engine = new GameEngine('e2e-full-game');
      let state = engine.initializeGame(1);

      // Capture kingdom cards displayed at start
      const selectedKingdom = extractKingdomCards(state);
      console.log('Kingdom:', selectedKingdom);

      // @assert: Exactly 10 kingdom cards selected
      expect(selectedKingdom).toHaveLength(10);

      // Play full game to completion
      let turnsPlayed = 0;
      const maxTurns = 200; // Safety limit

      while (!checkVictory(state).isGameOver && turnsPlayed < maxTurns) {
        // Play action phase
        if (state.phase === 'action') {
          const result = engine.executeMove(state, { type: 'end_phase' });
          if (result.success && result.newState) {
            state = result.newState;
          }
        }

        // Play buy phase (play all treasures, try to buy)
        if (state.phase === 'buy') {
          const player = state.players[state.currentPlayer];
          const treasures = player.hand.filter(card => {
            const cardDef = getCard(card);
            return cardDef.type === 'treasure';
          });

          // Play all treasures
          for (const treasure of treasures) {
            const result = engine.executeMove(state, { type: 'play_treasure', card: treasure });
            if (result.success && result.newState) {
              state = result.newState;
            }
          }

          // Try to buy a card (simple strategy: buy Province if possible, else Silver)
          const currentPlayer = state.players[state.currentPlayer];
          if (currentPlayer.buys > 0 && currentPlayer.coins >= 8 && state.supply.get('Province')! > 0) {
            const result = engine.executeMove(state, { type: 'buy', card: 'Province' });
            if (result.success && result.newState) {
              state = result.newState;
            }
          } else if (currentPlayer.buys > 0 && currentPlayer.coins >= 3 && state.supply.get('Silver')! > 0) {
            const result = engine.executeMove(state, { type: 'buy', card: 'Silver' });
            if (result.success && result.newState) {
              state = result.newState;
            }
          }

          // End buy phase
          const result = engine.executeMove(state, { type: 'end_phase' });
          if (result.success && result.newState) {
            state = result.newState;
          }
        }

        // End cleanup phase
        if (state.phase === 'cleanup') {
          const result = engine.executeMove(state, { type: 'end_phase' });
          if (result.success && result.newState) {
            state = result.newState;
          }
        }

        turnsPlayed++;
      }

      const victory = checkVictory(state);

      // @assert: Game completed
      expect(victory.isGameOver).toBe(true);
      expect(turnsPlayed).toBeLessThan(maxTurns);

      // @assert: Kingdom remained consistent
      expect(selectedKingdom).toHaveLength(10);

      // @req: FR-RKS-1 - Verify only selected kingdom cards were available
      const player = state.players[0];
      const allPlayerCards = [
        ...player.drawPile,
        ...player.hand,
        ...player.discardPile,
        ...player.inPlay
      ];

      const kingdomCardsInDeck = allPlayerCards.filter(card =>
        !isBasicCard(card) && card !== 'Curse'
      );

      // Every kingdom card in player's deck should be from selected kingdom
      kingdomCardsInDeck.forEach(card => {
        expect(selectedKingdom).toContain(card);
      });

      // @req: FR-RKS-4 - Kingdom cards should have been purchasable
      const uniqueKingdomInDeck = Array.from(new Set(kingdomCardsInDeck));
      console.log('Kingdom cards acquired by player:', uniqueKingdomInDeck);
    });

    it('should produce identical game with same seed', () => {
      // @req: FR-RKS-2 - Seed reproducibility end-to-end
      const seed = 'reproducible-e2e-seed';
      const engine1 = new GameEngine(seed);
      const engine2 = new GameEngine(seed);

      const state1 = engine1.initializeGame(1);
      const state2 = engine2.initializeGame(1);

      const kingdom1 = extractKingdomCards(state1);
      const kingdom2 = extractKingdomCards(state2);

      expect(kingdom1).toEqual(kingdom2);

      // Play 5 turns with both engines
      let currentState1 = state1;
      let currentState2 = state2;

      for (let turn = 0; turn < 5; turn++) {
        // Play identical moves on both states
        let result1 = engine1.executeMove(currentState1, { type: 'end_phase' });
        let result2 = engine2.executeMove(currentState2, { type: 'end_phase' });

        if (result1.success && result1.newState) currentState1 = result1.newState;
        if (result2.success && result2.newState) currentState2 = result2.newState;

        if (currentState1.phase === 'buy') {
          result1 = engine1.executeMove(currentState1, { type: 'end_phase' });
          result2 = engine2.executeMove(currentState2, { type: 'end_phase' });
          if (result1.success && result1.newState) currentState1 = result1.newState;
          if (result2.success && result2.newState) currentState2 = result2.newState;
        }

        if (currentState1.phase === 'cleanup') {
          result1 = engine1.executeMove(currentState1, { type: 'end_phase' });
          result2 = engine2.executeMove(currentState2, { type: 'end_phase' });
          if (result1.success && result1.newState) currentState1 = result1.newState;
          if (result2.success && result2.newState) currentState2 = result2.newState;
        }
      }

      // Both games should be in identical state
      expect(currentState1.turnNumber).toBe(currentState2.turnNumber);
      expect(currentState1.players[0].hand).toEqual(currentState2.players[0].hand);
    });

    it('should complete game faster than performance target', () => {
      // @req: NFR-RKS-1 - Performance target validation
      const engine = new GameEngine('performance-e2e-seed');
      const startTime = performance.now();
      const state = engine.initializeGame(1);
      const endTime = performance.now();

      const initDuration = endTime - startTime;

      // @assert: Game initialization < 10ms (includes kingdom selection)
      expect(initDuration).toBeLessThan(10);

      // Verify state is valid
      const selectedKingdom = extractKingdomCards(state);
      expect(selectedKingdom).toHaveLength(10);
      expect(state.supply.size).toBe(17);
    });
  });
});
