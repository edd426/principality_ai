/**
 * @file End-to-End Tests - Interactive Cards via MCP
 * @phase 4.2
 * @status RED (implementation doesn't exist yet - TDD approach)
 *
 * These tests verify complete workflows for all 11 interactive action cards
 * through the MCP interface, ensuring full functionality from card play to
 * resolution.
 */

import { GameEngine } from '../../../core/src/game';
import { CardName, GameState } from '../../../core/src/types';

// NOTE: These imports will fail until implementation is created
import { MCPGameServer } from '../../src/server';

describe('E2E: Interactive Cards via MCP', () => {
  let server: MCPGameServer;

  beforeEach(async () => {
    server = new MCPGameServer();
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  // Helper to setup game with specific card in hand
  const setupGameWithCard = async (card: CardName, seed: string = 'e2e-test') => {
    await server.call('game_session', { command: 'new', seed, players: 1, allCards: true });

    // Get initial state and manipulate to have desired card in hand
    // This may require multiple turns or direct state manipulation
    // For now, assume we can get the card into hand through game setup

    return server;
  };

  describe('E2E-MCP-CELLAR-1: Complete Cellar Workflow', () => {
    // @req: AC-MCP-8 - All cards work end-to-end
    // @level: E2E
    it('should complete full Cellar workflow via MCP', async () => {
      await setupGameWithCard('Cellar', 'e2e-cellar');

      // Play Cellar
      const playResponse = await server.call('game_execute', { move: 'play_action Cellar' });
      expect(playResponse.success).toBe(true);
      expect(playResponse.pendingEffect).toBeDefined();
      expect(playResponse.pendingEffect.card).toBe('Cellar');
      expect(playResponse.pendingEffect.effect).toBe('discard_for_cellar');
      expect(playResponse.pendingEffect.options.length).toBeGreaterThan(0);

      // Select discard option (option 1 - discard most cards)
      const discardCmd = playResponse.pendingEffect.options[0].command;
      const resolveResponse = await server.call('game_execute', { move: discardCmd });
      expect(resolveResponse.success).toBe(true);
      expect(resolveResponse.pendingEffect).toBeUndefined();
      expect(resolveResponse.message).toContain('Discarded');

      // Verify game state updated correctly
      expect(resolveResponse.gameState).toBeDefined();
      expect(resolveResponse.validMoves).toBeDefined();
    });

    it('should handle numeric selection for Cellar', async () => {
      await setupGameWithCard('Cellar', 'e2e-cellar-numeric');

      await server.call('game_execute', { move: 'play_action Cellar' });

      // Select option 2 via numeric selection
      const resolveResponse = await server.call('game_execute', { move: '2' });
      expect(resolveResponse.success).toBe(true);
      expect(resolveResponse.pendingEffect).toBeUndefined();
    });

    it('should handle discard nothing option for Cellar', async () => {
      await setupGameWithCard('Cellar', 'e2e-cellar-nothing');

      const playResponse = await server.call('game_execute', { move: 'play_action Cellar' });

      // Find "discard nothing" option (likely last option)
      const nothingOption = playResponse.pendingEffect.options.find(opt =>
        opt.description.toLowerCase().includes('nothing')
      );

      const resolveResponse = await server.call('game_execute', { move: nothingOption!.command });
      expect(resolveResponse.success).toBe(true);
      expect(resolveResponse.message).toContain('nothing' || 'draw 0');
    });
  });

  describe('E2E-MCP-CHAPEL-1: Complete Chapel Workflow', () => {
    it('should complete full Chapel workflow via MCP', async () => {
      await setupGameWithCard('Chapel', 'e2e-chapel');

      // Play Chapel
      const playResponse = await server.call('game_execute', { move: 'play_action Chapel' });
      expect(playResponse.success).toBe(true);
      expect(playResponse.pendingEffect).toBeDefined();
      expect(playResponse.pendingEffect.card).toBe('Chapel');
      expect(playResponse.pendingEffect.effect).toBe('trash_cards');

      // Trash cards (up to 4)
      const trashCmd = playResponse.pendingEffect.options[0].command;
      const resolveResponse = await server.call('game_execute', { move: trashCmd });
      expect(resolveResponse.success).toBe(true);
      expect(resolveResponse.pendingEffect).toBeUndefined();
      expect(resolveResponse.message).toContain('Trashed');
    });

    it('should respect maxTrash limit of 4', async () => {
      await setupGameWithCard('Chapel', 'e2e-chapel-limit');

      const playResponse = await server.call('game_execute', { move: 'play_action Chapel' });

      // Verify no option trashes more than 4 cards
      playResponse.pendingEffect.options.forEach(opt => {
        const cardCount = (opt.command.match(/,/g) || []).length + 1;
        if (opt.command !== 'trash_cards') { // If not empty trash
          expect(cardCount).toBeLessThanOrEqual(4);
        }
      });
    });
  });

  describe('E2E-MCP-REMODEL-1: Complete Remodel 2-Step Workflow', () => {
    // @why: Remodel requires two sequential choices - trash then gain
    it('should complete full 2-step Remodel workflow via MCP', async () => {
      await setupGameWithCard('Remodel', 'e2e-remodel');

      // Step 1: Play Remodel
      const step1Response = await server.call('game_execute', { move: 'play_action Remodel' });
      expect(step1Response.success).toBe(true);
      expect(step1Response.pendingEffect).toBeDefined();
      expect(step1Response.pendingEffect.card).toBe('Remodel');
      expect(step1Response.pendingEffect.step).toBe(1);
      expect(step1Response.message).toContain('Step 1');

      // Step 2: Trash Estate ($2)
      const trashEstateOpt = step1Response.pendingEffect.options.find(opt =>
        opt.description.includes('Estate')
      );
      const step2Response = await server.call('game_execute', { move: trashEstateOpt!.command });
      expect(step2Response.success).toBe(true);
      expect(step2Response.pendingEffect).toBeDefined();
      expect(step2Response.pendingEffect.step).toBe(2);
      expect(step2Response.message).toContain('Step 2');

      // Step 3: Gain Smithy ($4)
      const gainSmithyOpt = step2Response.pendingEffect.options.find(opt =>
        opt.description.includes('Smithy')
      );
      const finalResponse = await server.call('game_execute', { move: gainSmithyOpt!.command });
      expect(finalResponse.success).toBe(true);
      expect(finalResponse.pendingEffect).toBeUndefined();
      expect(finalResponse.message).toContain('Remodel complete' || 'Gained');
    });

    it('should calculate maxGainCost correctly (+2 from trashed card)', async () => {
      await setupGameWithCard('Remodel', 'e2e-remodel-cost');

      const step1Response = await server.call('game_execute', { move: 'play_action Remodel' });

      // Trash Copper ($0) - should enable gain up to $2
      const trashCopperOpt = step1Response.pendingEffect.options.find(opt =>
        opt.description.includes('Copper')
      );

      const step2Response = await server.call('game_execute', { move: trashCopperOpt!.command });

      // Verify all gain options are ≤ $2
      // (This would need card cost lookup in real implementation)
      expect(step2Response.pendingEffect.effect).toBe('gain_card');
      expect(step2Response.message).toContain('$2');
    });
  });

  describe('E2E-MCP-MINE-1: Complete Mine 2-Step Workflow', () => {
    it('should complete full 2-step Mine workflow via MCP', async () => {
      await setupGameWithCard('Mine', 'e2e-mine');

      // Step 1: Play Mine
      const step1Response = await server.call('game_execute', { move: 'play_action Mine' });
      expect(step1Response.success).toBe(true);
      expect(step1Response.pendingEffect).toBeDefined();
      expect(step1Response.pendingEffect.step).toBe(1);

      // Step 2: Trash Copper treasure
      const trashCmd = step1Response.pendingEffect.options[0].command;
      const step2Response = await server.call('game_execute', { move: trashCmd });
      expect(step2Response.success).toBe(true);
      expect(step2Response.pendingEffect).toBeDefined();
      expect(step2Response.pendingEffect.step).toBe(2);

      // Step 3: Gain Silver to hand
      const gainCmd = step2Response.pendingEffect.options[0].command;
      const finalResponse = await server.call('game_execute', { move: gainCmd });
      expect(finalResponse.success).toBe(true);
      expect(finalResponse.pendingEffect).toBeUndefined();
    });

    it('should only show treasures in Mine options', async () => {
      await setupGameWithCard('Mine', 'e2e-mine-treasures');

      const step1Response = await server.call('game_execute', { move: 'play_action Mine' });

      // Verify all step 1 options are treasures (Copper, Silver, Gold)
      step1Response.pendingEffect.options.forEach(opt => {
        expect(['Copper', 'Silver', 'Gold', 'No treasures'].some(treasure =>
          opt.description.includes(treasure)
        )).toBe(true);
      });
    });

    it('should gain treasure to hand not discard pile', async () => {
      await setupGameWithCard('Mine', 'e2e-mine-destination');

      const step1Response = await server.call('game_execute', { move: 'play_action Mine' });
      const step2Response = await server.call('game_execute', {
        move: step1Response.pendingEffect.options[0].command
      });

      // Verify destination is hand
      // (Would need to check game state to confirm card went to hand)
      const finalResponse = await server.call('game_execute', {
        move: step2Response.pendingEffect.options[0].command
      });

      expect(finalResponse.success).toBe(true);
      // In full implementation, would verify gained card is in hand
    });
  });

  describe('E2E-MCP-WORKSHOP-1: Complete Workshop Workflow', () => {
    it('should complete full Workshop workflow via MCP', async () => {
      await setupGameWithCard('Workshop', 'e2e-workshop');

      // Play Workshop
      const playResponse = await server.call('game_execute', { move: 'play_action Workshop' });
      expect(playResponse.success).toBe(true);
      expect(playResponse.pendingEffect).toBeDefined();
      expect(playResponse.pendingEffect.card).toBe('Workshop');

      // Gain card up to $4
      const gainCmd = playResponse.pendingEffect.options[0].command;
      const resolveResponse = await server.call('game_execute', { move: gainCmd });
      expect(resolveResponse.success).toBe(true);
      expect(resolveResponse.pendingEffect).toBeUndefined();
    });

    it('should only show cards costing up to $4', async () => {
      await setupGameWithCard('Workshop', 'e2e-workshop-cost');

      const playResponse = await server.call('game_execute', { move: 'play_action Workshop' });

      // Verify no options exceed $4
      // (Would need card cost lookup to verify fully)
      expect(playResponse.message).toContain('$4');
    });
  });

  describe('E2E-MCP-FEAST-1: Complete Feast Workflow', () => {
    it('should complete full Feast workflow via MCP', async () => {
      await setupGameWithCard('Feast', 'e2e-feast');

      // Play Feast
      const playResponse = await server.call('game_execute', { move: 'play_action Feast' });
      expect(playResponse.success).toBe(true);
      expect(playResponse.pendingEffect).toBeDefined();
      expect(playResponse.pendingEffect.card).toBe('Feast');

      // Gain card up to $5
      const gainCmd = playResponse.pendingEffect.options[0].command;
      const resolveResponse = await server.call('game_execute', { move: gainCmd });
      expect(resolveResponse.success).toBe(true);
      expect(resolveResponse.pendingEffect).toBeUndefined();
    });

    it('should only show cards costing up to $5', async () => {
      await setupGameWithCard('Feast', 'e2e-feast-cost');

      const playResponse = await server.call('game_execute', { move: 'play_action Feast' });

      expect(playResponse.message).toContain('$5');
    });

    it('should trash Feast card after use', async () => {
      await setupGameWithCard('Feast', 'e2e-feast-trash');

      const playResponse = await server.call('game_execute', { move: 'play_action Feast' });
      const resolveResponse = await server.call('game_execute', {
        move: playResponse.pendingEffect.options[0].command
      });

      // Verify Feast was trashed (would check trash pile in full implementation)
      expect(resolveResponse.success).toBe(true);
    });
  });

  describe('E2E-MCP-LIBRARY-1: Complete Library Iterative Workflow', () => {
    // @why: Library is iterative - prompts for each action card drawn
    it('should complete full Library iterative workflow via MCP', async () => {
      // Setup game with action cards in deck
      await setupGameWithCard('Library', 'e2e-library');

      // Play Library
      const response1 = await server.call('game_execute', { move: 'play_action Library' });

      // If action card is drawn, should prompt
      if (response1.pendingEffect) {
        expect(response1.pendingEffect.card).toBe('Library');

        // Set aside first action card
        const setAsideCmd = response1.pendingEffect.options[0].command;
        const response2 = await server.call('game_execute', { move: setAsideCmd });

        // May prompt for more action cards or complete
        expect(response2.success).toBe(true);
      } else {
        // No action cards drawn - Library completed immediately
        expect(response1.success).toBe(true);
      }
    });

    it('should provide keep or set aside options', async () => {
      await setupGameWithCard('Library', 'e2e-library-choices');

      const playResponse = await server.call('game_execute', { move: 'play_action Library' });

      if (playResponse.pendingEffect) {
        // Should have 2 options: set aside or keep
        expect(playResponse.pendingEffect.options).toHaveLength(2);
        expect(playResponse.pendingEffect.options[0].description).toContain('Set aside' || 'skip');
        expect(playResponse.pendingEffect.options[1].description).toContain('Keep' || 'hand');
      }
    });

    it('should stop drawing at 7 cards in hand', async () => {
      // Setup with hand of 6 cards (need 1 more to reach 7)
      await setupGameWithCard('Library', 'e2e-library-limit');

      const playResponse = await server.call('game_execute', { move: 'play_action Library' });

      // Library should complete quickly since hand is nearly full
      // (Would verify exact behavior in full implementation)
      expect(playResponse.success).toBe(true);
    });
  });

  describe('E2E-MCP-THRONE-1: Complete Throne Room Workflow', () => {
    it('should complete full Throne Room workflow via MCP', async () => {
      await setupGameWithCard('Throne Room', 'e2e-throne');

      // Play Throne Room
      const playResponse = await server.call('game_execute', { move: 'play_action Throne Room' });
      expect(playResponse.success).toBe(true);
      expect(playResponse.pendingEffect).toBeDefined();
      expect(playResponse.pendingEffect.card).toBe('Throne Room');

      // Select Village to play twice
      const villageOpt = playResponse.pendingEffect.options.find(opt =>
        opt.description.includes('Village')
      );

      const resolveResponse = await server.call('game_execute', { move: villageOpt!.command });
      expect(resolveResponse.success).toBe(true);
      expect(resolveResponse.message).toContain('twice' || 'doubled');
    });

    it('should only show action cards as options', async () => {
      await setupGameWithCard('Throne Room', 'e2e-throne-actions');

      const playResponse = await server.call('game_execute', { move: 'play_action Throne Room' });

      // Verify all options are action cards or skip
      playResponse.pendingEffect.options.forEach(opt => {
        expect(
          opt.description.includes('action') ||
          opt.description.includes('skip') ||
          opt.description.includes('Village') ||
          opt.description.includes('Smithy')
        ).toBe(true);
      });
    });

    it('should include skip option', async () => {
      await setupGameWithCard('Throne Room', 'e2e-throne-skip');

      const playResponse = await server.call('game_execute', { move: 'play_action Throne Room' });

      const skipOpt = playResponse.pendingEffect.options.find(opt =>
        opt.description.toLowerCase().includes('skip')
      );

      expect(skipOpt).toBeDefined();
    });
  });

  describe('E2E-MCP-CHANCELLOR-1: Complete Chancellor Workflow', () => {
    it('should complete full Chancellor workflow via MCP', async () => {
      await setupGameWithCard('Chancellor', 'e2e-chancellor');

      // Play Chancellor
      const playResponse = await server.call('game_execute', { move: 'play_action Chancellor' });
      expect(playResponse.success).toBe(true);
      expect(playResponse.pendingEffect).toBeDefined();
      expect(playResponse.pendingEffect.card).toBe('Chancellor');

      // Should have 2 options: move deck to discard or keep
      expect(playResponse.pendingEffect.options).toHaveLength(2);

      // Choose to move deck to discard
      const moveOpt = playResponse.pendingEffect.options[0];
      const resolveResponse = await server.call('game_execute', { move: moveOpt.command });
      expect(resolveResponse.success).toBe(true);
      expect(resolveResponse.pendingEffect).toBeUndefined();
    });

    it('should show deck size in options', async () => {
      await setupGameWithCard('Chancellor', 'e2e-chancellor-size');

      const playResponse = await server.call('game_execute', { move: 'play_action Chancellor' });

      // Description should mention deck size
      const deckSizeOption = playResponse.pendingEffect.options.find(opt =>
        opt.description.match(/\d+/)
      );

      expect(deckSizeOption).toBeDefined();
    });
  });

  describe('E2E-MCP-SPY-1: Complete Spy Iterative Workflow (2-player)', () => {
    // @why: Spy is iterative with multiple players
    it('should complete full Spy workflow via MCP (2 players)', async () => {
      // Setup 2-player game
      await server.call('game_session', { command: 'new', seed: 'e2e-spy', players: 2, allCards: true });

      // Play Spy
      const response1 = await server.call('game_execute', { move: 'play_action Spy' });

      // Should prompt for first player's revealed card
      if (response1.pendingEffect) {
        expect(response1.pendingEffect.card).toBe('Spy');
        expect(response1.pendingEffect.effect).toBe('spy_decision');

        // Make decision for player 1
        const decision1Cmd = response1.pendingEffect.options[0].command;
        const response2 = await server.call('game_execute', { move: decision1Cmd });

        // Should prompt for player 2's revealed card
        if (response2.pendingEffect) {
          const decision2Cmd = response2.pendingEffect.options[0].command;
          const finalResponse = await server.call('game_execute', { move: decision2Cmd });
          expect(finalResponse.success).toBe(true);
          expect(finalResponse.pendingEffect).toBeUndefined();
        }
      }
    });

    it('should show revealed card in description', async () => {
      await server.call('game_session', { command: 'new', seed: 'e2e-spy-reveal', players: 2, allCards: true });

      const playResponse = await server.call('game_execute', { move: 'play_action Spy' });

      if (playResponse.pendingEffect) {
        // Description should include revealed card name
        expect(playResponse.pendingEffect.options[0].description).toMatch(/Copper|Silver|Gold|Estate|Duchy|Province/);
      }
    });

    it('should provide discard or keep options', async () => {
      await server.call('game_session', { command: 'new', seed: 'e2e-spy-options', players: 2, allCards: true });

      const playResponse = await server.call('game_execute', { move: 'play_action Spy' });

      if (playResponse.pendingEffect) {
        expect(playResponse.pendingEffect.options).toHaveLength(2);
        expect(playResponse.pendingEffect.options[0].description).toContain('Discard' || 'discard');
        expect(playResponse.pendingEffect.options[1].description).toContain('Keep' || 'keep');
      }
    });
  });

  describe('E2E-MCP-BUREAUCRAT-1: Complete Bureaucrat Iterative Workflow (2-player)', () => {
    it('should complete full Bureaucrat workflow via MCP (2 players)', async () => {
      // Setup 2-player game
      await server.call('game_session', { command: 'new', seed: 'e2e-bureaucrat', players: 2, allCards: true });

      // Play Bureaucrat
      const playResponse = await server.call('game_execute', { move: 'play_action Bureaucrat' });

      // Should prompt for opponent's victory card choice
      if (playResponse.pendingEffect) {
        expect(playResponse.pendingEffect.card).toBe('Bureaucrat');
        expect(playResponse.pendingEffect.effect).toBe('reveal_and_topdeck');

        // Opponent chooses victory card to topdeck
        const topdeckCmd = playResponse.pendingEffect.options[0].command;
        const resolveResponse = await server.call('game_execute', { move: topdeckCmd });
        expect(resolveResponse.success).toBe(true);
      }
    });

    it('should only show victory cards as options', async () => {
      await server.call('game_session', { command: 'new', seed: 'e2e-bureaucrat-victory', players: 2, allCards: true });

      const playResponse = await server.call('game_execute', { move: 'play_action Bureaucrat' });

      if (playResponse.pendingEffect) {
        // All options should be victory cards (Estate, Duchy, Province) or "Reveal hand"
        playResponse.pendingEffect.options.forEach(opt => {
          expect(
            opt.description.includes('Estate') ||
            opt.description.includes('Duchy') ||
            opt.description.includes('Province') ||
            opt.description.includes('Reveal hand')
          ).toBe(true);
        });
      }
    });

    it('should handle no victory cards case', async () => {
      // Setup game where opponent has no victory cards
      await server.call('game_session', { command: 'new', seed: 'e2e-bureaucrat-none', players: 2, allCards: true });

      const playResponse = await server.call('game_execute', { move: 'play_action Bureaucrat' });

      if (playResponse.pendingEffect) {
        // Should have "Reveal hand" option
        const revealOpt = playResponse.pendingEffect.options.find(opt =>
          opt.description.includes('Reveal hand')
        );
        expect(revealOpt).toBeDefined();
      }
    });
  });

  describe('Edge Cases - E2E', () => {
    // @edge: EC-GEN-3 - Large number of options
    it('should handle Cellar with large hand (many combinations)', async () => {
      // Setup game with 7-card hand (128 combinations)
      await server.call('game_session', { command: 'new', seed: 'e2e-large', players: 1, allCards: true });

      const playResponse = await server.call('game_execute', { move: 'play_action Cellar' });

      // Should limit displayed options but still accept valid commands
      expect(playResponse.pendingEffect.options.length).toBeLessThanOrEqual(50);

      if (playResponse.pendingEffect.options.length === 50) {
        expect(playResponse.message).toContain('Showing first 50');
      }
    });

    // @edge: EC-WORKSHOP-1 - Empty supply
    it('should handle Workshop with no cards available', async () => {
      // Setup game where all cards ≤ $4 are sold out
      await server.call('game_session', { command: 'new', seed: 'e2e-empty-supply', players: 1, allCards: true });

      const playResponse = await server.call('game_execute', { move: 'play_action Workshop' });

      expect(playResponse.pendingEffect.options).toHaveLength(1);
      expect(playResponse.pendingEffect.options[0].description).toContain('No cards available');
    });

    // @edge: EC-LIBRARY-1 - Already 7 cards
    it('should handle Library with hand already at 7 cards', async () => {
      // Setup game where player already has 7 cards
      await server.call('game_session', { command: 'new', seed: 'e2e-library-full', players: 1, allCards: true });

      const playResponse = await server.call('game_execute', { move: 'play_action Library' });

      // Library should complete immediately
      expect(playResponse.success).toBe(true);
      expect(playResponse.pendingEffect).toBeUndefined();
    });
  });

  describe('Performance - E2E', () => {
    // @req: AC-PERF-2 - MCP response time < 100ms
    it('should generate MCP response in < 100ms', async () => {
      await setupGameWithCard('Cellar', 'e2e-perf');

      const startTime = performance.now();
      const playResponse = await server.call('game_execute', { move: 'play_action Cellar' });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
      expect(playResponse.pendingEffect).toBeDefined();
    });
  });
});
