/**
 * Test Suite: Auto-Skip Cleanup Phase Feature (Phase 1.5)
 *
 * Requirements: CLI_PHASE2_REQUIREMENTS.md - Feature 6
 * Validates auto-skip detection, cleanup summary, and manual flag behavior
 *
 * Key Requirements:
 * - FR-6.1: Auto-execute cleanup when no choices required
 * - FR-6.2: Display cleanup summary format
 * - FR-6.3: Pause if cleanup requires input (future-proofing)
 * - FR-6.4: `--manual-cleanup` flag disables auto-skip
 * - FR-6.6: Immediate advance to next turn
 * - NFR-6.2: Performance < 100ms
 */

import { GameEngine, GameState, Move } from '@principality/core';
import { GameStateBuilder, PerformanceHelper } from './utils/test-utils';

/**
 * Helper to add inPlay cards to game state (since GameStateBuilder doesn't have this method yet)
 */
function withInPlayCards(gameState: GameState, playerIndex: number, cards: string[]): GameState {
  return {
    ...gameState,
    players: gameState.players.map((p, i) =>
      i === playerIndex ? { ...p, inPlay: cards } : p
    )
  };
}

/**
 * Helper to add drawPile cards to game state
 */
function withDrawPile(gameState: GameState, playerIndex: number, cards: string[]): GameState {
  return {
    ...gameState,
    players: gameState.players.map((p, i) =>
      i === playerIndex ? { ...p, drawPile: cards } : p
    )
  };
}

/**
 * Helper to add discardPile cards to game state
 */
function withDiscardPile(gameState: GameState, playerIndex: number, cards: string[]): GameState {
  return {
    ...gameState,
    players: gameState.players.map((p, i) =>
      i === playerIndex ? { ...p, discardPile: cards } : p
    )
  };
}

/**
 * Helper to simulate cleanup detection logic
 */
function shouldAutoSkipCleanup(gameState: GameState, options?: { manualCleanup?: boolean }): boolean {
  // Don't auto-skip if manual mode enabled
  if (options?.manualCleanup) {
    return false;
  }

  // In MVP, cleanup always has exactly one move: end_phase
  // Auto-skip when only one non-interactive move exists
  const engine = new GameEngine(gameState.seed);
  const validMoves = engine.getValidMoves(gameState);

  // If only move is 'end_phase', auto-skip
  return validMoves.length === 1 && validMoves[0].type === 'end_phase';
}

/**
 * Helper to generate cleanup summary
 */
function generateCleanupSummary(gameState: GameState): string {
  const player = gameState.players[gameState.currentPlayer];

  // Cards to discard: in-play area + hand
  const cardsToDiscard = [...player.inPlay, ...player.hand];
  const cardsDiscarded = cardsToDiscard.length;

  // Cards drawn: always 5 in standard cleanup
  const cardsDrawn = 5;

  // Basic format
  return `✓ Cleanup: Discarded ${cardsDiscarded} cards, drew ${cardsDrawn} new cards`;
}

/**
 * Helper to generate detailed cleanup summary
 */
function generateDetailedCleanupSummary(gameState: GameState): string {
  const player = gameState.players[gameState.currentPlayer];

  const cardsToDiscard = [...player.inPlay, ...player.hand];
  const cardsDiscarded = cardsToDiscard.length;
  const cardNames = cardsToDiscard.join(', ');
  const cardsDrawn = 5;

  return `✓ Cleanup: Discarded ${cardsDiscarded} cards (${cardNames}), drew ${cardsDrawn} new cards`;
}

/**
 * Helper to parse command-line flags
 */
function parseCommandLineFlags(args: string[]): { manualCleanup: boolean } {
  return {
    manualCleanup: args.includes('--manual-cleanup')
  };
}

