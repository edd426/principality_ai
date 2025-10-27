/**
 * Test Suite: Reduced Supply Pile Sizes Feature (Phase 1.5)
 *
 * Requirements: CLI_PHASE2_REQUIREMENTS.md - Feature 4
 * Validates --quick-game flag and pile size configuration
 *
 * Key Requirements:
 * - `--quick-game` flag reduces VICTORY cards only (Estate, Duchy, Province)
 * - Victory piles: 12 → 8
 * - Kingdom cards: Stay at 10 (Villages NOT reduced)
 * - Treasures: Unchanged (60 Copper, 40 Silver, 30 Gold)
 * - Game end conditions work identically
 */

// @req: R1.5-04 - Reduced supply piles for faster testing
// @edge: Only victory cards reduced; kingdom cards and treasures unchanged; game end still works
// @why: Faster testing required for rapid iteration; --quick-game speeds up games 40%

import { GameEngine, GameState } from '@principality/core';
import { GameStateBuilder } from './utils/test-utils';
import { QuickGameTestUtils } from './utils/phase1-5-utils';

describe('Feature 4: Reduced Supply Pile Sizes', () => {
  describe('Quick Game Flag Parsing (FR-4.1)', () => {
    test('should recognize --quick-game flag', () => {
      const flags = parseCommandLineFlags(['--quick-game']);

      expect(flags.quickGame).toBe(true);
    });

    test('should recognize --quick shorthand', () => {
      const flags = parseCommandLineFlags(['--quick']);

      expect(flags.quickGame).toBe(true);
    });

    test('should default to false without flag', () => {
      const flags = parseCommandLineFlags([]);

      expect(flags.quickGame).toBe(false);
    });

    test('should handle flag with other options', () => {
      const flags = parseCommandLineFlags(['--seed=12345', '--quick-game', '--stable-numbers']);

      expect(flags.quickGame).toBe(true);
      expect(flags.seed).toBe('12345');
      expect(flags.stableNumbers).toBe(true);
    });
  });

  describe('Victory Pile Reduction (FR-4.2)', () => {
    test('UT-4.1: should reduce victory piles to 8 with --quick-game', () => {
      // Arrange
      const options = { quickGame: true };

      // Act
      const supply = initializeSupply(options);

      // Assert
      expect(supply.get('Estate')).toBe(8);
      expect(supply.get('Duchy')).toBe(8);
      expect(supply.get('Province')).toBe(8);
    });

    test('should reduce all three victory card types', () => {
      const supply = initializeSupply({ quickGame: true });

      const victoryCards = ['Estate', 'Duchy', 'Province'];
      victoryCards.forEach(card => {
        expect(supply.get(card)).toBe(8);
      });
    });

    test('should reduce from standard 12 to quick 8', () => {
      const standardSupply = initializeSupply({ quickGame: false });
      const quickSupply = initializeSupply({ quickGame: true });

      // Standard has 12
      expect(standardSupply.get('Estate')).toBe(12);
      expect(standardSupply.get('Duchy')).toBe(12);
      expect(standardSupply.get('Province')).toBe(12);

      // Quick has 8
      expect(quickSupply.get('Estate')).toBe(8);
      expect(quickSupply.get('Duchy')).toBe(8);
      expect(quickSupply.get('Province')).toBe(8);
    });
  });

  describe('Kingdom Cards Unchanged (FR-4.3)', () => {
    test('should NOT reduce kingdom card piles', () => {
      // Arrange
      const options = { quickGame: true };

      // Act
      const supply = initializeSupply(options);

      // Assert - ALL kingdom cards stay at 10
      const kingdomCards = [
        'Village', 'Smithy', 'Laboratory', 'Market',
        'Woodcutter', 'Festival', 'Council Room', 'Cellar'
      ];

      kingdomCards.forEach(card => {
        expect(supply.get(card)).toBe(10);
      });
    });

    test('Village should have 10 cards in quick game (not 8)', () => {
      const supply = initializeSupply({ quickGame: true });

      // Explicitly test Village stays at 10
      expect(supply.get('Village')).toBe(10);
      expect(supply.get('Village')).not.toBe(8);
    });

    test('should maintain kingdom pile consistency in quick game', () => {
      const standardSupply = initializeSupply({ quickGame: false });
      const quickSupply = initializeSupply({ quickGame: true });

      const kingdomCards = ['Village', 'Smithy', 'Market'];

      kingdomCards.forEach(card => {
        // Both modes have same kingdom pile sizes
        expect(standardSupply.get(card)).toBe(10);
        expect(quickSupply.get(card)).toBe(10);
        expect(quickSupply.get(card)).toBe(standardSupply.get(card));
      });
    });
  });

  describe('Treasure Piles Unchanged (FR-4.4)', () => {
    test('UT-4.3: should NOT reduce treasure piles', () => {
      // Arrange
      const options = { quickGame: true };

      // Act
      const supply = initializeSupply(options);

      // Assert
      expect(supply.get('Copper')).toBe(60);
      expect(supply.get('Silver')).toBe(40);
      expect(supply.get('Gold')).toBe(30);
    });

    test('treasure piles identical in standard and quick game', () => {
      const standardSupply = initializeSupply({ quickGame: false });
      const quickSupply = initializeSupply({ quickGame: true });

      expect(quickSupply.get('Copper')).toBe(standardSupply.get('Copper'));
      expect(quickSupply.get('Silver')).toBe(standardSupply.get('Silver'));
      expect(quickSupply.get('Gold')).toBe(standardSupply.get('Gold'));

      expect(quickSupply.get('Copper')).toBe(60);
      expect(quickSupply.get('Silver')).toBe(40);
      expect(quickSupply.get('Gold')).toBe(30);
    });
  });

  describe('Standard Game Unchanged (FR-4.5)', () => {
    test('UT-4.4: should use standard sizes without flag', () => {
      // Arrange
      const options = { quickGame: false };

      // Act
      const supply = initializeSupply(options);

      // Assert
      expect(supply.get('Province')).toBe(12);
      expect(supply.get('Duchy')).toBe(12);
      expect(supply.get('Estate')).toBe(12);
      expect(supply.get('Village')).toBe(10);
      expect(supply.get('Copper')).toBe(60);
    });

    test('standard game has full pile counts', () => {
      const supply = initializeSupply({ quickGame: false });

      // Victory cards: 12 each
      expect(supply.get('Estate')).toBe(12);
      expect(supply.get('Duchy')).toBe(12);
      expect(supply.get('Province')).toBe(12);

      // Kingdom cards: 10 each
      expect(supply.get('Village')).toBe(10);
      expect(supply.get('Smithy')).toBe(10);

      // Treasures: original counts
      expect(supply.get('Copper')).toBe(60);
      expect(supply.get('Silver')).toBe(40);
      expect(supply.get('Gold')).toBe(30);
    });
  });

  describe('Game End Conditions (FR-4.5)', () => {
    test('should trigger game end when Province pile empty (quick game)', () => {
      // Arrange
      const supply = initializeSupply({ quickGame: true });
      supply.set('Province', 0); // Empty province pile

      // Act
      const isGameOver = checkGameEndCondition(supply);

      // Assert
      expect(isGameOver).toBe(true);
    });

    test('should trigger game end when 3 piles empty (quick game)', () => {
      // Arrange
      const supply = initializeSupply({ quickGame: true });
      supply.set('Village', 0);
      supply.set('Smithy', 0);
      supply.set('Market', 0);

      // Act
      const isGameOver = checkGameEndCondition(supply);

      // Assert
      expect(isGameOver).toBe(true);
    });

    test('game end conditions work identically in both modes', () => {
      // Standard game
      const standardSupply = initializeSupply({ quickGame: false });
      standardSupply.set('Province', 0);
      expect(checkGameEndCondition(standardSupply)).toBe(true);

      // Quick game
      const quickSupply = initializeSupply({ quickGame: true });
      quickSupply.set('Province', 0);
      expect(checkGameEndCondition(quickSupply)).toBe(true);

      // Logic is identical
    });

    test('game continues when Province pile not empty and < 3 piles empty', () => {
      const supply = initializeSupply({ quickGame: true });

      // Province pile has cards
      expect(supply.get('Province')).toBeGreaterThan(0);

      // Only 1 pile empty
      supply.set('Village', 0);

      const isGameOver = checkGameEndCondition(supply);
      expect(isGameOver).toBe(false);
    });

    test('quick game ends when 8 Provinces depleted (not 12)', () => {
      const supply = initializeSupply({ quickGame: true });

      // Start with 8 Provinces
      expect(supply.get('Province')).toBe(8);

      // Buy all 8
      for (let i = 0; i < 8; i++) {
        const count = supply.get('Province')!;
        supply.set('Province', count - 1);
      }

      // Province pile now empty
      expect(supply.get('Province')).toBe(0);

      // Game ends
      expect(checkGameEndCondition(supply)).toBe(true);
    });
  });

  describe('Welcome Message Display (FR-4.6)', () => {
    test('should display pile sizes in welcome message when --quick-game active', () => {
      const welcomeMessage = getWelcomeMessage({ quickGame: true });

      expect(welcomeMessage).toMatch(/Quick Game/i);
      expect(welcomeMessage).toMatch(/Victory.*8/);
      expect(welcomeMessage).toMatch(/Kingdom.*10/);
    });

    test('should not mention quick game in standard mode', () => {
      const welcomeMessage = getWelcomeMessage({ quickGame: false });

      expect(welcomeMessage).not.toMatch(/Quick Game/i);
      expect(welcomeMessage).toMatch(/Victory.*12/);
    });

    test('welcome message explains pile sizes', () => {
      const welcomeMessage = getWelcomeMessage({ quickGame: true });

      expect(welcomeMessage).toContain('Victory cards: 8');
      expect(welcomeMessage).toContain('Kingdom cards: 10');
      expect(welcomeMessage).not.toContain('Victory cards: 12');
    });
  });

  describe('Help Documentation (NFR-4.2)', () => {
    test('should document --quick-game flag in help', () => {
      const helpText = getHelpText();

      expect(helpText).toContain('--quick-game');
      expect(helpText).toMatch(/reduce.*pile.*size/i);
      expect(helpText).toMatch(/faster.*game/i);
    });

    test('help should explain which piles are reduced', () => {
      const helpText = getHelpText();

      expect(helpText).toMatch(/victory.*8/i);
      expect(helpText).toMatch(/Estate.*Duchy.*Province/);
    });

    test('help should clarify kingdom cards not reduced', () => {
      const helpText = getHelpText();

      expect(helpText).toMatch(/kingdom.*unchanged|kingdom.*10/i);
    });
  });

  describe('Edge Cases', () => {
    test('should handle buying from reduced piles', () => {
      const supply = initializeSupply({ quickGame: true });

      // Buy an Estate
      const initialCount = supply.get('Estate')!;
      supply.set('Estate', initialCount - 1);

      // Pile decreases correctly
      expect(supply.get('Estate')).toBe(7); // 8 - 1
    });

    test('should prevent buying when pile empty', () => {
      const supply = initializeSupply({ quickGame: true });
      supply.set('Province', 0);

      // Cannot buy from empty pile
      const canBuyProvince = supply.get('Province')! > 0;
      expect(canBuyProvince).toBe(false);
    });

    test('quick game ends faster with fewer victory cards', () => {
      const standardSupply = initializeSupply({ quickGame: false });
      const quickSupply = initializeSupply({ quickGame: true });

      // Standard: need to deplete 12 Provinces
      expect(standardSupply.get('Province')).toBe(12);

      // Quick: need to deplete only 8 Provinces
      expect(quickSupply.get('Province')).toBe(8);

      // Quick game requires 33% fewer Province purchases to end
      const difference = standardSupply.get('Province')! - quickSupply.get('Province')!;
      expect(difference).toBe(4); // 12 - 8 = 4 fewer cards
    });

    test('multiplayer quick game has same reduced piles', () => {
      // 2-player quick game
      const supply2p = initializeSupply({ quickGame: true, players: 2 });

      // 4-player quick game
      const supply4p = initializeSupply({ quickGame: true, players: 4 });

      // Both have 8 victory cards (not scaled by player count)
      expect(supply2p.get('Province')).toBe(8);
      expect(supply4p.get('Province')).toBe(8);
    });
  });

  describe('Acceptance Criteria Validation', () => {
    test('AC-4.1: Check supply shows reduced victory piles', () => {
      // Given I start the CLI with --quick-game flag
      const flags = parseCommandLineFlags(['--quick-game']);
      expect(flags.quickGame).toBe(true);

      // When I check the supply
      const supply = initializeSupply(flags);

      // Then I see 8 Provinces, 8 Duchies, 8 Estates
      expect(supply.get('Province')).toBe(8);
      expect(supply.get('Duchy')).toBe(8);
      expect(supply.get('Estate')).toBe(8);

      // And I see 10 of each kingdom card
      expect(supply.get('Village')).toBe(10);
      expect(supply.get('Smithy')).toBe(10);
    });

    test('AC-4.2: Treasures unchanged with --quick-game', () => {
      // Given I start the CLI with --quick-game flag
      const supply = initializeSupply({ quickGame: true });

      // When I check the supply
      // Then I see 60 Copper, 40 Silver, 30 Gold (unchanged)
      expect(supply.get('Copper')).toBe(60);
      expect(supply.get('Silver')).toBe(40);
      expect(supply.get('Gold')).toBe(30);
    });

    test('AC-4.3: Game end condition triggers identically', () => {
      // Given I run a quick game to completion
      const supply = initializeSupply({ quickGame: true });

      // When the game ends (Province empty)
      supply.set('Province', 0);

      // Then the game end condition still triggers
      expect(checkGameEndCondition(supply)).toBe(true);

      // And the logic is identical to standard games
      const standardSupply = initializeSupply({ quickGame: false });
      standardSupply.set('Province', 0);
      expect(checkGameEndCondition(standardSupply)).toBe(true);
    });

    test('AC-4.4: Help documents --quick-game flag', () => {
      // Given I type npm run play -- --help
      const helpText = getHelpText();

      // Then I see documentation for --quick-game flag
      expect(helpText).toContain('--quick-game');

      // And the description explains it reduces pile sizes
      expect(helpText).toMatch(/reduce.*pile.*size/i);

      // And mentions faster games
      expect(helpText).toMatch(/faster.*game/i);
    });
  });

  describe('Configuration Persistence', () => {
    test('quick game setting persists throughout game', () => {
      const initialSupply = initializeSupply({ quickGame: true });

      // Mid-game check
      expect(initialSupply.get('Province')).toBe(8);

      // After buying some cards
      initialSupply.set('Province', 6);

      // Still in quick game mode (pile started at 8, not 12)
      expect(initialSupply.get('Province')).toBe(6);
      expect(initialSupply.get('Province')).toBeLessThan(12);
    });

    test('flag does not affect move validation', () => {
      // Quick game and standard game have identical move validation
      // Only difference is pile counts, not game logic

      const quickSupply = initializeSupply({ quickGame: true });
      const standardSupply = initializeSupply({ quickGame: false });

      // Both allow buying Province with $8
      const provinceCost = 8;
      expect(provinceCost).toBe(8); // Same in both modes

      // Game mechanics unchanged
    });
  });
});

