import { GameState, PlayerState, Move, Victory, getCard } from '@principality/core';
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
      const moveDescription = this.describeMoveCompact(move);

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
    const supplyArray = Array.from(state.supply.entries());

    // Group by type for better display
    const treasures: [string, number][] = [];
    const victory: [string, number][] = [];
    const kingdom: [string, number][] = [];

    supplyArray.forEach(([name, count]) => {
      if (['Copper', 'Silver', 'Gold'].includes(name)) {
        treasures.push([name, count]);
      } else if (['Estate', 'Duchy', 'Province'].includes(name)) {
        victory.push([name, count]);
      } else {
        kingdom.push([name, count]);
      }
    });

    if (treasures.length > 0) {
      console.log('  Treasures: ' + this.formatSupplyGroup(treasures));
    }
    if (victory.length > 0) {
      console.log('  Victory:   ' + this.formatSupplyGroup(victory));
    }
    if (kingdom.length > 0) {
      console.log('  Kingdom:   ' + this.formatSupplyGroup(kingdom));
    }
    console.log('');
  }

  /**
   * Format a group of supply piles
   */
  private formatSupplyGroup(piles: [string, number][]): string {
    return piles.map(([name, count]) => {
      try {
        const card = getCard(name as any);
        return `${name} ($${card.cost}, ${count})`;
      } catch {
        // Handle unknown cards gracefully (e.g., in tests)
        return `${name} (${count})`;
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
   * Display welcome message
   */
  displayWelcome(seed: string, quickGame?: boolean): void {
    console.log('\n' + '='.repeat(60));
    console.log('PRINCIPALITY AI - Deck Building Game');
    if (quickGame) {
      console.log('Quick Game Mode: Victory piles reduced to 8');
    }
    console.log('='.repeat(60));
    console.log(`Game Seed: ${seed}`);
    console.log('\nCommands:');
    console.log('  Enter number to select a move');
    console.log('  "hand" - Show your hand');
    console.log('  "supply" - Show available cards');
    console.log('  "help" - Show this help message');
    console.log('  "quit" or "exit" - End game');
    console.log('='.repeat(60));
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
   * Create a compact description of a move
   */
  private describeMoveCompact(move: Move): string {
    switch (move.type) {
      case 'play_action':
        return `Play ${move.card}`;
      case 'play_treasure':
        return `Play ${move.card}`;
      case 'buy':
        const card = getCard(move.card!);
        return `Buy ${move.card} ($${card.cost})`;
      case 'end_phase':
        return 'End Phase';
      case 'discard_for_cellar':
        return 'Discard cards for Cellar';
      default:
        return 'Unknown move';
    }
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
