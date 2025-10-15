/**
 * Testing utilities specifically for Phase 1.5 CLI features
 * Provides test frameworks for the 5 approved UX improvements
 */

import { Move } from '@principality/core';
import { GameStateBuilder, MockMoveGenerator } from './test-utils';

/**
 * Utilities for testing Auto-Play Treasures feature
 */
export class AutoPlayTreasuresTestUtils {
  /**
   * Generate treasure-heavy hand for testing
   */
  static createTreasureHand(): string[] {
    return ['Copper', 'Copper', 'Silver', 'Gold', 'Estate'];
  }

  /**
   * Create game state with treasures in hand
   */
  static createTreasureState() {
    return GameStateBuilder.create()
      .withPhase('action')
      .withPlayerHand(0, this.createTreasureHand())
      .withPlayerStats(0, { actions: 0, buys: 1, coins: 0 })
      .build();
  }

  /**
   * Valid treasure commands for testing
   */
  static getTreasureCommands(): string[] {
    return ['treasures', 't', 'play all', 'all'];
  }

  /**
   * Expected treasure play result
   */
  static getExpectedTreasureResult() {
    return {
      totalCoins: 4, // 1+1+2 from Copper+Copper+Silver
      summary: 'Played all treasures: Copper (+$1), Copper (+$1), Silver (+$2), Gold (+$3). Total: $7'
    };
  }
}

/**
 * Utilities for testing Stable Card Numbers feature
 */
export class StableNumbersTestUtils {
  /**
   * Stable number mappings as per requirements
   */
  static getStableNumberMapping(): Record<string, number> {
    return {
      'Village': 7,
      'Smithy': 6,
      'Laboratory': 5,
      'Market': 4,
      'Workshop': 3,
      'Militia': 2,
      'Remodel': 1,
      'Cellar': 8
    };
  }

  /**
   * Create moves with kingdom cards for stable number testing
   */
  static createKingdomMoves(): Move[] {
    return [
      { type: 'play_action', card: 'Village' },
      { type: 'play_action', card: 'Smithy' },
      { type: 'play_action', card: 'Laboratory' },
      { type: 'play_action', card: 'Market' },
      { type: 'end_phase' }
    ];
  }

  /**
   * Expected stable numbering output
   */
  static getExpectedStableDisplay(): string[] {
    return [
      '[7] Play Village',
      '[6] Play Smithy',
      '[5] Play Laboratory',
      '[4] Play Market',
      '[1] End Phase' // End phase gets sequential number
    ];
  }

  /**
   * Command line flags for testing
   */
  static getStableNumbersFlags(): string[] {
    return ['--stable-numbers', '--stable'];
  }
}

/**
 * Utilities for testing Multi-Card Chained Submission feature
 */
export class ChainedSubmissionTestUtils {
  /**
   * Valid chain input formats
   */
  static getValidChainFormats(): string[] {
    return [
      '1, 2, 3',      // Comma separated with spaces
      '1,2,3',        // Comma separated without spaces
      '1 2 3',        // Space separated
      '7, 6, 5, 1'    // Mixed stable/sequential numbers
    ];
  }

  /**
   * Invalid chain inputs for error testing (syntactically invalid only)
   * Note: Semantically invalid chains like '1, 2, 99' (where 99 > available moves)
   * are tested separately since they're syntactically valid but fail at execution
   */
  static getInvalidChainFormats(): string[] {
    return [
      '1, abc, 3',    // Non-numeric input in chain (syntactically invalid)
      '',             // Empty chain (syntactically invalid)
      '1.5, 2',       // Decimal numbers (syntactically invalid)
      '-1, 2'         // Negative numbers (syntactically invalid)
    ];
  }

  /**
   * Create game state suitable for move chaining
   */
  static createChainableState() {
    return GameStateBuilder.create()
      .withPhase('action')
      .withPlayerHand(0, ['Village', 'Smithy', 'Laboratory', 'Market', 'Silver'])
      .withPlayerStats(0, { actions: 3, buys: 1, coins: 0 })
      .build();
  }

  /**
   * Expected chain execution results
   */
  static getExpectedChainResult() {
    return {
      movesExecuted: 3,
      rollbackOnError: true,
      errorMessage: 'Chain failed at move 3: Invalid move. Rolling back all changes.'
    };
  }
}

/**
 * Utilities for testing Reduced Supply Piles feature
 */
export class QuickGameTestUtils {
  /**
   * Command line flags for quick game
   */
  static getQuickGameFlags(): string[] {
    return ['--quick-game', '--quick'];
  }

  /**
   * Expected pile sizes in quick game mode
   */
  static getQuickGamePileSizes(): Record<string, number> {
    return {
      'Estate': 8,     // Reduced from 12
      'Duchy': 8,      // Reduced from 12
      'Province': 8,   // Reduced from 12
      'Village': 10,   // Kingdom cards unchanged
      'Smithy': 10,    // Kingdom cards unchanged
      'Copper': 60,    // Treasures unchanged
      'Silver': 40,    // Treasures unchanged
      'Gold': 30       // Treasures unchanged
    };
  }

  /**
   * Expected vs normal pile sizes for comparison
   */
  static getNormalPileSizes(): Record<string, number> {
    return {
      'Estate': 12,
      'Duchy': 12,
      'Province': 12,
      'Village': 10,
      'Smithy': 10,
      'Copper': 60,
      'Silver': 40,
      'Gold': 30
    };
  }