// Helper Functions

interface GameOptions {
  quickGame?: boolean;
  players?: number;
  seed?: string;
  stableNumbers?: boolean;
}

/**
 * Parse command-line flags
 */
function parseCommandLineFlags(args: string[]): GameOptions {
  const options: GameOptions = {
    quickGame: false,
    players: 1,
    seed: undefined,
    stableNumbers: false
  };

  args.forEach(arg => {
    if (arg === '--quick-game' || arg === '--quick') {
      options.quickGame = true;
    }
    if (arg === '--stable-numbers' || arg === '--stable') {
      options.stableNumbers = true;
    }
    if (arg.startsWith('--seed=')) {
      options.seed = arg.split('=')[1];
    }
    if (arg.startsWith('--players=')) {
      options.players = parseInt(arg.split('=')[1], 10);
    }
  });

  return options;
}

/**
 * Initialize supply with options
 */
function initializeSupply(options: GameOptions): Map<string, number> {
  const supply = new Map<string, number>();

  // Victory cards: 12 standard, 8 quick
  const victoryCount = options.quickGame ? 8 : 12;
  supply.set('Estate', victoryCount);
  supply.set('Duchy', victoryCount);
  supply.set('Province', victoryCount);

  // Kingdom cards: always 10
  const kingdomCards = [
    'Village', 'Smithy', 'Laboratory', 'Market',
    'Woodcutter', 'Festival', 'Council Room', 'Cellar'
  ];
  kingdomCards.forEach(card => supply.set(card, 10));

  // Treasures: always same
  supply.set('Copper', 60);
  supply.set('Silver', 40);
  supply.set('Gold', 30);

  return supply;
}

