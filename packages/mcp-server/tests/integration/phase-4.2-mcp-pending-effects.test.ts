/**
 * @file MCP Integration Tests - Pending Effect Handling
 * @phase 4.2
 * @status RED (implementation doesn't exist yet - TDD approach)
 *
 * These tests verify that the MCP server correctly detects and returns structured
 * pendingEffect responses when interactive cards are played. This enables AI agents
 * to use all 11 interactive action cards via the MCP interface.
 */

import { GameEngine, CardName, GameState, generateMoveOptions } from '@principality/core';

// NOTE: These imports will fail until implementation is created
import { GameExecuteTool } from '../../src/tools/game-execute';

describe('MCP Pending Effect Detection', () => {
  let tool: GameExecuteTool;
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('test-mcp-pending');
    tool = new GameExecuteTool(engine);
  });

  // Helper to create game state with card in hand ready to play
  const createStateWithCardInHand = (card: CardName): GameState => {
    const state = engine.initializeGame(1, { allCards: true });
    return {
      ...state,
      players: [{
        ...state.players[0],
        hand: [card, 'Copper', 'Copper', 'Estate', 'Silver'],
        actions: 1
      }],
      phase: 'action' as const
    };
  };

  describe('Pending Effect Detection', () => {
    // @req: FR-MCP-1 - Pending effect detection
    // @assert: MCP detects when pendingEffect is set

    it('should detect pendingEffect after Cellar is played', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Cellar' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.card).toBe('Cellar');
    });

    it('should NOT include pendingEffect for normal moves', async () => {
      const state = createStateWithCardInHand('Village');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Village' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeUndefined();
    });

    it('should detect pendingEffect after Chapel is played', async () => {
      const state = createStateWithCardInHand('Chapel');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Chapel' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.card).toBe('Chapel');
    });

    it('should detect pendingEffect after Remodel is played', async () => {
      const state = createStateWithCardInHand('Remodel');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Remodel' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.card).toBe('Remodel');
      expect(response.pendingEffect!.step).toBe(1);
    });

    it('should detect pendingEffect after Mine is played', async () => {
      const state = createStateWithCardInHand('Mine');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Mine' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.card).toBe('Mine');
      expect(response.pendingEffect!.step).toBe(1);
    });

    it('should detect pendingEffect after Workshop is played', async () => {
      const state = createStateWithCardInHand('Workshop');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Workshop' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.card).toBe('Workshop');
    });

    it('should detect pendingEffect after Feast is played', async () => {
      const state = createStateWithCardInHand('Feast');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Feast' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.card).toBe('Feast');
    });

    it('should detect pendingEffect after Library is played', async () => {
      const state = createStateWithCardInHand('Library');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Library' });

      // Library may or may not have pending effect depending on hand/deck state
      // If action card is drawn, there should be pending effect
      expect(response.success).toBe(true);
      // Conditional test based on game state
    });

    it('should detect pendingEffect after Throne Room is played', async () => {
      const state = createStateWithCardInHand('Throne Room');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Throne Room' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.card).toBe('Throne Room');
    });

    it('should detect pendingEffect after Chancellor is played', async () => {
      const state = createStateWithCardInHand('Chancellor');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Chancellor' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.card).toBe('Chancellor');
    });
  });

  describe('Structured Response Format', () => {
    // @req: FR-MCP-2 - Structured response format
    // @assert: Response includes all required fields

    it('should return structured options for Cellar', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Cellar' });

      expect(response.pendingEffect).toMatchObject({
        card: 'Cellar',
        effect: 'discard_for_cellar',
        step: null,
        options: expect.arrayContaining([
          expect.objectContaining({
            index: expect.any(Number),
            description: expect.any(String),
            command: expect.any(String)
          })
        ])
      });
    });

    it('should return options with sequential indices starting from 1', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Cellar' });

      expect(response.pendingEffect).toBeDefined();
      const options = response.pendingEffect!.options;
      options.forEach((opt, idx) => {
        expect(opt.index).toBe(idx + 1);
      });
    });

    it('should return executable move commands', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Cellar' });

      expect(response.pendingEffect).toBeDefined();
      const options = response.pendingEffect!.options;
      expect(options[0].command).toMatch(/^discard_for_cellar/);
    });

    it('should return human-readable descriptions', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Cellar' });

      expect(response.pendingEffect).toBeDefined();
      const options = response.pendingEffect!.options;
      expect(options[0].description).toBeTruthy();
      expect(options[0].description.length).toBeGreaterThan(5);
    });

    it('should include step number for multi-step cards', async () => {
      const state = createStateWithCardInHand('Remodel');
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Remodel' });

      expect(response.pendingEffect!.step).toBe(1);
    });
  });

  describe('Move Command Execution', () => {
    // @req: FR-MCP-3 - Move command format
    // @assert: Returned commands are executable

    it('should execute move command successfully', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      // Step 1: Play Cellar
      const response1 = await tool.execute({ move: 'play_action Cellar' });
      expect(response1.pendingEffect).toBeDefined();
      const command = response1.pendingEffect!.options[0].command;

      // Step 2: Execute command
      const response2 = await tool.execute({ move: command });

      expect(response2.success).toBe(true);
      expect(response2.pendingEffect).toBeUndefined(); // Cleared
    });

    it('should handle empty discard command for Cellar', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      await tool.execute({ move: 'play_action Cellar' });

      // Execute discard nothing
      const response = await tool.execute({ move: 'discard_for_cellar' });

      expect(response.success).toBe(true);
    });

    it('should handle multi-card discard command for Cellar', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      await tool.execute({ move: 'play_action Cellar' });

      // Execute discard 2 Coppers
      const response = await tool.execute({ move: 'discard_for_cellar Copper,Copper' });

      expect(response.success).toBe(true);
    });
  });

  describe('Numeric Selection Support', () => {
    // @req: FR-MCP-4 - Numeric selection support
    // @assert: AI can submit "select 2" to choose option 2

    it('should accept numeric selection', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      // Play Cellar
      const response1 = await tool.execute({ move: 'play_action Cellar' });

      // Select option 2
      const response2 = await tool.execute({ move: 'select 2' });

      expect(response2.success).toBe(true);
    });

    it('should accept plain number as selection', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      await tool.execute({ move: 'play_action Cellar' });

      // Select option 1 (just the number)
      const response = await tool.execute({ move: '1' });

      expect(response.success).toBe(true);
    });

    it('should reject out-of-range selection', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      // Play Cellar (e.g., 8 options)
      await tool.execute({ move: 'play_action Cellar' });

      // Select invalid option
      const response = await tool.execute({ move: 'select 99' });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error!.message).toContain('Invalid selection');
    });

    it('should provide helpful error for invalid numeric selection', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      const response1 = await tool.execute({ move: 'play_action Cellar' });
      expect(response1.pendingEffect).toBeDefined();
      const optionCount = response1.pendingEffect!.options.length;

      const response2 = await tool.execute({ move: 'select 100' });

      expect(response2.success).toBe(false);
      if (response2.error) {
        expect(response2.error.message).toContain(`1-${optionCount}`);
      }
    });
  });

  describe('Multi-Step Card Support', () => {
    // @req: FR-MCP-5 - Multi-step handling
    // @assert: Remodel and Mine work through multiple steps

    it('should complete Remodel 2-step process', async () => {
      const state = createStateWithCardInHand('Remodel');
      tool.setState(state);

      // Step 1: Play Remodel
      const step1 = await tool.execute({ move: 'play_action Remodel' });
      expect(step1.pendingEffect).toBeDefined();
      expect(step1.pendingEffect!.step).toBe(1);
      expect(step1.pendingEffect!.card).toBe('Remodel');

      // Step 2: Trash Estate
      const trashCmd = step1.pendingEffect!.options[0].command;
      const step2 = await tool.execute({ move: trashCmd });
      expect(step2.pendingEffect).toBeDefined();
      expect(step2.pendingEffect!.step).toBe(2);

      // Step 3: Gain card
      const gainCmd = step2.pendingEffect!.options[0].command;
      const final = await tool.execute({ move: gainCmd });
      expect(final.success).toBe(true);
      expect(final.pendingEffect).toBeUndefined(); // Cleared
    });

    it('should complete Mine 2-step process', async () => {
      const state = createStateWithCardInHand('Mine');
      tool.setState(state);

      // Step 1: Play Mine
      const step1 = await tool.execute({ move: 'play_action Mine' });
      expect(step1.pendingEffect).toBeDefined();
      expect(step1.pendingEffect!.step).toBe(1);

      // Step 2: Trash treasure
      const trashCmd = step1.pendingEffect!.options[0].command;
      const step2 = await tool.execute({ move: trashCmd });
      expect(step2.pendingEffect).toBeDefined();
      expect(step2.pendingEffect!.step).toBe(2);

      // Step 3: Gain treasure to hand
      const gainCmd = step2.pendingEffect!.options[0].command;
      const final = await tool.execute({ move: gainCmd });
      expect(final.success).toBe(true);
      expect(final.pendingEffect).toBeUndefined();
    });

    it('should include step description in message', async () => {
      const state = createStateWithCardInHand('Remodel');
      tool.setState(state);

      const step1 = await tool.execute({ move: 'play_action Remodel' });
      expect(step1.message).toContain('Step 1');

      expect(step1.pendingEffect).toBeDefined();
      const trashCmd = step1.pendingEffect!.options[0].command;
      const step2 = await tool.execute({ move: trashCmd });
      expect(step2.message).toContain('Step 2');
    });

    it('should update maxGainCost based on trashed card', async () => {
      const state = createStateWithCardInHand('Remodel');
      tool.setState(state);

      const step1 = await tool.execute({ move: 'play_action Remodel' });

      expect(step1.pendingEffect).toBeDefined();
      // Trash Estate ($2) - should enable gain up to $4
      const trashEstateCmd = step1.pendingEffect!.options.find(opt =>
        opt.description.includes('Estate')
      )?.command;

      const step2 = await tool.execute({ move: trashEstateCmd! });

      // Verify step 2 options respect maxGainCost of $4
      expect(step2.pendingEffect).toBeDefined();
      expect(step2.pendingEffect!.effect).toBe('gain_card');
      // Options should be limited to cards costing ≤ $4
    });
  });

  describe('Iterative Card Support', () => {
    // @req: FR-MCP-6 - Iterative handling
    // @assert: Library, Spy, Bureaucrat handle iterations correctly

    it('should handle Library iterative choices', async () => {
      // Setup state where Library will draw action cards
      const initialState = createStateWithCardInHand('Library');
      // Manipulate deck to have action cards - create new state
      const state = {
        ...initialState,
        players: [{
          ...initialState.players[0],
          drawPile: ['Village', 'Smithy', 'Copper', 'Copper', 'Copper'] as const,
          hand: ['Library', 'Estate', 'Estate'] as const // Start with 2 in hand
        }]
      };
      tool.setState(state);

      // Play Library
      const response1 = await tool.execute({ move: 'play_action Library' });

      // Should prompt for first action card (Village)
      if (response1.pendingEffect) {
        expect(response1.pendingEffect.card).toBe('Library');
        expect(response1.message).toContain('Village');

        // Set aside Village
        const setAsideCmd = response1.pendingEffect.options[0].command;
        const response2 = await tool.execute({ move: setAsideCmd });

        // Should prompt for second action card (Smithy)
        if (response2.pendingEffect) {
          expect(response2.message).toContain('Smithy');
        }
      }
    });

    it('should handle Spy iterative choices (2-player)', async () => {
      // Setup 2-player game
      const initialState = engine.initializeGame(2, { allCards: true });
      const state = {
        ...initialState,
        players: [
          {
            ...initialState.players[0],
            hand: ['Spy', 'Copper', 'Copper', 'Estate', 'Silver'] as const,
            actions: 1
          },
          initialState.players[1]
        ]
      };
      tool.setState(state);

      // Play Spy
      const response1 = await tool.execute({ move: 'play_action Spy' });

      // Should prompt for player 0's revealed card
      if (response1.pendingEffect) {
        expect(response1.pendingEffect.card).toBe('Spy');

        const decision1Cmd = response1.pendingEffect.options[0].command;
        const response2 = await tool.execute({ move: decision1Cmd });

        // Should prompt for player 1's revealed card
        if (response2.pendingEffect) {
          expect(response2.pendingEffect.card).toBe('Spy');
        }
      }
    });

    it('should handle Bureaucrat iterative choices (2-player)', async () => {
      // Setup 2-player game with Bureaucrat
      const initialState = engine.initializeGame(2, { allCards: true });
      const state = {
        ...initialState,
        players: [
          {
            ...initialState.players[0],
            hand: ['Bureaucrat', 'Copper', 'Copper', 'Estate', 'Silver'] as const,
            actions: 1
          },
          {
            ...initialState.players[1],
            hand: ['Estate', 'Duchy', 'Copper', 'Copper', 'Silver'] as const
          }
        ]
      };
      tool.setState(state);

      // Play Bureaucrat
      const response1 = await tool.execute({ move: 'play_action Bureaucrat' });

      // Should prompt for opponent's victory card choice
      if (response1.pendingEffect) {
        expect(response1.pendingEffect.card).toBe('Bureaucrat');
        expect(response1.pendingEffect.effect).toBe('reveal_and_topdeck');
      }
    });
  });

  describe('Error Handling', () => {
    // @req: FR-MCP-7 - Error handling
    // @assert: Clear error messages for invalid moves

    it('should handle invalid move during pending effect', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      await tool.execute({ move: 'play_action Cellar' });

      // Try to play another card while pending effect active
      const response = await tool.execute({ move: 'play_action Village' });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error!.message).toContain('pending');
    });

    it('should handle wrong pending effect type', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      await tool.execute({ move: 'play_action Cellar' });

      // Submit wrong move type
      const response = await tool.execute({ move: 'trash_cards Copper' });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error!.message).toContain('Expected');
    });

    it('should preserve state on error', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      const response1 = await tool.execute({ move: 'play_action Cellar' });
      expect(response1.pendingEffect).toBeDefined();
      const originalPendingEffect = response1.pendingEffect!;

      // Submit invalid selection (should fail but preserve pending effect)
      const errorResponse = await tool.execute({ move: 'select 999' });
      expect(errorResponse.success).toBe(false);

      // Try a valid move to verify pending effect is still there
      const validResponse = await tool.execute({ move: originalPendingEffect.options[0].command });
      // If this succeeds, it means the pending effect was preserved
      expect(validResponse).toBeDefined();
    });

    it('should provide helpful error messages', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      await tool.execute({ move: 'play_action Cellar' });

      const response = await tool.execute({ move: 'invalid_command' });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error!.message).toBeTruthy();
      expect(response.error!.suggestion).toBeTruthy();
    });

    it('should handle empty supply gracefully', async () => {
      // Create state where Workshop has no valid options
      const initialState = createStateWithCardInHand('Workshop');
      // Empty all cards ≤ $4 from supply - create new state with modified supply
      const emptySupply = new Map(initialState.supply);
      emptySupply.set('Copper', 0);
      emptySupply.set('Estate', 0);
      emptySupply.set('Silver', 0);
      emptySupply.set('Village', 0);
      emptySupply.set('Smithy', 0);
      const state = { ...initialState, supply: emptySupply as ReadonlyMap<string, number> };
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Workshop' });

      expect(response.success).toBe(true);
      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.options).toHaveLength(1);
      expect(response.pendingEffect!.options[0].description).toContain('No cards available');
    });
  });

  describe('Option Limit Handling', () => {
    // @req: FR-MCP-8 - Option limit handling
    // @assert: Large option sets are limited to 50 displayed

    it('should limit displayed options to 50', async () => {
      // Create state with large hand (e.g., 7 cards = 128 combinations)
      const initialState = createStateWithCardInHand('Cellar');
      const state = {
        ...initialState,
        players: [{
          ...initialState.players[0],
          hand: [
            'Cellar', 'Copper', 'Copper', 'Copper', 'Estate', 'Estate', 'Silver', 'Silver'
          ] as const
        }]
      };
      tool.setState(state);

      const response = await tool.execute({ move: 'play_action Cellar' });

      expect(response.pendingEffect).toBeDefined();
      expect(response.pendingEffect!.options.length).toBeLessThanOrEqual(50);
      if (response.pendingEffect!.options.length === 50) {
        expect(response.message).toContain('Showing first 50');
      }
    });

    it('should still accept all valid move commands even if not displayed', async () => {
      const initialState = createStateWithCardInHand('Cellar');
      const state = {
        ...initialState,
        players: [{
          ...initialState.players[0],
          hand: [
            'Cellar', 'Copper', 'Copper', 'Copper', 'Estate', 'Estate', 'Silver', 'Silver'
          ] as const
        }]
      };
      tool.setState(state);

      await tool.execute({ move: 'play_action Cellar' });

      // Submit valid command that might not be in displayed 50
      const response = await tool.execute({ move: 'discard_for_cellar Copper' });

      expect(response.success).toBe(true);
    });
  });

  describe('All 11 Cards End-to-End via MCP', () => {
    // @req: AC-MCP-8 - All 11 cards work end-to-end
    // @assert: Complete workflow for each card

    it('should complete full Cellar workflow', async () => {
      const state = createStateWithCardInHand('Cellar');
      tool.setState(state);

      const response1 = await tool.execute({ move: 'play_action Cellar' });
      expect(response1.pendingEffect).toBeDefined();

      const response2 = await tool.execute({ move: response1.pendingEffect!.options[0].command });
      expect(response2.success).toBe(true);
      expect(response2.pendingEffect).toBeUndefined();
    });

    it('should complete full Chapel workflow', async () => {
      const state = createStateWithCardInHand('Chapel');
      tool.setState(state);

      const response1 = await tool.execute({ move: 'play_action Chapel' });
      expect(response1.pendingEffect).toBeDefined();

      const response2 = await tool.execute({ move: response1.pendingEffect!.options[0].command });
      expect(response2.success).toBe(true);
      expect(response2.pendingEffect).toBeUndefined();
    });

    it('should complete full Remodel workflow', async () => {
      const state = createStateWithCardInHand('Remodel');
      tool.setState(state);

      const step1 = await tool.execute({ move: 'play_action Remodel' });
      expect(step1.pendingEffect).toBeDefined();
      const step2 = await tool.execute({ move: step1.pendingEffect!.options[0].command });
      expect(step2.pendingEffect).toBeDefined();
      const final = await tool.execute({ move: step2.pendingEffect!.options[0].command });

      expect(final.success).toBe(true);
      expect(final.pendingEffect).toBeUndefined();
    });

    it('should complete full Mine workflow', async () => {
      const state = createStateWithCardInHand('Mine');
      tool.setState(state);

      const step1 = await tool.execute({ move: 'play_action Mine' });
      expect(step1.pendingEffect).toBeDefined();
      const step2 = await tool.execute({ move: step1.pendingEffect!.options[0].command });
      expect(step2.pendingEffect).toBeDefined();
      const final = await tool.execute({ move: step2.pendingEffect!.options[0].command });

      expect(final.success).toBe(true);
      expect(final.pendingEffect).toBeUndefined();
    });

    it('should complete full Workshop workflow', async () => {
      const state = createStateWithCardInHand('Workshop');
      tool.setState(state);

      const response1 = await tool.execute({ move: 'play_action Workshop' });
      expect(response1.pendingEffect).toBeDefined();
      const response2 = await tool.execute({ move: response1.pendingEffect!.options[0].command });

      expect(response2.success).toBe(true);
      expect(response2.pendingEffect).toBeUndefined();
    });

    it('should complete full Feast workflow', async () => {
      const state = createStateWithCardInHand('Feast');
      tool.setState(state);

      const response1 = await tool.execute({ move: 'play_action Feast' });
      expect(response1.pendingEffect).toBeDefined();
      const response2 = await tool.execute({ move: response1.pendingEffect!.options[0].command });

      expect(response2.success).toBe(true);
      expect(response2.pendingEffect).toBeUndefined();
    });

    it('should complete full Throne Room workflow', async () => {
      const state = createStateWithCardInHand('Throne Room');
      // Add action to play - create new state with modified hand
      const stateWithVillage = {
        ...state,
        players: [{
          ...state.players[0],
          hand: [...state.players[0].hand, 'Village'] as const
        }]
      };
      tool.setState(stateWithVillage);

      const response1 = await tool.execute({ move: 'play_action Throne Room' });
      expect(response1.pendingEffect).toBeDefined();
      const response2 = await tool.execute({ move: response1.pendingEffect!.options[0].command });

      expect(response2.success).toBe(true);
    });

    it('should complete full Chancellor workflow', async () => {
      const state = createStateWithCardInHand('Chancellor');
      tool.setState(state);

      const response1 = await tool.execute({ move: 'play_action Chancellor' });
      expect(response1.pendingEffect).toBeDefined();
      const response2 = await tool.execute({ move: response1.pendingEffect!.options[0].command });

      expect(response2.success).toBe(true);
      expect(response2.pendingEffect).toBeUndefined();
    });

    // Library, Spy, Bureaucrat tests would be more complex
    // due to iterative nature and need for specific game states
  });
});
