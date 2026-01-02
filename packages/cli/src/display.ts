import {
  GameState,
  PlayerState,
  Move,
  Victory,
  CardName,
  getCard,
  getMoveDescriptionCompact,
  groupSupplyByType,
  calculateVictoryPoints,
  generateMoveOptions,
  MoveOption
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
    const { treasures, victory, curse, kingdom } = groupSupplyByType(state);

    if (treasures.length > 0) {
      console.log('  Treasures: ' + this.formatSupplyGroupFromPiles(treasures));
    }
    if (victory.length > 0) {
      console.log('  Victory:   ' + this.formatSupplyGroupFromPiles(victory));
    }
    if (curse.length > 0) {
      console.log('  Curse:     ' + this.formatSupplyGroupFromPiles(curse));
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

  /**
   * Display interactive prompt for pending effects (Feature 2)
   * REFACTORED to use shared presentation layer (Phase 4.2)
   *
   * @req: FR-CLI-1 - CLI uses shared layer
   * @req: FR-CLI-2 - No behavioral changes
   * @req: FR-CLI-3 - Consistent option numbering
   * @fix: Bug #37 - Return MoveOption[] as single source of truth
   * @param state - Current game state with pendingEffect
   * @param validMoves - Valid moves for the pending effect
   * @returns MoveOption[] - The options displayed to the user (for execution)
   */
  displayPendingEffectPrompt(state: GameState, validMoves: Move[]): MoveOption[] {
    const pendingEffect = state.pendingEffect;
    if (!pendingEffect) {
      return [];
    }

    const card = getCard(pendingEffect.card);

    // Display card effect description
    console.log(`\n✓ Player ${state.currentPlayer + 1} played ${pendingEffect.card}`);
    console.log(`Effect: ${card.description}\n`);

    // Get structured options from SHARED LAYER
    const options: MoveOption[] = generateMoveOptions(state, validMoves);

    if (options.length === 0) {
      console.log(`Choose an option:`);
      validMoves.forEach((move, index) => {
        console.log(`  [${index + 1}] ${getMoveDescriptionCompact(move)}`);
      });
      console.log('');

      // FALLBACK: Generate options from validMoves for consistency
      // This ensures we always return MoveOption[] even when generateMoveOptions returns empty
      return validMoves.map((move, index) => ({
        index: index + 1,
        move: move,
        description: getMoveDescriptionCompact(move),
        details: {}
      }));
    }

    // Display card-specific header
    this.displayPromptHeader(pendingEffect);

    // Display options using shared data
    options.forEach(opt => {
      console.log(`  [${opt.index}] ${opt.description}`);
    });

    console.log(''); // Empty line before input prompt

    // Return options for execution (SINGLE SOURCE OF TRUTH)
    return options;
  }

  /**
   * Display card-specific prompt headers
   * Helper method for displayPendingEffectPrompt
   */
  private displayPromptHeader(pendingEffect: any): void {
    switch (pendingEffect.effect) {
      case 'discard_for_cellar':
        console.log('Choose cards to discard:');
        break;
      case 'trash_cards':
        console.log(`Choose cards to trash (up to ${pendingEffect.maxTrash || 4}):`);
        break;
      case 'trash_for_remodel':
        console.log('Step 1: Choose card to trash:');
        break;
      case 'select_treasure_to_trash':
        if (pendingEffect.card === 'Mine') {
          console.log('Step 1: Choose treasure to trash:');
        }
        break;
      case 'gain_card':
        if (pendingEffect.card === 'Remodel') {
          console.log(`Step 2: Choose card to gain (up to $${pendingEffect.maxGainCost}):`);
        } else if (pendingEffect.card === 'Mine') {
          console.log(`Step 2: Choose treasure to gain to hand (up to $${pendingEffect.maxGainCost}):`);
        } else if (pendingEffect.card === 'Workshop') {
          console.log('Choose card to gain (up to $4):');
        } else if (pendingEffect.card === 'Feast') {
          console.log('Choose card to gain (up to $5):');
        }
        break;
      case 'library_set_aside':
        console.log('Action card drawn - set aside or keep?');
        break;
      case 'select_action_for_throne':
        console.log('Choose action card to play twice:');
        break;
      case 'chancellor_decision':
        const deckSize = pendingEffect.deckSize || 0;
        console.log(`Put your deck (${deckSize} cards) into discard pile?`);
        break;
      case 'spy_decision':
        console.log(`Player ${(pendingEffect.targetPlayer || 0) + 1}'s top card revealed - discard or keep?`);
        break;
      case 'reveal_and_topdeck':
        console.log('Choose victory card to put on top of deck:');
        break;
      default:
        console.log('Choose an option:');
    }
  }

  /**
   * Display Cellar prompt: choose cards to discard
   */
  private displayCellarPrompt(validMoves: Move[]): void {
    console.log('Choose cards to discard:');
    validMoves.forEach((move, index) => {
      if (move.type === 'discard_for_cellar' && move.cards) {
        const count = move.cards.length;
        if (count === 0) {
          console.log(`  [${index + 1}] Discard nothing (draw 0)`);
        } else {
          console.log(`  [${index + 1}] Discard: ${move.cards.join(', ')} (draw ${count})`);
        }
      }
    });
  }

  /**
   * Display Chapel prompt: choose cards to trash (up to maxTrash)
   */
  private displayChapelPrompt(validMoves: Move[], maxTrash: number): void {
    console.log(`Choose cards to trash (up to ${maxTrash}):`);
    validMoves.forEach((move, index) => {
      if (move.type === 'trash_cards' && move.cards) {
        const count = move.cards.length;
        if (count === 0) {
          console.log(`  [${index + 1}] Trash nothing`);
        } else {
          console.log(`  [${index + 1}] Trash: ${move.cards.join(', ')} (${count} card${count > 1 ? 's' : ''})`);
        }
      }
    });
  }

  /**
   * Display Remodel Step 1: choose card to trash
   */
  private displayRemodelStep1Prompt(hand: ReadonlyArray<CardName>): void {
    console.log('Step 1: Choose card to trash:');
    hand.forEach((card, index) => {
      const cardDef = getCard(card);
      const gainCost = cardDef.cost + 2;
      console.log(`  [${index + 1}] Trash: ${card} ($${cardDef.cost}) → Can gain up to $${gainCost}`);
    });
  }

  /**
   * Display Remodel Step 2: choose card to gain
   */
  private displayRemodelStep2Prompt(validMoves: Move[], maxGainCost: number): void {
    console.log(`Step 2: Choose card to gain (up to $${maxGainCost}):`);
    validMoves.forEach((move, index) => {
      if (move.type === 'gain_card' && move.card) {
        const cardDef = getCard(move.card);
        console.log(`  [${index + 1}] Gain: ${move.card} ($${cardDef.cost})`);
      }
    });
  }

  /**
   * Display Mine Step 1: choose treasure to trash
   */
  private displayMineStep1Prompt(hand: ReadonlyArray<CardName>): void {
    console.log('Step 1: Choose treasure to trash:');
    const treasures = hand.filter(card => {
      const cardDef = getCard(card);
      return cardDef.type === 'treasure';
    });

    if (treasures.length === 0) {
      console.log('  [1] No treasures to trash');
    } else {
      treasures.forEach((card, index) => {
        const cardDef = getCard(card);
        const gainCost = cardDef.cost + 3;
        console.log(`  [${index + 1}] Trash: ${card} ($${cardDef.cost}) → Can gain treasure up to $${gainCost} to hand`);
      });
    }
  }

  /**
   * Display Mine Step 2: choose treasure to gain to hand
   */
  private displayMineStep2Prompt(validMoves: Move[], maxGainCost: number): void {
    console.log(`Step 2: Choose treasure to gain to hand (up to $${maxGainCost}):`);
    validMoves.forEach((move, index) => {
      if (move.type === 'gain_card' && move.card) {
        const cardDef = getCard(move.card);
        console.log(`  [${index + 1}] Gain to hand: ${move.card} ($${cardDef.cost})`);
      }
    });
  }

  /**
   * Display Workshop prompt: gain card up to $4
   */
  private displayWorkshopPrompt(validMoves: Move[]): void {
    console.log('Choose card to gain (up to $4):');
    validMoves.forEach((move, index) => {
      if (move.type === 'gain_card' && move.card) {
        const cardDef = getCard(move.card);
        console.log(`  [${index + 1}] Gain: ${move.card} ($${cardDef.cost})`);
      }
    });
  }

  /**
   * Display Feast prompt: gain card up to $5
   */
  private displayFeastPrompt(validMoves: Move[]): void {
    console.log('Choose card to gain (up to $5):');
    validMoves.forEach((move, index) => {
      if (move.type === 'gain_card' && move.card) {
        const cardDef = getCard(move.card);
        console.log(`  [${index + 1}] Gain: ${move.card} ($${cardDef.cost})`);
      }
    });
  }

  /**
   * Display Library prompt: set aside or keep action card
   */
  private displayLibraryPrompt(validMoves: Move[]): void {
    console.log('Action card drawn - set aside or keep?');
    validMoves.forEach((move, index) => {
      if (move.type === 'library_set_aside' && move.cards && move.cards.length > 0) {
        const card = move.cards[0];
        if (move.choice === true) {
          console.log(`  [${index + 1}] Set aside: ${card}`);
        } else {
          console.log(`  [${index + 1}] Keep: ${card}`);
        }
      }
    });
  }

  /**
   * Display Throne Room prompt: choose action to play twice
   */
  private displayThroneRoomPrompt(hand: ReadonlyArray<CardName>): void {
    console.log('Choose action card to play twice:');
    const actions = hand.filter(card => {
      const cardDef = getCard(card);
      return cardDef.type === 'action' || cardDef.type === 'action-attack' || cardDef.type === 'action-reaction';
    });

    if (actions.length === 0) {
      console.log('  [1] No action cards to play');
    } else {
      actions.forEach((card, index) => {
        console.log(`  [${index + 1}] Play twice: ${card}`);
      });
    }
  }

  /**
   * Display Chancellor prompt: put deck into discard pile?
   */
  private displayChancellorPrompt(deckSize: number): void {
    console.log(`Put your deck (${deckSize} cards) into discard pile?`);
    console.log(`  [1] Yes - Put deck into discard`);
    console.log(`  [2] No - Keep deck as is`);
  }

  /**
   * Display Spy prompt: discard or keep revealed top card
   */
  private displaySpyPrompt(validMoves: Move[], targetPlayer: number, state: GameState): void {
    console.log(`Player ${targetPlayer + 1}'s top card revealed - discard or keep?`);
    validMoves.forEach((move, index) => {
      if (move.type === 'spy_decision') {
        if (move.choice === true) {
          console.log(`  [${index + 1}] Discard top card`);
        } else {
          console.log(`  [${index + 1}] Keep on top of deck`);
        }
      }
    });
  }

  /**
   * Display Bureaucrat prompt: choose victory card to topdeck
   */
  private displayBureaucratPrompt(hand: ReadonlyArray<CardName>): void {
    console.log('Choose victory card to put on top of deck:');
    const victoryCards = hand.filter(card => {
      const cardDef = getCard(card);
      return cardDef.type === 'victory';
    });

    if (victoryCards.length === 0) {
      console.log('  [1] Reveal hand (no Victory cards)');
    } else {
      victoryCards.forEach((card, index) => {
        console.log(`  [${index + 1}] Topdeck: ${card}`);
      });
    }
  }
}

/**
 * Parse user's numeric selection from interactive prompt
 * @param input - User input string (e.g., "1", "2", " 3 ")
 * @param options - Array of available Move options
 * @returns Index of selected option (0-based), or null if invalid
 *
 * @req: FR-CLI-INPUT - Numeric selection parsing with validation
 * @edge: Rejects floats, negatives, out-of-range, non-numeric, empty
 */
export function parseUserSelection(input: string, options: Move[]): number | null {
  const trimmed = input.trim();

  // Reject non-numeric input (including floats with decimal points)
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const num = parseInt(trimmed, 10);

  // Check if valid index (1-based input, return 0-based)
  if (num < 1 || num > options.length) {
    return null;
  }

  return num - 1;
}