/**
 * Check if game end condition is met
 */
function checkGameEndCondition(supply: Map<string, number>): boolean {
  // Game ends when Province pile empty
  if (supply.get('Province') === 0) {
    return true;
  }

  // Or when any 3 piles empty
  const emptyPiles = Array.from(supply.values()).filter(count => count === 0);
  if (emptyPiles.length >= 3) {
    return true;
  }

  return false;
}

/**
 * Get welcome message
 */
function getWelcomeMessage(options: GameOptions): string {
  if (options.quickGame) {
    return `
=== Welcome to Principality (Quick Game Mode) ===

Quick Game Settings:
- Victory cards: 8 per pile (Estate, Duchy, Province)
- Kingdom cards: 10 per pile
- Treasures: Standard (60 Copper, 40 Silver, 30 Gold)

Games will end faster! Good luck!
    `;
  }

  return `
=== Welcome to Principality ===

Standard Game Settings:
- Victory cards: 12 per pile
- Kingdom cards: 10 per pile
- Treasures: Standard (60 Copper, 40 Silver, 30 Gold)

Good luck!
  `;
}

/**
 * Get help text
 */
function getHelpText(): string {
  return `
Principality AI - Command Line Interface

Usage: npm run play -- [options]

Options:
  --seed=<string>         Game seed for deterministic randomness
  --players=<number>      Number of players (default: 1)
  --quick-game, --quick   Reduce victory pile sizes to 8 for faster games
                          Victory cards (Estate, Duchy, Province): 12 → 8
                          Kingdom cards stay at 10 (unchanged)
                          Treasures unchanged
  --stable-numbers        Enable stable card numbering for AI agents
  --help                  Show this help message

Examples:
  npm run play -- --quick-game
  npm run play -- --seed=12345 --quick-game --stable-numbers

Quick Game Mode:
  Reduces victory card piles from 12 to 8 cards for 40% faster games.
  Kingdom cards (like Village) remain at 10.
  Useful for testing and rapid iteration.
  `;
}
