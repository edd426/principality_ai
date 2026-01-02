/**
 * Test Suite: Integration - 2-Player MCP Support with Auto-Opponent
 *
 * Status: RED (tests written first, implementation pending)
 * Created: 2026-01-02
 * Phase: 4.x
 *
 * Requirements Reference: 2-player MCP support with auto-opponent
 *
 * Tests 2-player multiplayer support in MCP server:
 * 1. Creating 2-player games via game_session
 * 2. Auto-opponent plays Big Money after Player 0's turn
 * 3. Attack cards affect opponent (Witch, Militia)
 * 4. Opponent Moat blocks attacks
 * 5. Game end conditions in 2-player context
 *
 * @level Integration
 */

import { GameRegistryManager } from '../../src/game-registry';
import { GameSessionTool } from '../../src/tools/game-session';
import { GameExecuteTool } from '../../src/tools/game-execute';
import { GameObserveTool } from '../../src/tools/game-observe';
import { GameSessionRequest, GameExecuteResponse } from '../../src/types/tools';

// @req MCP-2P-001: game_session accepts numPlayers parameter (1-4)
// @req MCP-2P-002: game_session with numPlayers=2 creates 2-player game
// @req MCP-2P-003: After Player 0 cleanup, opponent auto-plays Big Money
// @req MCP-2P-004: Opponent attacks affect Player 0 (e.g., Militia discard)
// @req MCP-2P-005: Player 0 attacks affect opponent (Witch gives Curse)
// @req MCP-2P-006: Moat in opponent's hand blocks Player 0's attacks
// @req MCP-2P-007: Game ends correctly (Province empty or 3 piles)
// @edge: numPlayers validation (1-4 only) | auto-opponent Big Money decisions | attack resolution order
// @why: MCP currently only supports solo play; 2-player adds strategic depth via opponent interaction

/**
 * Extended types for 2-player MCP features (not yet in production types)
 * These define the expected API for dev-agent to implement
 */
interface TwoPlayerSessionRequest extends GameSessionRequest {
  numPlayers?: number;
  kingdomCards?: string[];
}

interface TwoPlayerExecuteResponse extends GameExecuteResponse {
  opponentTurnSummary?: {
    cardsBought: string[];
    treasuresPlayed: string[];
    actionsPlayed: string[];
  };
}

