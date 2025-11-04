import {
  GameState,
  PlayerState,
  Move,
  Victory,
  getCard,
  getMoveDescriptionCompact,
  groupSupplyByType,
  calculateVictoryPoints
} from '@principality/core';
import { formatVPDisplay } from './vp-calculator';
import { getStableNumber } from './stable-numbers';

/**
 * Display options
 */
export interface DisplayOptions {
  stableNumbers?: boolean;
}

/**
 * Formats and displays game state to the console
 */
export class Display {
  private options: DisplayOptions;

  constructor(options: DisplayOptions = {}) {
    this.options = options;
  }
  /**
   * Display the current game state with player information
   */
  displayGameState(state: GameState): void {
    // Handle null/undefined states gracefully
    if (!state || !state.players || !state.players[state.currentPlayer]) {
      console.log('Error: Invalid game state');
      return;
    }

    const player = state.players[state.currentPlayer];
    const phaseLabel = this.capitalizePhase(state.phase);
    const vpDisplay = formatVPDisplay(player);

    console.log('\n' + '='.repeat(60));
    console.log(`Turn ${state.turnNumber} | Player ${state.currentPlayer + 1} | VP: ${vpDisplay} | ${phaseLabel} Phase`);
    console.log('='.repeat(60));

    this.displayPlayerHand(player);
    this.displayPlayerStats(player);
    console.log('');
  }

  /**
   * Display player's hand
   */
  private displayPlayerHand(player: PlayerState): void {
    if (!player || !player.hand) {
      console.log('Hand: (invalid)');
      return;
    }
    const handDisplay = player.hand.length > 0
      ? player.hand.join(', ')
      : '(empty)';
    console.log(`Hand: ${handDisplay}`);
  }

  /**
   * Display player stats (actions, buys, coins)
   */
  private displayPlayerStats(player: PlayerState): void {
    console.log(`Actions: ${player.actions}  Buys: ${player.buys}  Coins: $${player.coins}`);
  }

  /**
   * Display available moves as a numbered menu
   */
  displayAvailableMoves(moves: Move[]): void {
    console.log('Available Moves:');
    moves.forEach((move, index) => {
      const moveDescription = getMoveDescriptionCompact(move);

      if (this.options.stableNumbers) {
        // Show stable numbers
        const stableNum = this.getStableNumberForMove(move);
        if (stableNum !== null) {
          console.log(`  [${stableNum}] ${moveDescription}`);
        } else {
          console.log(`  ${moveDescription}`);
        }
      } else {
        // Show sequential numbers
        console.log(`  [${index + 1}] ${moveDescription}`);
      }
    });
    console.log('');
  }

  /**
   * Get stable number for a move
   */
  private getStableNumberForMove(move: Move): number | null {
    let moveKey: string;

    switch (move.type) {
      case 'play_action':
        moveKey = move.card || '';
        break;
      case 'play_treasure':
        moveKey = move.card || '';
        break;
      case 'buy':
        moveKey = `Buy ${move.card}`;
        break;
      case 'end_phase':
        moveKey = 'End Phase';
        break;
      default:
        return null;
    }

    return getStableNumber(moveKey);
  }

  /**
   * Display the supply piles
   */
  displaySupply(state: GameState): void {
    console.log('\nSupply:');
    const { treasures, victory, kingdom } = groupSupplyByType(state);

    if (treasures.length > 0) {
      console.log('  Treasures: ' + this.formatSupplyGroupFromPiles(treasures));
    }
    if (victory.length > 0) {
      console.log('  Victory:   ' + this.formatSupplyGroupFromPiles(victory));
    }
    if (kingdom.length > 0) {
      console.log('  Kingdom:   ' + this.formatSupplyGroupFromPiles(kingdom));
    }
    console.log('');
  }

  /**
   * Format a group of supply piles from SupplyPile objects
   */
  private formatSupplyGroupFromPiles(piles: Array<{name: string; remaining: number; cost?: number}>): string {
    return piles.map(pile => {
      if (pile.cost !== undefined) {
        return `${pile.name} ($${pile.cost}, ${pile.remaining})`;
      } else {
        return `${pile.name} (${pile.remaining})`;
      }
    }).join(', ');
  }

  /**
   * Display move result
   */
  displayMoveResult(success: boolean, message?: string): void {
    if (success && message) {
      console.log(`✓ ${message}`);
    } else if (!success && message) {
      console.log(`✗ Error: ${message}`);
    }
  }

  /**
   * Display game over screen
   */
  displayGameOver(victory: Victory, state: GameState): void {
    console.log('\n' + '='.repeat(60));
    console.log('GAME OVER');
    console.log('='.repeat(60));

    if (victory.scores) {
      console.log('\nFinal Scores:');
      victory.scores.forEach((score, index) => {
        const marker = index === victory.winner ? '★ WINNER' : '';
        const player = state.players[index];
        const vpDisplay = formatVPDisplay(player);
        console.log(`  Player ${index + 1}: ${score} VP (${vpDisplay}) ${marker}`);
      });
    }

    console.log(`\nTotal Turns: ${state.turnNumber}`);
    console.log('');
  }

  /**
   * Display welcome message with kingdom card selection
   */
  displayWelcome(seed: string, victoryPileSize?: number, state?: GameState): void {
    console.log('\n' + '='.repeat(60));
    console.log('PRINCIPALITY AI - Deck Building Game');
    if (victoryPileSize && victoryPileSize !== 4) {
      console.log(`Victory Piles: ${victoryPileSize} cards each`);
    }
    console.log('='.repeat(60));
    console.log(`Game Seed: ${seed}`);

    // Display selected kingdom cards
    if (state) {
      this.displayKingdomSelection(state);
    }

    console.log('\nCommands:');
    console.log('  Enter number to select a move');
    console.log('  "hand" - Show your hand');
    console.log('  "supply" - Show available cards');
    console.log('  "help" - Show this help message');
    console.log('  "quit" or "exit" - End game');
    console.log('='.repeat(60));
  }

  /**
   * Display the selected kingdom cards
   */
  private displayKingdomSelection(state: GameState): void {
    const basicCards = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];
    const kingdomCards = Array.from(state.supply.keys())
      .filter(card => !basicCards.includes(card))
      .sort();

    if (kingdomCards.length > 0) {
      console.log(`\nKingdom Cards: ${kingdomCards.join(', ')}`);
    }
  }

  /**
   * Display help message
   */
  displayHelp(): void {
    console.log('\nAvailable Commands:');
    console.log('  [number]     - Select move by number');
    console.log('  1, 2, 3      - Chain multiple moves (e.g., "1, 2, 3" or "1 2 3")');
    console.log('  treasures    - Auto-play all treasure cards at once (alias: t)');
    console.log('  hand         - Display your current hand with victory points');
    console.log('  supply       - Display all available supply piles');
    console.log('  help         - Show this help message');
    console.log('  quit         - Exit the game');
    console.log('  exit         - Exit the game (same as quit)');
    console.log('');
  }

  /**
   * Capitalize the first letter of the phase name
   */
  private capitalizePhase(phase: string): string {
    return phase.charAt(0).toUpperCase() + phase.slice(1);
  }

  /**
   * Display error message
   */
  displayError(message: string): void {
    console.log(`\n✗ Error: ${message}\n`);
  }

  /**
   * Display info message
   */
  displayInfo(message: string): void {
    console.log(`\n${message}\n`);
  }

  /**
   * Clear screen (optional, for cleaner display)
   */
  clearScreen(): void {
    console.clear();
  }
}