  /**
   * Create quick game state for testing
   */
  static createQuickGameState() {
    return GameStateBuilder.create()
      .withSupply(this.getQuickGamePileSizes())
      .build();
  }
}

/**
 * Utilities for testing Victory Points Display feature
 */
export class VictoryPointsTestUtils {
  /**
   * Create game state with known victory point totals
   */
  static createVPTestState() {
    return GameStateBuilder.create()
      .withPlayerHand(0, ['Estate', 'Duchy', 'Province', 'Copper', 'Silver'])
      .withPlayerStats(0, { actions: 1, buys: 1, coins: 0 })
      .build();
  }

  /**
   * Calculate expected VP from a player's complete deck
   */
  static calculateVictoryPoints(allCards: string[]): number {
    const vpValues: Record<string, number> = {
      'Estate': 1,
      'Duchy': 3,
      'Province': 6,
      'Gardens': 0 // Special calculation needed for Gardens
    };

    return allCards.reduce((total, card) => {
      return total + (vpValues[card] || 0);
    }, 0);
  }

  /**
   * Expected VP display formats
   */
  static getExpectedVPDisplays(): string[] {
    return [
      'VP: 5 (3E, 1D)',           // Compact format
      'VP: 10 (3 Estate, 1 Duchy, 1 Province)', // Expanded format
      'Victory Points: 5',         // Simple format
      'VP: 0 (no victory cards)'  // Empty VP format
    ];
  }

  /**
   * Test deck compositions with known VP values
   */
  static getTestDeckCompositions(): Array<{ cards: string[]; expectedVP: number; description: string }> {
    return [
      {
        cards: ['Estate', 'Estate', 'Estate'],
        expectedVP: 3,
        description: '3 Estates'
      },
      {
        cards: ['Estate', 'Duchy', 'Province'],
        expectedVP: 10,
        description: '1 of each victory card'
      },
      {
        cards: ['Copper', 'Silver', 'Gold'],
        expectedVP: 0,
        description: 'No victory cards'
      },
      {
        cards: ['Province', 'Province', 'Duchy', 'Estate', 'Estate'],
        expectedVP: 17,
        description: 'High VP hand'
      }
    ];
  }

  /**
   * Expected VP display locations
   */
  static getExpectedVPDisplayLocations(): string[] {
    return [
      'game header',    // Main display location
      'hand command',   // When showing hand
      'status command', // When showing status
      'after buying victory cards' // Auto-update trigger
    ];
  }
}

/**
 * Integration testing utilities for Phase 1.5 feature combinations
 */
export class FeatureIntegrationTestUtils {
  /**
   * Test stable numbers + chained submission together
   */
  static createStableChainScenario() {
    return {
      state: GameStateBuilder.create()
        .withPlayerHand(0, ['Village', 'Smithy', 'Laboratory', 'Silver', 'Estate'])
        .withPlayerStats(0, { actions: 3, buys: 1, coins: 0 })
        .build(),
      chainInput: '7, 6, 5', // Stable numbers for Village, Smithy, Laboratory
      flags: ['--stable-numbers']
    };
  }

  /**
   * Test quick game + VP display together
   */
  static createQuickGameVPScenario() {
    return {
      state: GameStateBuilder.create()
        .withSupply(QuickGameTestUtils.getQuickGamePileSizes())
        .withPlayerHand(0, ['Estate', 'Duchy', 'Copper', 'Silver', 'Gold'])
        .build(),
      expectedVP: 4, // 1 Estate + 1 Duchy
      flags: ['--quick-game']
    };
  }

  /**
   * Test all features together in a complex scenario
   */
  static createFullIntegrationScenario() {
    return {
      state: GameStateBuilder.create()
        .withSupply(QuickGameTestUtils.getQuickGamePileSizes())
        .withPlayerHand(0, ['Village', 'Copper', 'Copper', 'Silver', 'Estate'])
        .withPlayerStats(0, { actions: 1, buys: 1, coins: 0 })
        .build(),
      commands: ['7', 'treasures', '1'], // Stable number Village, auto-play treasures, buy something
      expectedVP: 1, // 1 Estate
      flags: ['--stable-numbers', '--quick-game']
    };
  }
}

/**
 * Performance benchmarks for Phase 1.5 features
 */
export class Phase15PerformanceUtils {
  /**
   * Performance targets for CLI operations (per requirements)
   */
  static getPerformanceTargets(): Record<string, number> {
    return {
      'parseChainedInput': 10,     // < 10ms for parsing chain input
      'autoPlayTreasures': 20,     // < 20ms for treasure auto-play
      'displayWithStableNumbers': 15, // < 15ms for stable number display
      'calculateVP': 5,            // < 5ms for VP calculation
      'quickGameSetup': 30         // < 30ms for quick game initialization
    };
  }

  /**
   * Create performance test scenarios
   */
  static createPerformanceScenarios() {
    return {
      largeChain: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10', // Test large chain parsing
      manyTreasures: Array(20).fill('Copper'), // Test many treasures
      complexVP: Array(50).fill('Estate').concat(Array(30).fill('Province')), // Large deck VP calculation
      largeMoveList: Array(50).fill(0).map((_, i) => ({ type: 'play_action' as const, card: `Card${i}` })) // Many moves with stable numbers
    };
  }
}