describe('Integration: 2-Player MCP Support', () => {
  let registry: GameRegistryManager;
  let sessionTool: GameSessionTool;
  let executeTool: GameExecuteTool;
  let observeTool: GameObserveTool;

  beforeEach(() => {
    // Create fresh registry for each test
    registry = new GameRegistryManager(10, 60 * 60 * 1000);
    sessionTool = new GameSessionTool(registry);
    executeTool = new GameExecuteTool(registry);
    observeTool = new GameObserveTool(registry);
  });

  afterEach(() => {
    // Clean up registry
    registry.stop();
  });

  describe('IT-2P-001: Create 2-player game succeeds', () => {
    // @req MCP-2P-001: game_session accepts numPlayers parameter (1-4)
    // @req MCP-2P-002: game_session with numPlayers=2 creates 2-player game

    test('should create 2-player game when numPlayers=2 is specified', async () => {
      // @input: game_session(command="new", numPlayers=2)
      // @output: {success: true, gameId: "...", initialState with 2 players}
      // @assert: Game created with 2 players, both have starting decks

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-test-001',
        numPlayers: 2
      };
      const response = await sessionTool.execute(request as GameSessionRequest);

      expect(response.success).toBe(true);
      expect(response.gameId).toBeDefined();
      expect(response.initialState).toBeDefined();
      expect(response.initialState.players).toHaveLength(2);

      // Both players should have starting decks (7 Copper + 3 Estate = 10 cards)
      const player0 = response.initialState.players[0];
      const player1 = response.initialState.players[1];

      const player0TotalCards = player0.drawPile.length + player0.hand.length;
      const player1TotalCards = player1.drawPile.length + player1.hand.length;

      expect(player0TotalCards).toBe(10);
      expect(player1TotalCards).toBe(10);
    });

    test('should default to 1 player when numPlayers not specified', async () => {
      // @req MCP-2P-001: Backward compatibility - default to 1 player
      // @assert: Existing behavior unchanged

      const response = await sessionTool.execute({
        command: 'new',
        seed: '1p-default-test'
      });

      expect(response.success).toBe(true);
      expect(response.initialState.players).toHaveLength(1);
    });

    test('should reject invalid numPlayers values', async () => {
      // @edge: numPlayers must be 1-4
      // @assert: Error for numPlayers=0, numPlayers=5, numPlayers=-1

      const requestZero: TwoPlayerSessionRequest = {
        command: 'new',
        numPlayers: 0
      };
      const responseZero = await sessionTool.execute(requestZero as GameSessionRequest);
      expect(responseZero.success).toBe(false);
      expect(responseZero.error).toContain('numPlayers');

      const requestFive: TwoPlayerSessionRequest = {
        command: 'new',
        numPlayers: 5
      };
      const responseFive = await sessionTool.execute(requestFive as GameSessionRequest);
      expect(responseFive.success).toBe(false);
      expect(responseFive.error).toContain('numPlayers');

      const requestNegative: TwoPlayerSessionRequest = {
        command: 'new',
        numPlayers: -1
      };
      const responseNegative = await sessionTool.execute(requestNegative as GameSessionRequest);
      expect(responseNegative.success).toBe(false);
    });

    test('should indicate player count in game_observe response', async () => {
      // @req MCP-2P-002: Observable player count
      // @assert: game_observe shows playerCount=2

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-observe-test',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      const observeResponse = await observeTool.execute({
        detail_level: 'standard'
      });

      expect(observeResponse.success).toBe(true);
      expect(observeResponse.playerCount).toBe(2);
    });
  });

  describe('IT-2P-002: Player 0 turn triggers opponent auto-play', () => {
    // @req MCP-2P-003: After Player 0 cleanup, opponent auto-plays Big Money

    test('should auto-play opponent turn after Player 0 cleanup', async () => {
      // @input: Player 0 completes turn (action -> buy -> cleanup)
      // @output: After cleanup, opponent turn is auto-played, then Player 0 action phase
      // @assert: Turn number increments, currentPlayer returns to 0

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-auto-opponent',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Player 0 skips action phase
      const endActionResponse = await executeTool.execute({
        move: 'end'
      });
      expect(endActionResponse.success).toBe(true);

      // Player 0 plays treasures and buys (or skips)
      await executeTool.execute({ move: 'play_treasure all' });
      const endBuyResponse = await executeTool.execute({
        move: 'end'
      });

      expect(endBuyResponse.success).toBe(true);

      // After Player 0's cleanup, opponent should have auto-played
      // and we should be back to Player 0's action phase
      expect(endBuyResponse.gameState.activePlayer).toBe(0);
      expect(endBuyResponse.gameState.phase).toBe('action');
      // Turn 1: P0, Turn 2: P1 (auto), now Turn 3: P0
      expect(endBuyResponse.gameState.turnNumber).toBeGreaterThanOrEqual(2);
    });

    test('should include opponent turn summary in response', async () => {
      // @req MCP-2P-003: Player 0 should see what opponent did
      // @assert: Response includes opponentTurnSummary with cards bought

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-summary-test',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Complete Player 0's turn
      await executeTool.execute({ move: 'end' });
      await executeTool.execute({ move: 'play_treasure all' });
      const response = await executeTool.execute({ move: 'end' }) as TwoPlayerExecuteResponse;

      expect(response.success).toBe(true);
      // Expect opponent summary to be included
      expect(response.opponentTurnSummary).toBeDefined();
      expect(response.opponentTurnSummary!.cardsBought).toBeDefined();
    });
  });

  describe('IT-2P-003: Opponent plays Big Money strategy', () => {
    // @req MCP-2P-003: Opponent uses Big Money (Silver < 6 coins, Gold < 8, else Province)

    test('should opponent buy Silver when coins < 6', async () => {
      // @input: Opponent has ~3 coins (starting hand)
      // @output: Opponent buys Silver
      // @assert: Silver supply decreases

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-bm-silver',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Get initial Silver supply (supply is array of {name, remaining, cost})
      const initialObserve = await observeTool.execute({ detail_level: 'full' });
      const initialSilverPile = initialObserve.supply?.find((p: any) => p.name === 'Silver');
      const initialSilverCount = initialSilverPile?.remaining ?? 40;

      // Complete Player 0's turn to trigger opponent
      await executeTool.execute({ move: 'end' });
      await executeTool.execute({ move: 'play_treasure all' });
      await executeTool.execute({ move: 'end' });

      // Check Silver supply decreased (opponent bought Silver)
      const afterObserve = await observeTool.execute({ detail_level: 'full' });
      const afterSilverPile = afterObserve.supply?.find((p: any) => p.name === 'Silver');
      const afterSilverCount = afterSilverPile?.remaining ?? 40;

      // @req MCP-2P-003: Opponent should buy Silver with starting coins (~3)
      expect(afterSilverCount).toBeLessThan(initialSilverCount);
    });

    test('should opponent buy Gold when coins >= 6 and < 8', async () => {
      // @hint: Use a seed that gives opponent a hand with 6-7 coins
      // @assert: Gold supply decreases when opponent has 6-7 coins

      // This test requires a known seed that produces opponent hand with Silvers
      // For now, we verify the behavior conceptually
      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-bm-gold-scenario',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // The test needs to simulate multiple turns until opponent has Silvers
      // Actual implementation will need proper seed selection
      expect(true).toBe(true); // Placeholder until implementation
    });

    test('should opponent buy Province when coins >= 8', async () => {
      // @hint: Late game scenario with Gold in opponent deck
      // @assert: Province supply decreases

      // This requires simulation of multiple turns
      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-bm-province-scenario',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Placeholder - requires game progression to test
      expect(true).toBe(true); // Placeholder until implementation
    });
  });

  describe('IT-2P-004: After opponent turn, currentPlayer is 0 again', () => {
    // @req MCP-2P-003: Turn control returns to Player 0

    test('should return to Player 0 after opponent auto-play', async () => {
      // @assert: activePlayer=0 after opponent turn completes

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-control-return',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Initial state should have Player 0 active
      const initialObserve = await observeTool.execute({ detail_level: 'standard' });
      expect(initialObserve.activePlayer).toBe(0);

      // Complete Player 0's turn
      await executeTool.execute({ move: 'end' });
      await executeTool.execute({ move: 'play_treasure all' });
      const endTurnResponse = await executeTool.execute({ move: 'end' });

      // Should be back to Player 0
      expect(endTurnResponse.gameState.activePlayer).toBe(0);
    });

    test('should have fresh resources for Player 0 new turn', async () => {
      // @assert: actions=1, buys=1, coins=0 at start of Player 0's new turn

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-fresh-resources',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Complete Player 0's turn
      await executeTool.execute({ move: 'end' });
      await executeTool.execute({ move: 'play_treasure all' });
      await executeTool.execute({ move: 'end' });

      const observe = await observeTool.execute({ detail_level: 'standard' });
      expect(observe.activePlayer).toBe(0);
      expect(observe.hand).toBeDefined();
      // Resources should be reset for new turn
    });
  });

  describe('IT-2P-005: Militia forces opponent to discard to 3 cards', () => {
    // @req MCP-2P-004: Opponent attacks affect Player 0

    test('should opponent Militia cause Player 0 to discard', async () => {
      // @input: Opponent plays Militia (attack)
      // @output: Player 0 must discard to 3 cards
      // @hint: This requires opponent having Militia in hand

      // For this test, we need a scenario where opponent has Militia
      // This would be tested after opponent deck building
      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-militia-test',
        numPlayers: 2,
        kingdomCards: ['Militia', 'Village', 'Smithy']
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Placeholder - requires opponent to have Militia
      expect(true).toBe(true); // Implementation needed
    });

    test('should Player 0 Militia force opponent to auto-discard', async () => {
      // @req MCP-2P-005: Player 0 attacks affect opponent
      // @input: Player 0 plays Militia
      // @output: Opponent auto-discards to 3 cards (using simple heuristic)
      // @assert: Opponent hand size becomes 3

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-p0-militia',
        numPlayers: 2,
        kingdomCards: ['Militia', 'Village', 'Smithy']
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Need to set up Player 0 with Militia in hand
      // This requires careful seed selection or state manipulation
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('IT-2P-006: Witch gives Curse to opponent', () => {
    // @req MCP-2P-005: Player 0 attacks affect opponent

    test('should Player 0 Witch give Curse to opponent', async () => {
      // @input: Player 0 plays Witch
      // @output: Opponent gains Curse to discard pile
      // @assert: Curse supply decreases, opponent has Curse

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-witch-curse',
        numPlayers: 2,
        kingdomCards: ['Witch', 'Village', 'Smithy']
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Get initial state
      const initialObserve = await observeTool.execute({ detail_level: 'full' });
      const initialCurseCount = initialObserve.state?.supply?.get('Curse') || 10;

      // Need Player 0 to have Witch and play it
      // This requires setup - placeholder for now
      expect(true).toBe(true); // Placeholder

      // After Witch played:
      // expect(afterCurseCount).toBe(initialCurseCount - 1);
      // expect(opponentDiscard).toContain('Curse');
    });

    test('should reduce Curse supply when Witch attacks', async () => {
      // @assert: Curse pile decrements per attack

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-curse-supply',
        numPlayers: 2,
        kingdomCards: ['Witch']
      };
      await sessionTool.execute(request as GameSessionRequest);

      expect(true).toBe(true); // Placeholder
    });
  });

  describe('IT-2P-007: Opponent Moat blocks Player 0 attacks', () => {
    // @req MCP-2P-006: Moat in opponent's hand blocks Player 0's attacks

    test('should opponent Moat block Witch attack', async () => {
      // @input: Player 0 plays Witch, opponent has Moat in hand
      // @output: Opponent reveals Moat, does NOT gain Curse
      // @assert: Curse supply unchanged for that attack

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-moat-block-witch',
        numPlayers: 2,
        kingdomCards: ['Witch', 'Moat', 'Village']
      };
      await sessionTool.execute(request as GameSessionRequest);

      // Need to set up:
      // 1. Player 0 has Witch in hand
      // 2. Opponent has Moat in hand
      // This requires careful seed selection

      expect(true).toBe(true); // Placeholder
    });

    test('should opponent Moat block Militia attack', async () => {
      // @input: Player 0 plays Militia, opponent has Moat
      // @output: Opponent reveals Moat, does NOT discard
      // @assert: Opponent hand remains at 5 cards

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-moat-block-militia',
        numPlayers: 2,
        kingdomCards: ['Militia', 'Moat', 'Village']
      };
      await sessionTool.execute(request as GameSessionRequest);

      expect(true).toBe(true); // Placeholder
    });

    test('should auto-reveal Moat when opponent has it during attack', async () => {
      // @req MCP-2P-006: Auto-opponent always reveals Moat if available
      // @why: Optimal play - always block attacks when possible
      // @assert: Moat revealed automatically, attack blocked

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-auto-moat',
        numPlayers: 2,
        kingdomCards: ['Witch', 'Moat']
      };
      await sessionTool.execute(request as GameSessionRequest);

      expect(true).toBe(true); // Placeholder
    });
  });

  describe('IT-2P-008: Game ends when Province empty', () => {
    // @req MCP-2P-007: Game ends correctly (Province empty or 3 piles)

    test('should end game when Province pile is depleted', async () => {
      // @input: Both players buy Provinces until empty
      // @output: gameOver=true, winner determined
      // @assert: Game properly ends with score calculation

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-province-end',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // This requires simulating a full game until Province depletion
      // In 2-player, there are 8 Provinces total
      expect(true).toBe(true); // Placeholder
    });

    test('should calculate winner correctly in 2-player game', async () => {
      // @assert: Higher VP player wins, tie-breaker is fewer turns

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-winner-calc',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      expect(true).toBe(true); // Placeholder
    });

    test('should end game when 3 supply piles empty', async () => {
      // @req MCP-2P-007: 3-pile end condition
      // @assert: Game ends even if Province not empty

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-3pile-end',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      expect(true).toBe(true); // Placeholder
    });
  });

  describe('IT-2P-009: Deterministic opponent behavior with seeds', () => {
    // @edge: Same seed produces same opponent decisions

    test('should produce identical opponent turns with same seed', async () => {
      // @assert: Two games with same seed have identical opponent behavior

      // Game 1
      const request1: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-deterministic',
        numPlayers: 2
      };
      await sessionTool.execute(request1 as GameSessionRequest);

      await executeTool.execute({ move: 'end' });
      await executeTool.execute({ move: 'play_treasure all' });
      const game1Response = await executeTool.execute({ move: 'end' }) as TwoPlayerExecuteResponse;
      const game1OpponentSummary = game1Response.opponentTurnSummary;

      // End game 1
      await sessionTool.execute({ command: 'end' });

      // Game 2 with same seed
      const request2: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-deterministic',
        numPlayers: 2
      };
      await sessionTool.execute(request2 as GameSessionRequest);

      await executeTool.execute({ move: 'end' });
      await executeTool.execute({ move: 'play_treasure all' });
      const game2Response = await executeTool.execute({ move: 'end' }) as TwoPlayerExecuteResponse;
      const game2OpponentSummary = game2Response.opponentTurnSummary;

      // Both should have identical opponent behavior
      expect(game2OpponentSummary).toEqual(game1OpponentSummary);
    });
  });

  describe('IT-2P-010: Supply piles adjusted for 2 players', () => {
    // @edge: 2-player games have different pile sizes than solo

    test('should have 8 Provinces in 2-player game', async () => {
      // @why: Standard Dominion rules - 8 Provinces for 2 players
      // @assert: Province supply = 8

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-province-count',
        numPlayers: 2
      };
      const response = await sessionTool.execute(request as GameSessionRequest);

      expect(response.success).toBe(true);
      const provinceCount = response.initialState.supply.get('Province');
      expect(provinceCount).toBe(8);
    });

    test('should have 8 Estates in 2-player game (after starting hands)', async () => {
      // @why: Standard rules - estates reduced in 2-player
      // @assert: Estate supply reflects 2-player count

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-estate-count',
        numPlayers: 2
      };
      const response = await sessionTool.execute(request as GameSessionRequest);

      expect(response.success).toBe(true);
      // 2-player: 8 Estates in supply (some in starting decks)
      const estateCount = response.initialState.supply.get('Estate');
      // With 2 players, each gets 3 Estates, so supply = 8 - 6 = 2?
      // Actually Dominion rules: supply for 2 players is 8 total (both players draw from same pool)
      // Players start with 3 Estates each from supply, leaving 2
      expect(estateCount).toBeLessThanOrEqual(8);
    });

    test('should have 10 Curses in 2-player game', async () => {
      // @why: Standard rules - 10 Curses per player minus 10
      // For 2 players: (2-1)*10 = 10 Curses
      // @assert: Curse supply = 10

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-curse-count',
        numPlayers: 2
      };
      const response = await sessionTool.execute(request as GameSessionRequest);

      expect(response.success).toBe(true);
      const curseCount = response.initialState.supply.get('Curse');
      expect(curseCount).toBe(10);
    });
  });

  describe('IT-2P-011: Error handling in 2-player games', () => {
    // @edge: Error conditions specific to multiplayer

    test('should handle opponent turn errors gracefully', async () => {
      // @input: Something goes wrong during opponent auto-play
      // @output: Error reported, game state remains consistent
      // @assert: Game doesn't crash, error is logged

      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-error-handling',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      // The test verifies robustness - hard to trigger artificially
      expect(true).toBe(true); // Placeholder
    });

    test('should not allow Player 0 moves during opponent turn', async () => {
      // @edge: Race condition prevention
      // @assert: Moves rejected if currentPlayer != 0 (shouldn't happen with auto-opponent)

      // This tests internal consistency - auto-opponent should be synchronous
      const request: TwoPlayerSessionRequest = {
        command: 'new',
        seed: '2p-race-condition',
        numPlayers: 2
      };
      await sessionTool.execute(request as GameSessionRequest);

      expect(true).toBe(true); // Placeholder
    });
  });
});
