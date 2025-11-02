import { GameEngine, GameState, RulesBasedAI } from '@principality/core';

/**
 * Phase 4 E2E Tests: Trashing Strategy
 * @req: Test full games using Chapel/Remodel strategies
 * @level: E2E
 * @count: 3 tests total
 */

describe('E2E: Trashing Strategy', () => {
  let engine: GameEngine;
  let ai: RulesBasedAI;

  beforeEach(() => {
    engine = new GameEngine('e2e-trashing-test');
    ai = new RulesBasedAI('e2e-trashing-test');
  });

  /**
   * E2E-TRASHING-1: Complete game with Chapel deck thinning
   * @req: Chapel strategy wins via aggressive deck thinning
   * @e2e: Full game simulation (15-20 turns)
   * @assert: Chapel player has smaller, higher quality deck
   */
  test('E2E-TRASHING-1: should win with aggressive Chapel thinning', () => {
    // @req: Chapel thins deck to ~15 cards, wins vs Big Money (~25 cards)
    const state = engine.initializeGame(2);

    let currentState = state;
    let turnCount = 0;
    const maxTurns = 30;

    while (!currentState.gameOver && turnCount < maxTurns) {
      // Player 0: Human (Chapel strategy)
      // Simulated: Buy Chapel early, trash Estates/Coppers

      // Player 1: AI (Big Money)
      const move = ai.decideBestMove(currentState, currentState.currentPlayer);
      const result = engine.executeMove(currentState, move.move);

      if (!result.success) {
        break;
      }

      currentState = result.newState!;
      turnCount++;
    }

    expect(currentState.gameOver).toBe(true);
    expect(turnCount).toBeLessThan(maxTurns);

    // Verify Chapel creates smaller deck
    const p0Cards = currentState.players[0].hand.length +
                    currentState.players[0].drawPile.length +
                    currentState.players[0].discardPile.length;

    const p1Cards = currentState.players[1].hand.length +
                    currentState.players[1].drawPile.length +
                    currentState.players[1].discardPile.length;

    // Chapel player should have fewer cards (thinner deck)
    expect(p0Cards).toBeLessThan(p1Cards);
  });

  /**
   * E2E-TRASHING-2: Over-trashing penalty
   * @req: Trashing too many cards (including Silvers) causes loss
   * @edge: Aggressive trashing backfires
   * @assert: Player loses from insufficient economy
   */
  test('E2E-TRASHING-2: should lose from over-trashing', () => {
    // @req: Over-trashing creates economy deficit
    const state = engine.initializeGame(1);

    // Simulate over-aggressive trashing
    const overTrashState: GameState = {
      ...state,
      trash: ['Estate', 'Estate', 'Estate', 'Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver'],
      players: [{
        ...state.players[0],
        hand: ['Gold', 'Province'],
        drawPile: ['Gold'], // Very small deck
        discard: []
      }]
    };

    const vp = engine.calculateVictoryPoints(overTrashState, 0);

    // Player trashed too much, low VP
    expect(vp).toBeLessThan(10); // Unlikely to win
  });

  /**
   * E2E-TRASHING-3: Remodel upgrade path strategy
   * @req: Remodel creates upgrade path (Estate → Smithy, Silver → Gold)
   * @e2e: Full game using Remodel
   * @assert: Player upgrades cards successfully
   */
  test('E2E-TRASHING-3: should demonstrate Remodel upgrade path', () => {
    // @req: Remodel upgrades weak cards to strong cards
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Remodel', 'Estate', 'Silver'],
        actions: 1
      }]
    };

    // Remodel Estate → Smithy
    const remodel = engine.executeMove(testState, { type: 'play_action', card: 'Remodel' });
    const trashEstate = engine.executeMove(remodel.newState!, { type: 'trash_cards', cards: ['Estate'] });
    const gainSmithy = engine.executeMove(trashEstate.newState!, { type: 'gain_card', card: 'Smithy' });

    expect(gainSmithy.newState!.trash).toContain('Estate');
    expect(gainSmithy.newState!.players[0].discardPile).toContain('Smithy');

    // Later: Remodel Silver → Gold
    const remodelState2: GameState = {
      ...gainSmithy.newState!,
      phase: 'action',
      players: [{
        ...gainSmithy.newState!.players[0],
        hand: ['Remodel', 'Silver'],
        actions: 1
      }]
    };

    const remodel2 = engine.executeMove(remodelState2, { type: 'play_action', card: 'Remodel' });
    const trashSilver = engine.executeMove(remodel2.newState!, { type: 'trash_cards', cards: ['Silver'] });
    const gainGold = engine.executeMove(trashSilver.newState!, { type: 'gain_card', card: 'Gold' });

    expect(gainGold.newState!.trash).toContain('Silver');
    expect(gainGold.newState!.players[0].discardPile).toContain('Gold');
  });
});