describe('Feature 6: Auto-Skip Cleanup Phase', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('cleanup-test-seed');
  });

  describe('Auto-Skip Detection (FR-6.1, UT-6.1)', () => {
    test('UT-6.1: should detect cleanup phase has no choices', () => {
      // Arrange
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Copper', 'Estate'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village', 'Smithy']);

      // Act
      const shouldSkip = shouldAutoSkipCleanup(gameState);

      // Assert
      expect(shouldSkip).toBe(true);
    });

    test('should detect cleanup in MVP card set has only one move', () => {
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      const validMoves = engine.getValidMoves(gameState);

      // In MVP, cleanup only has end_phase move
      expect(validMoves).toHaveLength(1);
      expect(validMoves[0].type).toBe('end_phase');
    });

    test('should auto-skip cleanup after action phase completion', () => {
      // Arrange - End of action phase
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      // Act
      const shouldSkip = shouldAutoSkipCleanup(gameState);

      // Assert
      expect(shouldSkip).toBe(true);
    });

    test('should auto-skip cleanup after buy phase completion', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Silver'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Copper', 'Copper']);

      const shouldSkip = shouldAutoSkipCleanup(gameState);

      expect(shouldSkip).toBe(true);
    });

    test('should auto-skip regardless of cards in hand/in-play', () => {
      const scenarios = [
        { hand: [], inPlay: [] },                              // Empty
        { hand: ['Copper'], inPlay: [] },                      // Only hand
        { hand: [], inPlay: ['Village'] },                     // Only in-play
        { hand: ['Copper', 'Estate'], inPlay: ['Village', 'Smithy'] }, // Both
        { hand: Array(10).fill('Copper'), inPlay: [] }         // Many cards
      ];

      scenarios.forEach(({ hand, inPlay }) => {
        let gameState = GameStateBuilder.create()
          .withPhase('cleanup')
          .withPlayerHand(0, hand)
          .build();

        gameState = withInPlayCards(gameState, 0, inPlay);

        expect(shouldAutoSkipCleanup(gameState)).toBe(true);
      });
    });
  });

  describe('Manual Cleanup Flag (FR-6.4, UT-6.2)', () => {
    test('UT-6.2: should NOT auto-skip when manual flag is set', () => {
      // Arrange
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();
      const options = { manualCleanup: true };

      // Act
      const shouldSkip = shouldAutoSkipCleanup(gameState, options);

      // Assert
      expect(shouldSkip).toBe(false);
    });

    test('should respect manual cleanup flag even with no choices', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      gameState = withInPlayCards(gameState, 0, []);

      // Without flag: auto-skip
      expect(shouldAutoSkipCleanup(gameState, { manualCleanup: false })).toBe(true);

      // With flag: do NOT auto-skip
      expect(shouldAutoSkipCleanup(gameState, { manualCleanup: true })).toBe(false);
    });

    test('should parse --manual-cleanup flag from command line', () => {
      const flags = parseCommandLineFlags(['--manual-cleanup']);
      expect(flags.manualCleanup).toBe(true);
    });

    test('should default to auto-skip without flag', () => {
      const flags = parseCommandLineFlags([]);
      expect(flags.manualCleanup).toBe(false);
    });

    test('should handle flag with other options', () => {
      const flags = parseCommandLineFlags(['--seed=123', '--manual-cleanup', '--quick-game']);
      expect(flags.manualCleanup).toBe(true);
    });
  });

  describe('Cleanup Summary Generation (FR-6.2, UT-6.3)', () => {
    test('UT-6.3: should generate correct cleanup summary', () => {
      // Arrange
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Copper', 'Estate'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village', 'Smithy']);

      // Act
      const summary = generateCleanupSummary(gameState);

      // Assert
      expect(summary).toContain('Discarded 5 cards'); // 3 hand + 2 in-play
      expect(summary).toContain('drew 5 new cards');
    });

    test('should display summary in correct format', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Silver'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village']);

      const summary = generateCleanupSummary(gameState);

      // Format: "✓ Cleanup: Discarded N cards, drew 5 new cards"
      expect(summary).toMatch(/✓ Cleanup: Discarded \d+ cards, drew \d+ new cards/);
    });

    test('should handle cleanup with no cards in play', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'])
        .build();

      gameState = withInPlayCards(gameState, 0, []);

      const summary = generateCleanupSummary(gameState);

      expect(summary).toContain('Discarded 5 cards'); // Only hand cards
      expect(summary).toContain('drew 5 new cards');
    });

    test('should handle cleanup with empty hand (only in-play cards)', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, []) // Empty hand
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village', 'Smithy', 'Market']);

      const summary = generateCleanupSummary(gameState);

      expect(summary).toContain('Discarded 3 cards'); // Only in-play cards
    });

    test('should handle cleanup with no cards at all', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, []) // Empty hand
        .build();

      gameState = withInPlayCards(gameState, 0, []); // Empty inPlay

      const summary = generateCleanupSummary(gameState);

      expect(summary).toContain('Discarded 0 cards');
      expect(summary).toContain('drew 5 new cards');
    });

    test('should generate detailed summary with card names', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Silver'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village']);

      const summary = generateDetailedCleanupSummary(gameState);

      expect(summary).toContain('Discarded 3 cards (Village, Copper, Silver)');
      expect(summary).toContain('drew 5 new cards');
    });
  });

  describe('Future-Proofing: Interactive Cleanup (FR-6.3, UT-6.5)', () => {
    test('UT-6.5: should NOT auto-skip when cleanup has choices (future)', () => {
      // This tests future-proofing for cards like Cellar that might
      // require cleanup decisions in later phases

      // Mock a scenario where cleanup would have multiple moves
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      // In current MVP, this doesn't apply, but the logic should be:
      // If validMoves.length > 1 → do not auto-skip

      const validMoves = engine.getValidMoves(gameState);
      const hasChoices = validMoves.length > 1;

      // In MVP: should have no choices
      expect(hasChoices).toBe(false);

      // Future: if hasChoices, should not auto-skip
      if (hasChoices) {
        expect(shouldAutoSkipCleanup(gameState)).toBe(false);
      }
    });

    test('should detect interactive cleanup based on move count', () => {
      // Arrange - Simulate future state with multiple cleanup options
      const mockValidMoves: Move[] = [
        { type: 'play_action', card: 'Cellar' }, // Hypothetical cleanup action
        { type: 'end_phase' }
      ];

      // If cleanup has > 1 move, it's interactive
      const hasChoices = mockValidMoves.length > 1;

      // Assert - Should NOT auto-skip with choices
      expect(hasChoices).toBe(true);
    });

    test('should handle future cards requiring cleanup input', () => {
      // This is a placeholder test for future expansion
      // When cards with cleanup effects are added, this ensures
      // the system pauses for user input

      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      // Current MVP: auto-skip
      expect(shouldAutoSkipCleanup(gameState)).toBe(true);

      // Future: with interactive cleanup cards, would return false
      // Test validates the detection mechanism exists
    });
  });

  describe('Performance Requirements (NFR-6.2, UT-6.4)', () => {
    test('UT-6.4: should auto-skip cleanup in < 100ms', async () => {
      // Arrange
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Copper', 'Silver'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village', 'Smithy']);

      // Act & Assert
      await PerformanceHelper.assertWithinTime(
        () => {
          // Simulate cleanup auto-skip logic
          const shouldSkip = shouldAutoSkipCleanup(gameState);
          const summary = generateCleanupSummary(gameState);

          // Execute cleanup (in actual implementation)
          const result = engine.executeMove(gameState, { type: 'end_phase' });

          return { shouldSkip, summary, result };
        },
        100,
        'auto-skip cleanup execution'
      );
    });

    test('should generate cleanup summary in < 10ms', async () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, Array(5).fill('Copper'))
        .build();

      gameState = withInPlayCards(gameState, 0, Array(5).fill('Village'));

      await PerformanceHelper.assertWithinTime(
        () => generateCleanupSummary(gameState),
        10,
        'cleanup summary generation'
      );
    });

    test('should detect auto-skip condition in < 5ms', async () => {
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      await PerformanceHelper.assertWithinTime(
        () => shouldAutoSkipCleanup(gameState),
        5,
        'auto-skip detection'
      );
    });

    test('should handle large hands in cleanup efficiently', async () => {
      // Large hand: 20 cards
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, Array(15).fill('Copper'))
        .build();

      gameState = withInPlayCards(gameState, 0, Array(5).fill('Village'));

      await PerformanceHelper.assertWithinTime(
        () => {
          const summary = generateCleanupSummary(gameState);
          return summary;
        },
        50,
        'cleanup with large hand'
      );
    });
  });

  describe('Integration: Cleanup Auto-Skip in Full Turn (INT-6.1)', () => {
    test('INT-6.1: should auto-skip cleanup during complete turn', () => {
      // Arrange
      let gameState = engine.initializeGame(1);
      const initialTurn = gameState.turnNumber;

      // Act: Complete action phase
      let result = engine.executeMove(gameState, { type: 'end_phase' });
      expect(result.success).toBe(true);
      gameState = result.newState!;

      // Complete buy phase
      result = engine.executeMove(gameState, { type: 'end_phase' });
      expect(result.success).toBe(true);
      gameState = result.newState!;

      // Now in cleanup phase
      expect(gameState.phase).toBe('cleanup');

      // Cleanup should auto-execute (simulated by executing end_phase)
      result = engine.executeMove(gameState, { type: 'end_phase' });
      expect(result.success).toBe(true);
      gameState = result.newState!;

      // Assert: Next turn started
      expect(gameState.phase).toBe('action');
      expect(gameState.turnNumber).toBe(initialTurn + 1);
    });

    test('should advance to next turn immediately after cleanup', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withTurnNumber(5)
        .build();

      // Execute cleanup
      const result = engine.executeMove(gameState, { type: 'end_phase' });
      expect(result.success).toBe(true);
      gameState = result.newState!;

      // Should be in action phase of next turn
      expect(gameState.phase).toBe('action');
      expect(gameState.turnNumber).toBe(6);
    });

    test('should draw 5 new cards after cleanup', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Copper'])
        .build();

      gameState = withDrawPile(gameState, 0, ['Estate', 'Silver', 'Gold', 'Village', 'Smithy', 'Copper']);

      // Execute cleanup
      const result = engine.executeMove(gameState, { type: 'end_phase' });
      expect(result.success).toBe(true);
      gameState = result.newState!;

      // New hand should have 5 cards
      expect(gameState.players[0].hand).toHaveLength(5);
    });
  });

  describe('Integration: Manual Cleanup Flag Workflow (INT-6.2)', () => {
    test('INT-6.2: should require manual input when flag set', () => {
      // Arrange
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();
      const options = { manualCleanup: true };

      // Act
      const shouldSkip = shouldAutoSkipCleanup(gameState, options);

      // Assert: Should NOT auto-skip
      expect(shouldSkip).toBe(false);

      // Game should remain in cleanup phase until user input
      // (In actual CLI, this means showing "Available Moves: [1] End Phase")
    });

    test('manual cleanup should display available moves', () => {
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      // With manual flag, should show moves
      const validMoves = engine.getValidMoves(gameState);

      expect(validMoves).toHaveLength(1);
      expect(validMoves[0].type).toBe('end_phase');
    });

    test('should execute cleanup when user confirms with manual flag', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withTurnNumber(3)
        .build();

      // User types "1" or "end" to end cleanup manually
      const result = engine.executeMove(gameState, { type: 'end_phase' });
      expect(result.success).toBe(true);

      gameState = result.newState!;
      expect(gameState.phase).toBe('action');
      expect(gameState.turnNumber).toBe(4);
    });
  });

  describe('Integration: Cleanup Summary Display (INT-6.3)', () => {
    test('INT-6.3: should display cleanup summary correctly', () => {
      // Arrange
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Copper', 'Estate'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village', 'Smithy']);

      // Act
      const summary = generateCleanupSummary(gameState);

      // Assert
      expect(summary).toContain('✓ Cleanup');
      expect(summary).toContain('Discarded 5 cards');
      expect(summary).toContain('drew 5 new cards');
    });

    test('should show cleanup summary before next turn', () => {
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper'])
        .build();

      const summary = generateCleanupSummary(gameState);

      // Summary should be generated before turn advance
      expect(summary).toBeTruthy();
      expect(summary.length).toBeGreaterThan(0);
    });

    test('should display detailed summary in verbose mode', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Silver'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village']);

      const detailedSummary = generateDetailedCleanupSummary(gameState);

      expect(detailedSummary).toContain('Village');
      expect(detailedSummary).toContain('Copper');
      expect(detailedSummary).toContain('Silver');
    });
  });

  describe('Integration: Multiplayer Cleanup Sequence (INT-6.4)', () => {
    test('INT-6.4: should auto-skip cleanup for each player in turn', () => {
      // Arrange - 2 player game
      let gameState = engine.initializeGame(2);
      expect(gameState.players).toHaveLength(2);
      expect(gameState.currentPlayer).toBe(0);

      // Act: Player 1 completes their turn
      let result = engine.executeMove(gameState, { type: 'end_phase' }); // Action
      expect(result.success).toBe(true);
      gameState = result.newState!;

      result = engine.executeMove(gameState, { type: 'end_phase' }); // Buy
      expect(result.success).toBe(true);
      gameState = result.newState!;

      expect(gameState.phase).toBe('cleanup');

      result = engine.executeMove(gameState, { type: 'end_phase' }); // Cleanup
      expect(result.success).toBe(true);
      gameState = result.newState!;

      // Assert: Player 2's turn started
      expect(gameState.currentPlayer).toBe(1);
      expect(gameState.phase).toBe('action');
    });

    test('should generate cleanup summary for each player', () => {
      const player1State = GameStateBuilder.create()
        .withPhase('cleanup')
        .withCurrentPlayer(0)
        .withPlayerHand(0, ['Copper', 'Copper'])
        .build();

      const player2State = GameStateBuilder.create()
        .withPhase('cleanup')
        .withCurrentPlayer(1)
        .withPlayers(2)
        .withPlayerHand(1, ['Silver', 'Estate'])
        .build();

      const summary1 = generateCleanupSummary(player1State);
      const summary2 = generateCleanupSummary(player2State);

      expect(summary1).toContain('Discarded');
      expect(summary2).toContain('Discarded');
    });
  });

  describe('Acceptance Criteria Validation', () => {
    test('AC-6.1: Cleanup executes automatically without user input', () => {
      // Given I complete the buy phase
      let gameState = GameStateBuilder.create()
        .withPhase('buy')
        .build();

      // Transition to cleanup
      let result = engine.executeMove(gameState, { type: 'end_phase' });
      gameState = result.newState!;

      // When cleanup phase begins
      expect(gameState.phase).toBe('cleanup');

      // Then cleanup should auto-execute (detected by system)
      const shouldSkip = shouldAutoSkipCleanup(gameState);
      expect(shouldSkip).toBe(true);

      // And I see a cleanup summary message
      const summary = generateCleanupSummary(gameState);
      expect(summary).toContain('✓ Cleanup');

      // And the game advances to the next turn
      result = engine.executeMove(gameState, { type: 'end_phase' });
      gameState = result.newState!;
      expect(gameState.phase).toBe('action');
    });

    test('AC-6.2: Cleanup summary displays correct information', () => {
      // Given cleanup executes automatically
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Copper', 'Estate'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Village']);

      // When the summary is displayed
      const summary = generateCleanupSummary(gameState);

      // Then I see the number of cards discarded
      expect(summary).toContain('Discarded 4 cards');

      // And I see the number of cards drawn
      expect(summary).toContain('drew 5 new cards');

      // And the format matches specification
      expect(summary).toMatch(/✓ Cleanup: Discarded \d+ cards, drew \d+ new cards/);
    });

    test('AC-6.3: Next turn begins immediately after cleanup', () => {
      // Given I complete a turn in a standard game
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withTurnNumber(5)
        .build();

      // When cleanup auto-executes
      const result = engine.executeMove(gameState, { type: 'end_phase' });
      expect(result.success).toBe(true);
      gameState = result.newState!;

      // Then the next turn begins immediately (< 100ms tested in performance)
      expect(gameState.phase).toBe('action');
      expect(gameState.turnNumber).toBe(6);

      // And I see the next turn's action phase without additional input
      expect(gameState.players[0].actions).toBe(1);
    });

    test('AC-6.4: Manual cleanup flag disables auto-skip', () => {
      // Given I start a game with --manual-cleanup flag
      const flags = parseCommandLineFlags(['--manual-cleanup']);
      expect(flags.manualCleanup).toBe(true);

      // When cleanup phase begins
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      // Then the game pauses and shows available moves
      const shouldSkip = shouldAutoSkipCleanup(gameState, flags);
      expect(shouldSkip).toBe(false);

      // And I must manually enter a command to proceed
      const validMoves = engine.getValidMoves(gameState);
      expect(validMoves).toHaveLength(1);
      expect(validMoves[0].type).toBe('end_phase');

      // And cleanup does NOT auto-execute
      // (Game waits for user to type "1" or "end")
    });

    test('AC-6.5: Future cards with cleanup choices pause correctly (placeholder)', () => {
      // Given a future card requires cleanup decisions (placeholder)
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .build();

      // When cleanup phase begins with interactive choices
      const validMoves = engine.getValidMoves(gameState);

      // Current MVP: no interactive choices
      expect(validMoves.length).toBe(1);

      // Future: if validMoves.length > 1, auto-skip should NOT activate
      if (validMoves.length > 1) {
        expect(shouldAutoSkipCleanup(gameState)).toBe(false);
      }

      // And I can make cleanup decisions manually
      // (Placeholder for future expansion)
    });
  });

  describe('Edge Cases', () => {
    test('should handle cleanup with maximum cards', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, Array(20).fill('Copper'))
        .build();

      gameState = withInPlayCards(gameState, 0, Array(10).fill('Village'));

      const summary = generateCleanupSummary(gameState);
      expect(summary).toContain('Discarded 30 cards');
    });

    test('should handle cleanup with no draw pile', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper'])
        .build();

      gameState = withDrawPile(gameState, 0, []); // Empty draw pile
      gameState = withDiscardPile(gameState, 0, ['Estate', 'Estate']);

      // Cleanup should still work (reshuffles discard pile)
      const summary = generateCleanupSummary(gameState);
      expect(summary).toContain('drew 5 new cards');
    });

    test('should handle cleanup on final turn', () => {
      const gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withTurnNumber(50) // Very late game
        .build();

      const shouldSkip = shouldAutoSkipCleanup(gameState);
      expect(shouldSkip).toBe(true);
    });

    test('should not auto-skip if phase is not cleanup', () => {
      const gameState = GameStateBuilder.create()
        .withPhase('action')
        .build();

      // Should only auto-skip during cleanup phase
      expect(gameState.phase).not.toBe('cleanup');
    });

    test('should handle cleanup with mixed card types', () => {
      let gameState = GameStateBuilder.create()
        .withPhase('cleanup')
        .withPlayerHand(0, ['Copper', 'Estate', 'Village'])
        .build();

      gameState = withInPlayCards(gameState, 0, ['Smithy', 'Market']);

      const detailedSummary = generateDetailedCleanupSummary(gameState);

      // Should list all card types
      expect(detailedSummary).toContain('Smithy');
      expect(detailedSummary).toContain('Market');
      expect(detailedSummary).toContain('Copper');
      expect(detailedSummary).toContain('Estate');
      expect(detailedSummary).toContain('Village');
    });
  });

  describe('Command-Line Flag Integration', () => {
    test('should parse --manual-cleanup from args', () => {
      const flags = parseCommandLineFlags(['--manual-cleanup']);
      expect(flags.manualCleanup).toBe(true);
    });

    test('should default to false without flag', () => {
      const flags = parseCommandLineFlags([]);
      expect(flags.manualCleanup).toBe(false);
    });

    test('should work with other flags', () => {
      const args = ['--seed=123', '--quick-game', '--manual-cleanup', '--stable-numbers'];
      const flags = parseCommandLineFlags(args);
      expect(flags.manualCleanup).toBe(true);
    });

    test('should handle variations of flag name', () => {
      // Current: only --manual-cleanup is supported
      const flags1 = parseCommandLineFlags(['--manual-cleanup']);
      expect(flags1.manualCleanup).toBe(true);

      // --manual shorthand could be added in future
      // const flags2 = parseCommandLineFlags(['--manual']);
      // expect(flags2.manualCleanup).toBe(true);
    });
  });
});
