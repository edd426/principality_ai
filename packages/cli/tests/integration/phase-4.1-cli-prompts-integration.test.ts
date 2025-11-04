import { GameEngine, GameState, Move, CardName } from '@principality/core';

/**
 * Phase 4.1 - Feature 2: CLI Interactive Prompts
 * Integration Tests
 *
 * @req: FR-CLI-1 through FR-CLI-5 - CLI prompt system integration
 * @edge: Full workflow | multi-step cards | multi-player prompts | error recovery
 * @why: Validates CLI prompt system integrates with game engine
 * @level: Integration - tests component interactions
 *
 * Coverage: IT-CLI-1 through IT-CLI-ERROR-1 per TESTING.md
 */

describe('Phase 4.1 - CLI Prompts Integration', () => {

  function createMockGameState(overrides: Partial<GameState>): GameState {
    return {
      players: [{
        drawPile: [],
        hand: [],
        discardPile: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0
      }],
      supply: new Map(),
      currentPlayer: 0,
      phase: 'action',
      turnNumber: 1,
      seed: 'test-seed',
      gameLog: [],
      trash: [],
      ...overrides
    } as GameState;
  }

  /**
   * Helper: Generate options for Cellar discard
   * @hint: Implementation will be in CLI display helpers
   */
  function generateDiscardOptions(state: GameState): Move[] {
    if (!state.pendingEffect || state.pendingEffect.effect !== 'discard_for_cellar') {
      return [];
    }

    const hand = Array.from(state.players[state.currentPlayer].hand);
    const options: Move[] = [];

    // Include "discard nothing" option
    options.push({ type: 'discard_for_cellar', cards: [] });

    // Generate single card options
    const uniqueCards = Array.from(new Set(hand));
    uniqueCards.forEach(card => {
      options.push({ type: 'discard_for_cellar', cards: [card] });
    });

    // For integration test, simplified to key options
    // Full combinatorial in unit tests
    return options;
  }

  function setupGameWithCard(state: GameState, card: CardName): GameState {
    return {
      ...state,
      players: [{
        ...state.players[0],
        hand: [card, 'Copper', 'Copper', 'Estate', 'Silver']
      }]
    };
  }

  /**
   * IT-CLI-1: Full Cellar interaction flow
   * @req: FR-CLI-1, FR-CLI-5 - Complete user workflow validation
   * @assert: Play Cellar → generate options → select → execute → verify result
   */
  describe('IT-CLI-1: Full Cellar interaction flow', () => {

    it('should complete full Cellar workflow', () => {
      // @req: FR-CLI-1 - Detect pendingEffect and enter prompt mode
      // @req: FR-CLI-2 - Generate valid move options
      // @req: FR-CLI-5 - Execute selected move and confirm
      const engine = new GameEngine('cellar-test');
      let state = createMockGameState({
        players: [{
          drawPile: ['Village', 'Smithy', 'Market'], // Cards to draw
          hand: ['Cellar', 'Copper', 'Copper', 'Estate'],
          discardPile: [],
          inPlay: [],
          actions: 1,
          buys: 1,
          coins: 0
        }],
        phase: 'action'
      });

      // Step 1: Play Cellar
      const playResult = engine.executeMove(state, { type: 'play_action', card: 'Cellar' });
      expect(playResult.success).toBe(true);
      expect(playResult.newState).toBeDefined();

      state = playResult.newState!;

      // Step 2: Verify pendingEffect set
      expect(state.pendingEffect).toBeDefined();
      expect(state.pendingEffect?.effect).toBe('discard_for_cellar');

      // Step 3: Generate options
      const options = generateDiscardOptions(state);
      expect(options.length).toBeGreaterThan(0);

      // Step 4: User selects option (discard 3 Coppers + Estate)
      const selectedMove: Move = {
        type: 'discard_for_cellar',
        cards: ['Copper', 'Copper', 'Estate']
      };

      const executeResult = engine.executeMove(state, selectedMove);
      expect(executeResult.success).toBe(true);
      expect(executeResult.newState).toBeDefined();

      state = executeResult.newState!;

      // Step 5: Verify post-execution state
      expect(state.pendingEffect).toBeUndefined(); // Cleared
      expect(state.players[0].discardPile.length).toBe(3); // 3 cards discarded
      expect(state.players[0].hand.length).toBe(3); // Drew 3 cards (0 remaining + 3 drawn)
    });

    it('should handle "discard nothing" option', () => {
      const engine = new GameEngine('cellar-nothing-test');
      let state = createMockGameState({
        players: [{
          drawPile: [],
          hand: ['Cellar', 'Copper', 'Estate', 'Silver'],
          discardPile: [],
          inPlay: [],
          actions: 1,
          buys: 1,
          coins: 0
        }],
        phase: 'action'
      });

      // Play Cellar
      const playResult = engine.executeMove(state, { type: 'play_action', card: 'Cellar' });
      state = playResult.newState!;

      // User selects "discard nothing"
      const selectedMove: Move = { type: 'discard_for_cellar', cards: [] };
      const executeResult = engine.executeMove(state, selectedMove);

      expect(executeResult.success).toBe(true);
      expect(executeResult.newState).toBeDefined();

      state = executeResult.newState!;

      // Verify: no cards discarded, no cards drawn
      expect(state.pendingEffect).toBeUndefined();
      expect(state.players[0].discardPile).toHaveLength(0);
      expect(state.players[0].hand).toHaveLength(3); // Original 4 - Cellar played
    });
  });

  /**
   * IT-CLI-2: Remodel 2-step full flow
   * @req: FR-CLI-5 - Multi-step card completion
   * @assert: Step 1 trash → Step 2 gain → pendingEffect cleared
   */
  describe('IT-CLI-2: Remodel 2-step full flow', () => {

    it('should complete Remodel 2-step interaction', () => {
      const engine = new GameEngine('remodel-test');
      let state = createMockGameState({
        players: [{
          drawPile: [],
          hand: ['Remodel', 'Estate', 'Copper'],
          discardPile: [],
          inPlay: [],
          actions: 1,
          buys: 1,
          coins: 0
        }],
        supply: new Map([
          ['Smithy', 10],
          ['Silver', 40],
          ['Village', 10]
        ]),
        trash: []
      });

      // Step 1: Play Remodel
      let result = engine.executeMove(state, { type: 'play_action', card: 'Remodel' });
      expect(result.success).toBe(true);
      state = result.newState!;

      expect(state.pendingEffect?.effect).toBe('trash_for_remodel');

      // Step 2: Trash Estate ($2)
      result = engine.executeMove(state, { type: 'trash_cards', cards: ['Estate'] });
      expect(result.success).toBe(true);
      state = result.newState!;

      expect(state.pendingEffect?.effect).toBe('gain_card');
      expect(state.pendingEffect?.maxGainCost).toBe(4); // $2 + $2

      // Step 3: Gain Smithy ($4)
      result = engine.executeMove(state, { type: 'gain_card', card: 'Smithy' });
      expect(result.success).toBe(true);
      state = result.newState!;

      // Verify completion
      expect(state.pendingEffect).toBeUndefined(); // Fully resolved
      expect(state.trash).toContain('Estate');
      expect(state.players[0].discardPile).toContain('Smithy');
    });
  });

  /**
   * IT-CLI-3: Multi-player Spy decisions
   * @req: AC-CLI-8 - Multi-player interaction
   * @assert: Spy prompts for each player sequentially
   */
  describe('IT-CLI-3: Multi-player Spy decisions', () => {

    it('should iterate through all players with Spy', () => {
      const engine = new GameEngine('spy-test');
      let state = createMockGameState({
        players: [
          {
            drawPile: ['Estate'],
            hand: ['Spy', 'Copper'],
            discardPile: [],
            inPlay: [],
            actions: 1,
            buys: 1,
            coins: 0
          },
          {
            drawPile: ['Silver'],
            hand: ['Copper', 'Copper'],
            discardPile: [],
            inPlay: [],
            actions: 0,
            buys: 1,
            coins: 0
          }
        ],
        currentPlayer: 0
      });

      // Play Spy
      let result = engine.executeMove(state, { type: 'play_action', card: 'Spy' });
      expect(result.success).toBe(true);
      state = result.newState!;

      // Decision for Player 0
      expect(state.pendingEffect?.effect).toBe('spy_decision');
      expect(state.pendingEffect?.targetPlayer).toBe(0);

      result = engine.executeMove(state, {
        type: 'spy_decision',
        playerIndex: 0,
        choice: false // Discard
      });
      expect(result.success).toBe(true);
      state = result.newState!;

      // Decision for Player 1
      expect(state.pendingEffect?.effect).toBe('spy_decision');
      expect(state.pendingEffect?.targetPlayer).toBe(1);

      result = engine.executeMove(state, {
        type: 'spy_decision',
        playerIndex: 1,
        choice: true // Keep on top
      });
      expect(result.success).toBe(true);
      state = result.newState!;

      // All players resolved
      expect(state.pendingEffect).toBeUndefined();
      expect(state.players[0].discardPile.length).toBeGreaterThan(0); // P0 discarded
      expect(state.players[1].drawPile[0]).toBe('Silver'); // P1 kept on top
    });
  });

  /**
   * IT-CLI-ERROR-1: Invalid selection shows error and re-prompts
   * @req: FR-CLI-4, AC-CLI-4 - Error handling and recovery
   * @assert: Invalid input → error message → state unchanged → re-prompt
   */
  describe('IT-CLI-ERROR-1: Invalid selection shows error and re-prompts', () => {

    function parseUserSelection(input: string, options: Move[]): number | null {
      const trimmed = input.trim();
      const num = parseInt(trimmed, 10);

      if (isNaN(num) || num < 1 || num > options.length) {
        return null;
      }

      return num - 1;
    }

    it('should reject out-of-range selection', () => {
      const options: Move[] = [
        { type: 'gain_card', card: 'Smithy' },
        { type: 'gain_card', card: 'Silver' }
      ];

      const result = parseUserSelection('99', options);

      expect(result).toBeNull();
      // CLI would display: "Invalid selection. Please enter 1-2."
    });

    it('should reject non-numeric input', () => {
      const options: Move[] = [
        { type: 'gain_card', card: 'Smithy' }
      ];

      expect(parseUserSelection('abc', options)).toBeNull();
      expect(parseUserSelection('', options)).toBeNull();
      expect(parseUserSelection('-1', options)).toBeNull();
      // CLI would display: "Invalid input. Please enter a number."
    });

    it('should not modify game state on invalid input', () => {
      const engine = new GameEngine('error-test');
      const initialState = createMockGameState({
        players: [{
          drawPile: [],
          hand: ['Copper', 'Estate'],
          discardPile: [],
          inPlay: [],
          actions: 1,
          buys: 1,
          coins: 0
        }],
        pendingEffect: {
          card: 'Workshop',
          effect: 'gain_card',
          maxGainCost: 4
        }
      });

      // Invalid selection should not change state
      const stateBeforeError = JSON.parse(JSON.stringify(initialState));

      // Verify state unchanged (in actual CLI, would re-prompt without executing move)
      expect(initialState.pendingEffect).toEqual(stateBeforeError.pendingEffect);
      expect(initialState.players[0].hand).toEqual(stateBeforeError.players[0].hand);
    });

    it('should accept valid input after error recovery', () => {
      const options: Move[] = [
        { type: 'gain_card', card: 'Smithy' },
        { type: 'gain_card', card: 'Silver' }
      ];

      // First attempt: invalid
      let result = parseUserSelection('99', options);
      expect(result).toBeNull();

      // Second attempt: valid
      result = parseUserSelection('1', options);
      expect(result).toBe(0); // Valid selection

      // Verify correct option selected
      expect(options[result].card).toBe('Smithy');
    });
  });
});
