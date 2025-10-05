import { GameState, PlayerState, Move, Victory } from '@principality/core';

/**
 * Formats and displays game state to the console
 */
export class Display {
  /**
   * Display the current game state with player information
   */
  displayGameState(state: GameState): void {
    const player = state.players[state.currentPlayer];
    const phaseLabel = this.capitalizePhase(state.phase);

    console.log('\n' + '='.repeat(60));
    console.log(`Turn ${state.turnNumber} | Player ${state.currentPlayer + 1} | ${phaseLabel} Phase`);
    console.log('='.repeat(60));

    this.displayPlayerHand(player);
    this.displayPlayerStats(player);
    console.log('');
  }

  /**
   * Display player's hand
   */
  private displayPlayerHand(player: PlayerState): void {
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
      console.log(`  [${index + 1}] ${moveDescription}`);
    });
    console.log('');
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
    return piles.map(([name, count]) => `${name} (${count})`).join(', ');
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
        console.log(`  Player ${index + 1}: ${score} VP ${marker}`);
      });
    }

    console.log(`\nTotal Turns: ${state.turnNumber}`);
    console.log('');
  }

  /**
   * Display welcome message
   */
  displayWelcome(seed: string): void {
    console.log('\n' + '='.repeat(60));
    console.log('PRINCIPALITY AI - Deck Building Game');
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
    console.log('  [number] - Select move by number from the list');
    console.log('  hand     - Display your current hand');
    console.log('  supply   - Display all available supply piles');
    console.log('  help     - Show this help message');
    console.log('  quit     - Exit the game');
    console.log('  exit     - Exit the game');
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
        return `Buy ${move.card}`;
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
