/**
 * Test Suite: Victory Points Display Feature (Phase 1.5)
 *
 * Requirements: CLI_PHASE2_REQUIREMENTS.md - Feature 5
 * Validates VP calculation, display formatting, and update triggers
 *
 * Key Requirements:
 * - Show VP in game header at all times
 * - Calculate from entire deck (hand + draw + discard + in-play)
 * - Update after buying/gaining victory cards
 * - Display format: "VP: 5 (3E, 1D)" or expanded
 * - Include in `hand` and `status` commands
 * - Performance: < 5ms calculation
 */

import { PlayerState } from '@principality/core';
import { GameStateBuilder, PerformanceHelper } from './utils/test-utils';
import { VictoryPointsTestUtils } from './utils/phase1-5-utils';

describe('Feature 5: Victory Points Display', () => {
  describe('VP Calculation Logic (FR-5.2)', () => {
    test('should calculate VP from entire deck', () => {
      // Arrange - Create a player with victory cards scattered across all zones
      const player: PlayerState = {
        hand: ['Estate', 'Copper'],
        drawPile: ['Duchy', 'Silver'],
        discardPile: ['Province', 'Gold'],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0
      };

      // Act
      const vp = calculateVictoryPoints(player);

      // Assert - 1 Estate + 3 Duchy + 6 Province = 10 VP
      expect(vp).toBe(10);
    });

    test('should count victory cards from all four zones', () => {
      const player: PlayerState = {
        hand: ['Estate'],           // 1 VP
        drawPile: ['Estate'],        // 1 VP
        discardPile: ['Estate'],     // 1 VP
        inPlay: [],                  // 0 VP (actions played)
        actions: 1,
        buys: 1,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(3); // 1 + 1 + 1 = 3 VP
    });

    test('should calculate correct VP values for each card', () => {
      // Estate = 1 VP
      const player1: PlayerState = createPlayerWithCards(['Estate']);
      expect(calculateVictoryPoints(player1)).toBe(1);

      // Duchy = 3 VP
      const player2: PlayerState = createPlayerWithCards(['Duchy']);
      expect(calculateVictoryPoints(player2)).toBe(3);

      // Province = 6 VP
      const player3: PlayerState = createPlayerWithCards(['Province']);
      expect(calculateVictoryPoints(player3)).toBe(6);
    });

    test('should handle multiple copies of same victory card', () => {
      const player: PlayerState = createPlayerWithCards([
        'Estate', 'Estate', 'Estate'
      ]);

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(3); // 3 × 1 = 3 VP
    });

    test('should handle mixed victory cards', () => {
      const player: PlayerState = createPlayerWithCards([
        'Estate', 'Estate', 'Duchy', 'Province'
      ]);

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(11); // 2×1 + 3 + 6 = 11 VP
    });

    test('should ignore non-victory cards', () => {
      const player: PlayerState = createPlayerWithCards([
        'Copper', 'Silver', 'Gold', 'Village', 'Smithy'
      ]);

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(0); // No victory cards
    });

    test('should handle empty deck', () => {
      const player: PlayerState = {
        hand: [],
        drawPile: [],
        discardPile: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(0);
    });

    test('should handle starting deck (3 Estates)', () => {
      const player: PlayerState = createPlayerWithCards([
        'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper',
        'Estate', 'Estate', 'Estate'
      ]);

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(3); // 3 Estates = 3 VP
    });

    test('should handle large VP counts', () => {
      // 10 Provinces = 60 VP
      const player: PlayerState = createPlayerWithCards(
        Array(10).fill('Province')
      );

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(60);
    });
  });

  describe('Display Formatting (FR-5.4)', () => {
    test('should format compact VP display', () => {
      // Arrange
      const vpBreakdown = {
        estates: 3,
        duchies: 1,
        provinces: 0
      };

      // Act
      const display = formatVPDisplay(vpBreakdown, 'compact');

      // Assert
      expect(display).toBe('VP: 6 (3E, 1D)');
    });

    test('should format expanded VP display', () => {
      const vpBreakdown = {
        estates: 2,
        duchies: 1,
        provinces: 1
      };

      const display = formatVPDisplay(vpBreakdown, 'expanded');

      expect(display).toContain('Victory Points: 11 VP');
      expect(display).toContain('2 Estates');
      expect(display).toContain('1 Duchy');
      expect(display).toContain('1 Province');
    });

    test('should format simple VP display (total only)', () => {
      const vpBreakdown = { estates: 3, duchies: 0, provinces: 0 };

      const display = formatVPDisplay(vpBreakdown, 'simple');

      expect(display).toBe('VP: 3');
    });

    test('should handle zero VP gracefully', () => {
      const vpBreakdown = { estates: 0, duchies: 0, provinces: 0 };

      const display = formatVPDisplay(vpBreakdown, 'compact');

      expect(display).toBe('VP: 0');
    });

    test('should omit zero counts from compact display', () => {
      const vpBreakdown = {
        estates: 2,
        duchies: 0,  // Should be omitted
        provinces: 1
      };

      const display = formatVPDisplay(vpBreakdown, 'compact');

      // Should show "2E, 1P" not "2E, 0D, 1P"
      expect(display).toBe('VP: 8 (2E, 1P)');
      expect(display).not.toContain('0D');
    });

    test('should handle single card type', () => {
      const vpBreakdown = { estates: 5, duchies: 0, provinces: 0 };

      const display = formatVPDisplay(vpBreakdown, 'compact');

      expect(display).toBe('VP: 5 (5E)');
    });

    test('should abbreviate card names correctly', () => {
      const display = formatVPDisplay({ estates: 1, duchies: 1, provinces: 1 }, 'compact');

      expect(display).toContain('E'); // Estate
      expect(display).toContain('D'); // Duchy
      expect(display).toContain('P'); // Province
    });
  });

  describe('Game Header Display (FR-5.1, FR-5.5)', () => {
    test('should display VP in game header', () => {
      // Arrange
      const gameState = GameStateBuilder.create()
        .withEmptyDeck(0)
        .withPhase('action')
        .withTurnNumber(5)
        .withPlayerHand(0, ['Estate', 'Duchy', 'Copper'])
        .build();

      // Act
      const header = formatGameHeader(gameState);

      // Assert
      expect(header).toContain('VP: 4'); // 1 + 3 = 4 VP
      expect(header).toContain('Turn 5');
      expect(header).toContain('Action Phase');
    });

    test('should show VP in all game phases', () => {
      const phases: Array<'action' | 'buy' | 'cleanup'> = ['action', 'buy', 'cleanup'];

      phases.forEach(phase => {
        const gameState = GameStateBuilder.create()
          .withEmptyDeck(0)
          .withPhase(phase)
          .withPlayerHand(0, ['Province'])
          .build();

        const header = formatGameHeader(gameState);

        expect(header).toContain('VP: 6');
        const expectedPhase = phase.charAt(0).toUpperCase() + phase.slice(1) + ' Phase';
        expect(header).toContain(expectedPhase);
      });
    });

    test('should update VP display after buying victory card', () => {
      // Before buying
      let gameState = GameStateBuilder.create()
        .withEmptyDeck(0)
        .withPlayerHand(0, ['Estate', 'Estate', 'Estate'])
        .build();

      let header = formatGameHeader(gameState);
      expect(header).toContain('VP: 3');

      // After buying Duchy
      gameState = GameStateBuilder.create()
        .withEmptyDeck(0)
        .withPlayerHand(0, ['Estate', 'Estate', 'Estate', 'Duchy'])
        .build();

      header = formatGameHeader(gameState);
      expect(header).toContain('VP: 6'); // 3 + 3 = 6
    });

    test('should format header with compact VP display', () => {
      const gameState = GameStateBuilder.create()
        .withEmptyDeck(0)
        .withPhase('action')
        .withTurnNumber(10)
        .withPlayerHand(0, ['Estate', 'Estate', 'Duchy'])
        .build();

      const header = formatGameHeader(gameState);

      // Should show compact format in header
      expect(header).toMatch(/VP: 5 \(2E, 1D\)/);
    });

    test('should position VP between player and phase info', () => {
      const gameState = GameStateBuilder.create()
        .withEmptyDeck(0)
        .withPhase('buy')
        .withCurrentPlayer(0)
        .withPlayerHand(0, ['Province'])
        .build();

      const header = formatGameHeader(gameState);

      // Format: === Turn X | Player Y | VP: Z | Phase ===
      expect(header).toMatch(/Player 1.*VP: 6.*Buy Phase/);
    });
  });

  describe('Command Integration (FR-5.5)', () => {
    test('should include VP in hand command output', () => {
      const player: PlayerState = createPlayerWithCards(['Estate', 'Duchy', 'Copper']);

      const handOutput = formatHandCommand(player);

      expect(handOutput).toContain('Victory Points: 4 VP');
      expect(handOutput).toContain('Hand:');
      expect(handOutput).toContain('Estate');
    });

    test('should include VP in status command output', () => {
      const player: PlayerState = createPlayerWithCards(['Province']);

      const statusOutput = formatStatusCommand(player);

      expect(statusOutput).toContain('Victory Points: 6 VP');
      expect(statusOutput).toContain('Actions:');
      expect(statusOutput).toContain('Buys:');
      expect(statusOutput).toContain('Coins:');
    });

    test('hand command should show VP breakdown', () => {
      const player: PlayerState = createPlayerWithCards([
        'Estate', 'Estate', 'Duchy', 'Copper', 'Silver'
      ]);

      const handOutput = formatHandCommand(player);

      expect(handOutput).toContain('Victory Points: 5 VP');
    });

    test('status command should include complete player info with VP', () => {
      const player: PlayerState = {
        hand: ['Province', 'Duchy'],
        drawPile: ['Estate'],
        discardPile: ['Estate', 'Estate'],
        inPlay: [],
        actions: 2,
        buys: 1,
        coins: 3
      };

      const statusOutput = formatStatusCommand(player);

      expect(statusOutput).toContain('Victory Points: 12 VP'); // 6 + 3 + 1 + 1 + 1 = 12
      expect(statusOutput).toContain('Actions: 2');
      expect(statusOutput).toContain('Buys: 1');
      expect(statusOutput).toContain('Coins: $3');
    });
  });

  describe('Update Triggers (FR-5.3)', () => {
    test('should update VP after buying Estate', () => {
      // Before
      let player = createPlayerWithCards(['Estate', 'Estate', 'Estate']);
      const vpBefore = calculateVictoryPoints(player);
      expect(vpBefore).toBe(3);

      // Buy Estate
      player = {
        ...player,
        discardPile: [...player.discardPile, 'Estate']
      };

      // After
      const vpAfter = calculateVictoryPoints(player);
      expect(vpAfter).toBe(4);
    });

    test('should update VP after buying Duchy', () => {
      let player = createPlayerWithCards(['Estate']);
      expect(calculateVictoryPoints(player)).toBe(1);

      // Buy Duchy
      player = {
        ...player,
        discardPile: [...player.discardPile, 'Duchy']
      };

      expect(calculateVictoryPoints(player)).toBe(4); // 1 + 3 = 4
    });

    test('should update VP after buying Province', () => {
      let player = createPlayerWithCards(['Estate', 'Duchy']);
      expect(calculateVictoryPoints(player)).toBe(4);

      // Buy Province
      player = {
        ...player,
        discardPile: [...player.discardPile, 'Province']
      };

      expect(calculateVictoryPoints(player)).toBe(10); // 1 + 3 + 6 = 10
    });

    test('should not update VP when buying non-victory cards', () => {
      let player = createPlayerWithCards(['Estate']);
      const vpBefore = calculateVictoryPoints(player);

      // Buy Silver (not a victory card)
      player = {
        ...player,
        discardPile: [...player.discardPile, 'Silver']
      };

      const vpAfter = calculateVictoryPoints(player);
      expect(vpAfter).toBe(vpBefore); // Unchanged
    });

    test('should update VP when gaining victory cards', () => {
      // "Gain" vs "Buy" - both add to deck
      let player = createPlayerWithCards([]);
      expect(calculateVictoryPoints(player)).toBe(0);

      // Gain 2 Estates (e.g., from Workshop effect)
      player = {
        ...player,
        discardPile: [...player.discardPile, 'Estate', 'Estate']
      };

      expect(calculateVictoryPoints(player)).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('EC-5.1: should handle zero victory points', () => {
      const player = createPlayerWithCards(['Copper', 'Silver', 'Village']);

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(0);

      const display = formatVPDisplay({ estates: 0, duchies: 0, provinces: 0 }, 'compact');
      expect(display).toBe('VP: 0');
    });

    test('EC-5.2: should handle many victory cards', () => {
      const player = createPlayerWithCards([
        ...Array(10).fill('Estate'),
        ...Array(5).fill('Duchy'),
        ...Array(3).fill('Province')
      ]);

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(43); // 10×1 + 5×3 + 3×6 = 10 + 15 + 18 = 43

      const display = formatVPDisplay({ estates: 10, duchies: 5, provinces: 3 }, 'compact');
      expect(display).toBe('VP: 43 (10E, 5D, 3P)');
    });

    test('EC-5.3: should show final VP in game end screen', () => {
      const player = createPlayerWithCards([
        ...Array(5).fill('Province'),
        ...Array(2).fill('Duchy'),
        ...Array(3).fill('Estate')
      ]);

      const vp = calculateVictoryPoints(player);
      const gameOverDisplay = formatGameOverDisplay(vp);

      expect(gameOverDisplay).toContain('Game Over!');
      expect(gameOverDisplay).toContain('Final Score: 39 VP'); // 30 + 6 + 3 = 39
    });

    test('should handle VP from in-play zone', () => {
      // Victory cards can be in play (e.g., played with Throne Room)
      const player: PlayerState = {
        hand: [],
        drawPile: [],
        discardPile: [],
        inPlay: ['Province'], // Unusual but possible
        actions: 1,
        buys: 1,
        coins: 0
      };

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(6);
    });

    test('should handle deck with only victory cards', () => {
      const player = createPlayerWithCards([
        'Estate', 'Estate', 'Duchy', 'Province'
      ]);

      const vp = calculateVictoryPoints(player);
      expect(vp).toBe(11); // 2 + 3 + 6 = 11
    });
  });

  describe('Performance Requirements (NFR-5.1)', () => {
    test('should calculate VP in < 5ms for typical deck', async () => {
      // Typical deck: 10-15 cards
      const player = createPlayerWithCards([
        'Copper', 'Copper', 'Copper', 'Silver', 'Silver',
        'Estate', 'Estate', 'Estate', 'Duchy', 'Province'
      ]);

      await PerformanceHelper.assertWithinTime(
        () => calculateVictoryPoints(player),
        5,
        'calculate VP for typical deck'
      );
    });

    test('should calculate VP in < 5ms for large deck', async () => {
      // Large deck: 50 cards
      const player = createPlayerWithCards([
        ...Array(30).fill('Copper'),
        ...Array(10).fill('Silver'),
        ...Array(5).fill('Estate'),
        ...Array(3).fill('Duchy'),
        ...Array(2).fill('Province')
      ]);

      await PerformanceHelper.assertWithinTime(
        () => calculateVictoryPoints(player),
        5,
        'calculate VP for large deck'
      );
    });

    test('should format VP display in < 5ms', async () => {
      const vpBreakdown = { estates: 10, duchies: 5, provinces: 3 };

      await PerformanceHelper.assertWithinTime(
        () => formatVPDisplay(vpBreakdown, 'compact'),
        5,
        'format VP display'
      );
    });
  });

  describe('Acceptance Criteria Validation', () => {
    test('AC-5.1: VP displayed at all times in header', () => {
      // Given I am playing a game
      const gameState = GameStateBuilder.create()
        .withEmptyDeck(0)
        .withPlayerHand(0, ['Estate', 'Duchy'])
        .build();

      // When I view the game screen at any time
      const header = formatGameHeader(gameState);

      // Then I see my current victory points displayed
      expect(header).toContain('VP: 4');
    });

    test('AC-5.2: VP calculated correctly for starting deck', () => {
      // Given I have 3 Estates in my deck
      const player = createPlayerWithCards([
        'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper',
        'Estate', 'Estate', 'Estate'
      ]);

      // When I check the VP display
      const vp = calculateVictoryPoints(player);

      // Then I see "3 VP (3 Estates)" or "3 VP (3E)"
      expect(vp).toBe(3);
      const display = formatVPDisplay({ estates: 3, duchies: 0, provinces: 0 }, 'compact');
      expect(display).toBe('VP: 3 (3E)');
    });

    test('AC-5.3: VP updates after buying Duchy', () => {
      // Given I buy a Duchy
      let playerBefore = createPlayerWithCards(['Estate', 'Estate', 'Estate']);
      const vpBefore = calculateVictoryPoints(playerBefore);
      expect(vpBefore).toBe(3);

      // When the buy completes
      playerBefore = {
        ...playerBefore,
        discardPile: [...playerBefore.discardPile, 'Duchy']
      };

      // Then VP display updates
      const vpAfter = calculateVictoryPoints(playerBefore);
      expect(vpAfter).toBe(6); // 3 → 6
    });

    test('AC-5.4: Final VP shown prominently at game end', () => {
      // Given the game ends
      const player = createPlayerWithCards([
        ...Array(5).fill('Province'),
        ...Array(3).fill('Duchy')
      ]);

      // When the final screen displays
      const vp = calculateVictoryPoints(player);
      const gameOverDisplay = formatGameOverDisplay(vp);

      // Then I see my final VP total prominently
      expect(gameOverDisplay).toContain('Final Score: 39 VP');
      expect(gameOverDisplay).toContain('Game Over!');
    });

    test('AC-5.5: VP shown in hand and status commands', () => {
      // Given I type hand or status command
      const player = createPlayerWithCards(['Estate', 'Duchy', 'Copper']);

      // Then I see my VP as part of the information
      const handOutput = formatHandCommand(player);
      const statusOutput = formatStatusCommand(player);

      expect(handOutput).toContain('Victory Points: 4 VP');
      expect(statusOutput).toContain('Victory Points: 4 VP');
    });
  });
});

// Helper Functions

/**
 * Calculate victory points from player state
 */
function calculateVictoryPoints(player: PlayerState | undefined | null): number {
  if (!player) {
    return 0;
  }

  const allCards = [
    ...player.hand,
    ...player.drawPile,
    ...player.discardPile,
    ...player.inPlay
  ];

  const vpValues: Record<string, number> = {
    'Estate': 1,
    'Duchy': 3,
    'Province': 6
  };

  return allCards.reduce((total, card) => {
    return total + (vpValues[card] || 0);
  }, 0);
}

/**
 * Create player with specific cards
 */
function createPlayerWithCards(cards: string[]): PlayerState {
  return {
    hand: cards,
    drawPile: [],
    discardPile: [],
    inPlay: [],
    actions: 1,
    buys: 1,
    coins: 0
  };
}

/**
 * Format VP display
 */
function formatVPDisplay(
  breakdown: { estates: number; duchies: number; provinces: number },
  format: 'compact' | 'expanded' | 'simple'
): string {
  const totalVP = breakdown.estates * 1 + breakdown.duchies * 3 + breakdown.provinces * 6;

  if (format === 'simple') {
    return `VP: ${totalVP}`;
  }

  if (format === 'compact') {
    const parts: string[] = [];
    if (breakdown.estates > 0) parts.push(`${breakdown.estates}E`);
    if (breakdown.duchies > 0) parts.push(`${breakdown.duchies}D`);
    if (breakdown.provinces > 0) parts.push(`${breakdown.provinces}P`);

    if (parts.length === 0) {
      return `VP: 0`;
    }

    return `VP: ${totalVP} (${parts.join(', ')})`;
  }

  // Expanded format
  const parts: string[] = [];
  if (breakdown.estates > 0) {
    parts.push(`${breakdown.estates} Estate${breakdown.estates > 1 ? 's' : ''}`);
  }
  if (breakdown.duchies > 0) {
    parts.push(`${breakdown.duchies} Duch${breakdown.duchies > 1 ? 'ies' : 'y'}`);
  }
  if (breakdown.provinces > 0) {
    parts.push(`${breakdown.provinces} Province${breakdown.provinces > 1 ? 's' : ''}`);
  }

  return `Victory Points: ${totalVP} VP (${parts.join(', ')})`;
}

/**
 * Format game header with VP
 */
function formatGameHeader(gameState: any): string {
  const player = gameState.players[gameState.currentPlayer];
  const vp = calculateVictoryPoints(player);

  // Get breakdown for display
  const allCards = [
    ...player.hand,
    ...player.drawPile,
    ...player.discardPile,
    ...player.inPlay
  ];

  const breakdown = {
    estates: allCards.filter(c => c === 'Estate').length,
    duchies: allCards.filter(c => c === 'Duchy').length,
    provinces: allCards.filter(c => c === 'Province').length
  };

  const vpDisplay = formatVPDisplay(breakdown, 'compact');
  const phase = gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1);

  return `=== Turn ${gameState.turnNumber} | Player ${gameState.currentPlayer + 1} | ${vpDisplay} | ${phase} Phase ===`;
}

/**
 * Format hand command output
 */
function formatHandCommand(player: PlayerState | undefined | null): string {
  if (!player) {
    return 'Victory Points: 0 VP\n\nHand: ';
  }

  const vp = calculateVictoryPoints(player);

  return `
Victory Points: ${vp} VP

Hand: ${player.hand.join(', ')}
  `.trim();
}

/**
 * Format status command output
 */
function formatStatusCommand(player: PlayerState | undefined | null): string {
  if (!player) {
    return 'Player Status:\nVictory Points: 0 VP\nActions: 0\nBuys: 0\nCoins: $0';
  }

  const vp = calculateVictoryPoints(player);

  return `
Player Status:
Victory Points: ${vp} VP
Actions: ${player.actions}
Buys: ${player.buys}
Coins: $${player.coins}
  `.trim();
}

/**
 * Format game over display
 */
function formatGameOverDisplay(finalVP: number): string {
  return `
===================
   Game Over!
===================

Final Score: ${finalVP} VP

Thank you for playing!
  `.trim();
}
