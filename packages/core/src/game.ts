import { GameState, PlayerState, Move, GameResult, Victory, CardName, GameOptions } from './types';
import { getCard, isActionCard, isTreasureCard, isVictoryCard } from './cards';
import { SeededRandom, createStartingDeck, createDefaultSupply, calculateScore, getAllPlayerCards } from './utils';

// @decision: Helper functions for Phase 4 card mechanics
// Placed outside GameEngine class for better separation of concerns

// @blocker: Test files have errors preventing Phase 4-6 testing:
// 1. cards-gaining.test.ts:243 - uses 'end_turn' (should be 'end_phase')
// 2. cards-attacks.test.ts:95 - uses 'target_size' property (not in Move type)
// 3. cards-attacks/reactions/special.test.ts - uses 'deck' (should be 'drawPile')
// 4. cards.test.ts:263 - expects 8 kingdom cards, but now have 25 (Phase 4)
// 5. cards.test.ts:281 - validTypes missing 'action-attack' and 'action-reaction'
// Cannot fix test files - need test-architect to update for Phase 4
//
// Current status:
// ✅ Phase 3 complete: All 13 trashing tests passing (Chapel, Remodel, Mine, Moneylender)
// ❌ Phase 4-6 blocked: Test files not updated for Phase 4 card set

/**
 * Trash cards from current player's hand to the trash pile
 */
function trashCards(state: GameState, cards: ReadonlyArray<CardName>): GameState {
  const currentPlayer = state.players[state.currentPlayer];

  // Validate all cards are in hand
  const handCounts = new Map<CardName, number>();
  currentPlayer.hand.forEach(card => {
    handCounts.set(card, (handCounts.get(card) || 0) + 1);
  });

  const trashCounts = new Map<CardName, number>();
  cards.forEach(card => {
    trashCounts.set(card, (trashCounts.get(card) || 0) + 1);
  });

  for (const [card, count] of trashCounts) {
    if ((handCounts.get(card) || 0) < count) {
      throw new Error(`Cannot trash ${count} ${card}(s), only have ${handCounts.get(card) || 0} in hand`);
    }
  }

  // Remove cards from hand
  const newHand = [...currentPlayer.hand];
  cards.forEach(cardToTrash => {
    const index = newHand.indexOf(cardToTrash);
    if (index !== -1) {
      newHand.splice(index, 1);
    }
  });

  return {
    ...state,
    trash: [...state.trash, ...cards],
    players: state.players.map((p, i) =>
      i === state.currentPlayer ? { ...p, hand: newHand } : p
    )
  };
}

/**
 * Gain a card from supply to specified destination
 */
function gainCard(
  state: GameState,
  card: CardName,
  destination: 'hand' | 'discard' | 'topdeck',
  playerIndex?: number
): GameState {
  const targetPlayerIndex = playerIndex ?? state.currentPlayer;
  const supply = new Map(state.supply);
  const availableCount = supply.get(card) || 0;

  if (availableCount === 0) {
    throw new Error(`${card} not available in supply`);
  }

  supply.set(card, availableCount - 1);
  const targetPlayer = state.players[targetPlayerIndex];

  let newPlayer: PlayerState;
  if (destination === 'hand') {
    newPlayer = { ...targetPlayer, hand: [...targetPlayer.hand, card] };
  } else if (destination === 'topdeck') {
    newPlayer = { ...targetPlayer, drawPile: [card, ...targetPlayer.drawPile] };
  } else {
    newPlayer = { ...targetPlayer, discardPile: [...targetPlayer.discardPile, card] };
  }

  return {
    ...state,
    supply,
    players: state.players.map((p, i) => (i === targetPlayerIndex ? newPlayer : p))
  };
}

/**
 * Check if a player has Moat and can reveal it to block an attack
 */
function checkForMoatReveal(state: GameState, defendingPlayerIndex: number): boolean {
  const defendingPlayer = state.players[defendingPlayerIndex];
  // @hint: In full implementation, this would prompt the player to choose
  // For now, auto-reveal Moat if in hand (optimal strategy)
  return defendingPlayer.hand.includes('Moat');
}

/**
 * Apply an attack effect to all other players (excluding attacker)
 * Skips players who reveal Moat
 */
function resolveAttack(
  state: GameState,
  attackEffect: (state: GameState, playerIndex: number) => GameState
): GameState {
  let newState = state;

  for (let i = 0; i < state.players.length; i++) {
    if (i === state.currentPlayer) continue; // Skip attacker

    // Check for Moat - if revealed, skip this player
    if (checkForMoatReveal(newState, i)) {
      newState = {
        ...newState,
        gameLog: [...newState.gameLog, `Player ${i + 1} revealed Moat and blocked the attack`]
      };
      continue;
    }

    // Apply attack effect to this player
    newState = attackEffect(newState, i);
  }

  return newState;
}

export class GameEngine {
  private random: SeededRandom;
  private seed: string;
  private options: GameOptions;

  constructor(seed: string, options: GameOptions = {}) {
    this.seed = seed;
    this.random = new SeededRandom(seed);
    this.options = options;
  }

  initializeGame(numPlayers: number = 1): GameState {
    const players: PlayerState[] = [];

    for (let i = 0; i < numPlayers; i++) {
      const startingDeck = createStartingDeck();
      const shuffledDeck = this.random.shuffle(startingDeck);

      players.push({
        drawPile: shuffledDeck.slice(5),
        hand: shuffledDeck.slice(0, 5),
        discardPile: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0
      });
    }

    return {
      players,
      supply: createDefaultSupply(this.options),
      currentPlayer: 0,
      phase: 'action',
      turnNumber: 1,
      seed: this.seed,
      gameLog: ['Game started'],
      trash: []
    };
  }

  executeMove(state: GameState, move: Move): GameResult {
    try {
      const newState = this.processMove(state, move);
      return { success: true, newState };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private processMove(state: GameState, move: Move): GameState {
    const player = state.players[state.currentPlayer];

    switch (move.type) {
      case 'play_action':
        if (state.phase !== 'action') {
          throw new Error('Cannot play actions outside action phase');
        }
        if (!move.card) {
          throw new Error('Must specify card to play');
        }
        if (player.actions <= 0) {
          throw new Error('No actions remaining');
        }
        return this.playActionCard(state, move.card);

      case 'play_treasure':
        if (state.phase !== 'buy') {
          throw new Error('Cannot play treasures outside buy phase');
        }
        if (!move.card) {
          throw new Error('Must specify card to play');
        }
        return this.playTreasureCard(state, move.card);

      case 'buy':
        if (state.phase !== 'buy') {
          throw new Error('Cannot buy cards outside buy phase');
        }
        if (!move.card) {
          throw new Error('Must specify card to buy');
        }
        if (player.buys <= 0) {
          throw new Error('No buys remaining');
        }
        return this.buyCard(state, move.card);

      case 'end_phase':
        return this.endPhase(state);

      case 'discard_for_cellar':
        if (!move.cards) {
          throw new Error('Must specify cards to discard');
        }
        return this.handleCellarDiscard(state, move.cards);

      case 'trash_cards':
        if (!move.cards) {
          throw new Error('Must specify cards to trash');
        }
        return this.handleTrashCards(state, move.cards);

      case 'gain_card':
        if (!move.card) {
          throw new Error('Must specify card to gain');
        }
        return this.handleGainCard(state, move.card, move.destination || 'discard');

      case 'spy_decision':
        if (move.playerIndex === undefined || !move.card || move.choice === undefined) {
          throw new Error('Spy decision requires playerIndex, card, and choice');
        }
        return this.handleSpyDecision(state, move.playerIndex, move.card, move.choice);

      case 'select_treasure_to_trash':
        if (!move.card) {
          throw new Error('Must specify treasure to trash');
        }
        return this.handleThiefTrashTreasure(state, move.card);

      case 'gain_trashed_card':
        if (!move.card) {
          throw new Error('Must specify card to gain from trash');
        }
        return this.handleGainFromTrash(state, move.card);

      case 'select_action_for_throne':
        if (!move.card) {
          throw new Error('Must specify action card for Throne Room');
        }
        return this.handleThroneRoomSelection(state, move.card);

      case 'chancellor_decision':
        if (move.choice === undefined) {
          throw new Error('Chancellor decision requires choice');
        }
        return this.handleChancellorDecision(state, move.choice);

      case 'library_set_aside':
        if (!move.card) {
          throw new Error('Must specify card to set aside for Library');
        }
        return this.handleLibrarySetAside(state, move.card);

      case 'discard_to_hand_size':
        if (!move.cards) {
          throw new Error('Must specify cards to discard');
        }
        return this.handleDiscardToHandSize(state, move.cards);

      case 'reveal_and_topdeck':
        if (!move.card) {
          throw new Error('Must specify card to topdeck');
        }
        return this.handleRevealAndTopdeck(state, move.card);

      default:
        throw new Error(`Unknown move type: ${(move as any).type}`);
    }
  }

  private playActionCard(state: GameState, cardName: CardName): GameState {
    const player = state.players[state.currentPlayer];

    if (!player.hand.includes(cardName)) {
      throw new Error(`${cardName} not in hand`);
    }

    if (!isActionCard(cardName)) {
      throw new Error(`${cardName} is not an action card`);
    }

    const card = getCard(cardName);

    // Special validation for Moneylender: if no Copper, don't use action or move card
    // @decision: Moneylender with no Copper has no effect (card stays in hand, action not consumed)
    // This matches test expectations in UT-MONEYLENDER-2
    if (cardName === 'Moneylender' && !player.hand.includes('Copper')) {
      // No effect: state unchanged except for log
      return {
        ...state,
        gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} played Moneylender (no Copper to trash)`]
      };
    }

    // Handle special Phase 4 cards that need custom logic
    if (card.effect.special) {
      return this.handleSpecialCard(state, cardName, card.effect.special);
    }

    // Standard card effect processing
    const newHand = [...player.hand];
    const cardIndex = newHand.indexOf(cardName);
    if (cardIndex !== -1) {
      newHand.splice(cardIndex, 1);
    }
    const newInPlay = [...player.inPlay, cardName];

    let newActions = Math.max(0, player.actions - 1);
    let newCards = 0;
    let newCoins = player.coins;
    let newBuys = player.buys;

    // Apply card effects
    if (card.effect.actions) newActions += card.effect.actions;
    if (card.effect.cards) newCards = card.effect.cards;
    if (card.effect.coins) newCoins += card.effect.coins;
    if (card.effect.buys) newBuys += card.effect.buys;

    let finalHand: CardName[] = [...newHand];
    let finalDrawPile: CardName[] = [...player.drawPile];
    let finalDiscardPile: CardName[] = [...player.discardPile];

    // Draw cards if needed
    if (newCards > 0) {
      const drawResult = this.drawCards(finalDrawPile, finalDiscardPile, finalHand, newCards);
      finalHand = drawResult.newHand;
      finalDrawPile = drawResult.newDeck;
      finalDiscardPile = drawResult.newDiscard;
    }

    const updatedPlayer: PlayerState = {
      ...player,
      hand: finalHand,
      drawPile: finalDrawPile,
      discardPile: finalDiscardPile,
      inPlay: newInPlay,
      actions: newActions,
      coins: newCoins,
      buys: newBuys
    };

    const newPlayers = [...state.players];
    newPlayers[state.currentPlayer] = updatedPlayer;

    return {
      ...state,
      players: newPlayers,
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} played ${cardName}`]
    };
  }

  private playTreasureCard(state: GameState, cardName: CardName): GameState {
    const player = state.players[state.currentPlayer];
    
    if (!player.hand.includes(cardName)) {
      throw new Error(`${cardName} not in hand`);
    }
    
    if (!isTreasureCard(cardName)) {
      throw new Error(`${cardName} is not a treasure card`);
    }

    const card = getCard(cardName);
    const newHand = [...player.hand];
    const cardIndex = newHand.indexOf(cardName);
    if (cardIndex !== -1) {
      newHand.splice(cardIndex, 1);
    }
    const newInPlay = [...player.inPlay, cardName];
    const newCoins = player.coins + (card.effect.coins || 0);

    const updatedPlayer: PlayerState = {
      ...player,
      hand: newHand,
      inPlay: newInPlay,
      coins: newCoins
    };

    const newPlayers = [...state.players];
    newPlayers[state.currentPlayer] = updatedPlayer;

    return {
      ...state,
      players: newPlayers,
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} played ${cardName}`]
    };
  }

  private buyCard(state: GameState, cardName: CardName): GameState {
    const player = state.players[state.currentPlayer];
    const card = getCard(cardName);
    const supplyCount = state.supply.get(cardName) || 0;

    if (supplyCount <= 0) {
      throw new Error(`${cardName} not available in supply`);
    }

    if (player.coins < card.cost) {
      throw new Error(`Not enough coins to buy ${cardName}. Need ${card.cost}, have ${player.coins}`);
    }

    const newSupply = new Map(state.supply);
    newSupply.set(cardName, supplyCount - 1);

    const updatedPlayer: PlayerState = {
      ...player,
      coins: player.coins - card.cost,
      buys: player.buys - 1,
      discardPile: [...player.discardPile, cardName]
    };

    const newPlayers = [...state.players];
    newPlayers[state.currentPlayer] = updatedPlayer;

    return {
      ...state,
      players: newPlayers,
      supply: newSupply,
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} bought ${cardName}`]
    };
  }

  private endPhase(state: GameState): GameState {
    switch (state.phase) {
      case 'action':
        return { ...state, phase: 'buy' };
      
      case 'buy':
        return { ...state, phase: 'cleanup' };
      
      case 'cleanup':
        return this.performCleanup(state);
      
      default:
        throw new Error(`Cannot end unknown phase: ${state.phase}`);
    }
  }

  private performCleanup(state: GameState): GameState {
    const player = state.players[state.currentPlayer];

    // Discard everything from hand and play area
    const allDiscards = [...player.discardPile, ...player.hand, ...player.inPlay];

    // Draw new hand of 5 cards
    const drawResult = this.drawCards(player.drawPile, allDiscards, [], 5);

    const updatedPlayer: PlayerState = {
      drawPile: drawResult.newDeck,
      hand: drawResult.newHand,
      discardPile: drawResult.newDiscard,
      inPlay: [],
      actions: 1,
      buys: 1,
      coins: 0
    };

    const newPlayers = [...state.players];
    newPlayers[state.currentPlayer] = updatedPlayer;

    // Move to next player
    const nextPlayer = (state.currentPlayer + 1) % state.players.length;
    const nextTurn = nextPlayer === 0 ? state.turnNumber + 1 : state.turnNumber;

    return {
      ...state,
      players: newPlayers,
      currentPlayer: nextPlayer,
      phase: 'action',
      turnNumber: nextTurn,
      gameLog: [...state.gameLog, `Turn ${nextTurn} begins`]
    };
  }

  private drawCards(deck: ReadonlyArray<CardName>, discard: ReadonlyArray<CardName>, hand: ReadonlyArray<CardName>, count: number): {
    newDeck: CardName[];
    newDiscard: CardName[];
    newHand: CardName[];
  } {
    let currentDeck = [...deck];
    let currentDiscard = [...discard];
    const currentHand = [...hand];

    for (let i = 0; i < count; i++) {
      if (currentDeck.length === 0) {
        if (currentDiscard.length === 0) {
          // No more cards to draw
          break;
        }
        // Shuffle discard pile to form new deck
        currentDeck = [...this.random.shuffle(currentDiscard)];
        currentDiscard = [];
      }
      
      if (currentDeck.length > 0) {
        currentHand.push(currentDeck[0]);
        currentDeck = currentDeck.slice(1);
      }
    }

    return {
      newDeck: currentDeck,
      newDiscard: currentDiscard,
      newHand: currentHand
    };
  }

  private handleCellarDiscard(state: GameState, cardsToDiscard: ReadonlyArray<CardName>): GameState {
    const player = state.players[state.currentPlayer];
    
    // Validate all cards are in hand
    const handCounts = new Map<CardName, number>();
    player.hand.forEach(card => {
      handCounts.set(card, (handCounts.get(card) || 0) + 1);
    });

    const discardCounts = new Map<CardName, number>();
    cardsToDiscard.forEach(card => {
      discardCounts.set(card, (discardCounts.get(card) || 0) + 1);
    });

    for (const [card, count] of discardCounts) {
      if ((handCounts.get(card) || 0) < count) {
        throw new Error(`Cannot discard ${count} ${card}(s), only have ${handCounts.get(card) || 0}`);
      }
    }

    // Remove discarded cards from hand
    const newHand = [...player.hand];
    cardsToDiscard.forEach(cardToDiscard => {
      const index = newHand.indexOf(cardToDiscard);
      if (index !== -1) {
        newHand.splice(index, 1);
      }
    });

    // Add to discard pile
    const newDiscardPile = [...player.discardPile, ...cardsToDiscard];

    // Draw cards equal to number discarded
    const drawResult = this.drawCards(player.drawPile, newDiscardPile, newHand, cardsToDiscard.length);

    const updatedPlayer: PlayerState = {
      ...player,
      hand: drawResult.newHand,
      drawPile: drawResult.newDeck,
      discardPile: drawResult.newDiscard
    };

    const newPlayers = [...state.players];
    newPlayers[state.currentPlayer] = updatedPlayer;

    return {
      ...state,
      players: newPlayers,
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} discarded ${cardsToDiscard.length} cards for Cellar`]
    };
  }

  private handleTrashCards(state: GameState, cards: ReadonlyArray<CardName>): GameState {
    // Validate based on pending effect
    const pending = state.pendingEffect;

    if (!pending) {
      throw new Error('No card effect requires trashing');
    }

    // Validate based on which card is pending
    switch (pending.card) {
      case 'Chapel':
        if (cards.length > 4) {
          throw new Error('Chapel can only trash up to 4 cards');
        }
        // Trash cards and clear pending effect
        const chapelState = trashCards(state, cards);
        return {
          ...chapelState,
          pendingEffect: undefined
        };

      case 'Remodel':
        if (cards.length === 0) {
          throw new Error('Must trash a card for Remodel');
        }
        if (cards.length > 1) {
          throw new Error('Remodel can only trash 1 card');
        }
        // Calculate max gain cost: trashed card cost + 2
        const trashedCard = cards[0];
        const trashedCardCost = getCard(trashedCard).cost;
        const remodelState = trashCards(state, cards);
        return {
          ...remodelState,
          pendingEffect: {
            card: 'Remodel',
            effect: 'gain_card',
            maxGainCost: trashedCardCost + 2,
            trashedCard
          }
        };

      case 'Mine':
        if (cards.length === 0) {
          throw new Error('Must trash a Treasure for Mine');
        }
        if (cards.length > 1) {
          throw new Error('Mine can only trash 1 card');
        }
        const mineCard = cards[0];
        if (!isTreasureCard(mineCard)) {
          throw new Error('Must trash a Treasure for Mine');
        }
        const mineCost = getCard(mineCard).cost;
        const mineState = trashCards(state, cards);
        return {
          ...mineState,
          pendingEffect: {
            card: 'Mine',
            effect: 'gain_treasure',
            maxGainCost: mineCost + 3,
            trashedCard: mineCard
          }
        };

      case 'Moneylender':
        // Moneylender expects exactly 1 Copper
        if (cards.length !== 1) {
          throw new Error('Moneylender must trash exactly 1 card');
        }
        if (cards[0] !== 'Copper') {
          throw new Error('Moneylender can only trash Copper');
        }
        const moneylenderState = trashCards(state, cards);
        // Add +$3 coins
        return {
          ...moneylenderState,
          players: moneylenderState.players.map((p, i) =>
            i === state.currentPlayer
              ? { ...p, coins: p.coins + 3 }
              : p
          ),
          pendingEffect: undefined
        };

      default:
        throw new Error(`${pending.card} does not support trash_cards move`);
    }
  }

  private handleGainCard(state: GameState, card: CardName, destination: 'hand' | 'discard' | 'topdeck'): GameState {
    const pending = state.pendingEffect;

    if (!pending) {
      throw new Error('No card effect requires gaining');
    }

    // Validate based on pending effect
    if (pending.effect === 'gain_card' && pending.card === 'Remodel') {
      // Remodel: gain card costing up to (trashed + $2)
      const cardCost = getCard(card).cost;
      if (cardCost > pending.maxGainCost!) {
        throw new Error(`Card costs more than allowed (max $${pending.maxGainCost})`);
      }
      const gainedState = gainCard(state, card, destination);
      return {
        ...gainedState,
        pendingEffect: undefined
      };
    }

    if (pending.effect === 'gain_treasure' && pending.card === 'Mine') {
      // Mine: must gain a Treasure
      if (!isTreasureCard(card)) {
        throw new Error('Must gain a Treasure for Mine');
      }
      const cardCost = getCard(card).cost;
      if (cardCost > pending.maxGainCost!) {
        throw new Error(`Card costs more than allowed (max $${pending.maxGainCost})`);
      }
      const gainedState = gainCard(state, card, destination);
      return {
        ...gainedState,
        pendingEffect: undefined
      };
    }

    throw new Error(`${pending.card} does not support gain_card move in this context`);
  }

  private handleSpecialCard(state: GameState, cardName: CardName, special: string): GameState {
    const player = state.players[state.currentPlayer];

    // Remove card from hand and put in play (common for all special cards)
    const newHand = [...player.hand];
    const cardIndex = newHand.indexOf(cardName);
    if (cardIndex !== -1) {
      newHand.splice(cardIndex, 1);
    }
    const newInPlay = [...player.inPlay, cardName];

    let baseState: GameState = {
      ...state,
      players: state.players.map((p, i) =>
        i === state.currentPlayer
          ? { ...p, hand: newHand, inPlay: newInPlay, actions: Math.max(0, p.actions - 1) }
          : p
      )
    };

    // Apply standard effects first (cards, actions, coins, buys)
    const card = getCard(cardName);
    const currentPlayer = baseState.players[baseState.currentPlayer];

    let updatedPlayer = currentPlayer;
    if (card.effect.cards || card.effect.actions || card.effect.coins || card.effect.buys) {
      const cardsToDraw = card.effect.cards || 0;
      let finalHand = [...currentPlayer.hand];
      let finalDrawPile = [...currentPlayer.drawPile];
      let finalDiscardPile = [...currentPlayer.discardPile];

      if (cardsToDraw > 0) {
        const drawResult = this.drawCards(finalDrawPile, finalDiscardPile, finalHand, cardsToDraw);
        finalHand = drawResult.newHand;
        finalDrawPile = drawResult.newDeck;
        finalDiscardPile = drawResult.newDiscard;
      }

      updatedPlayer = {
        ...currentPlayer,
        hand: finalHand,
        drawPile: finalDrawPile,
        discardPile: finalDiscardPile,
        actions: currentPlayer.actions + (card.effect.actions || 0),
        coins: currentPlayer.coins + (card.effect.coins || 0),
        buys: currentPlayer.buys + (card.effect.buys || 0)
      };

      baseState = {
        ...baseState,
        players: baseState.players.map((p, i) => (i === baseState.currentPlayer ? updatedPlayer : p))
      };
    }

    // Handle special effects
    switch (special) {
      // === Trashing Cards ===
      case 'trash_up_to_4': // Chapel
        // Chapel allows trashing up to 4 cards - handled by subsequent trash_cards move
        return {
          ...baseState,
          pendingEffect: {
            card: 'Chapel',
            effect: 'trash_cards',
            maxTrash: 4
          },
          gameLog: [...baseState.gameLog, `Player ${baseState.currentPlayer + 1} played Chapel (may trash up to 4 cards)`]
        };

      case 'trash_copper_gain_coins': // Moneylender
        return this.handleMoneylender(baseState);

      case 'trash_and_gain': // Remodel
        return {
          ...baseState,
          pendingEffect: {
            card: 'Remodel',
            effect: 'trash_then_gain'
          },
          gameLog: [...baseState.gameLog, `Player ${baseState.currentPlayer + 1} played Remodel (trash 1 card, gain +$2 cost)`]
        };

      case 'trash_treasure_gain_treasure': // Mine
        return {
          ...baseState,
          pendingEffect: {
            card: 'Mine',
            effect: 'trash_then_gain'
          },
          gameLog: [...baseState.gameLog, `Player ${baseState.currentPlayer + 1} played Mine (trash Treasure, gain Treasure +$3 to hand)`]
        };

      // === Gaining Cards ===
      case 'gain_card_up_to_4': // Workshop
        return {
          ...baseState,
          gameLog: [...baseState.gameLog, `Player ${baseState.currentPlayer + 1} played Workshop (gain card up to $4)`]
        };

      case 'trash_self_gain_card': // Feast
        return this.handleFeast(baseState);

      // === Attack Cards ===
      case 'attack_discard_to_3': // Militia
        return this.handleMilitia(baseState);

      case 'attack_gain_curse': // Witch
        return this.handleWitch(baseState);

      case 'gain_silver_attack_topdeck_victory': // Bureaucrat
        return this.handleBureaucrat(baseState);

      case 'attack_reveal_top_card': // Spy
        return this.handleSpy(baseState);

      case 'attack_reveal_2_trash_treasure': // Thief
        return this.handleThief(baseState);

      // === Reaction ===
      case 'reaction_block_attack': // Moat
        return {
          ...baseState,
          gameLog: [...baseState.gameLog, `Player ${baseState.currentPlayer + 1} played Moat`]
        };

      // === Special Cards ===
      case 'play_action_twice': // Throne Room
        return {
          ...baseState,
          gameLog: [...baseState.gameLog, `Player ${baseState.currentPlayer + 1} played Throne Room (play action twice)`]
        };

      case 'reveal_until_2_treasures': // Adventurer
        return this.handleAdventurer(baseState);

      case 'may_put_deck_into_discard': // Chancellor
        return this.handleChancellor(baseState);

      case 'draw_to_7_set_aside_actions': // Library
        return this.handleLibrary(baseState);

      default:
        return baseState;
    }
  }

  private handleMoneylender(state: GameState): GameState {
    const player = state.players[state.currentPlayer];

    if (player.hand.includes('Copper')) {
      // Set pending effect to wait for trash_cards move
      return {
        ...state,
        pendingEffect: {
          card: 'Moneylender',
          effect: 'trash_copper'
        },
        gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} played Moneylender (may trash Copper for +$3)`]
      };
    } else {
      // No Copper, no effect - but card stays in play area
      return {
        ...state,
        gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} played Moneylender (no Copper to trash)`]
      };
    }
  }

  private handleFeast(state: GameState): GameState {
    // Trash Feast from play area (not hand, since it's already in play)
    return {
      ...state,
      trash: [...state.trash, 'Feast'],
      players: state.players.map((p, i) =>
        i === state.currentPlayer
          ? { ...p, inPlay: p.inPlay.filter(c => c !== 'Feast') }
          : p
      ),
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} played Feast (trashed, may gain card up to $5)`]
    };
  }

  private handleMilitia(state: GameState): GameState {
    // Militia already gave +$2 coins in standard effects
    // Attack resolves immediately - opponents must use discard_to_hand_size move if needed

    let newState = state;

    for (let i = 0; i < state.players.length; i++) {
      if (i === state.currentPlayer) continue; // Skip attacker

      // Check for Moat
      if (checkForMoatReveal(newState, i)) {
        newState = {
          ...newState,
          gameLog: [...newState.gameLog, `Player ${i + 1} revealed Moat and blocked Militia`]
        };
      }
    }

    return {
      ...newState,
      gameLog: [...newState.gameLog, `Player ${newState.currentPlayer + 1} played Militia (+$2, opponents discard to 3)`]
    };
  }

  private handleWitch(state: GameState): GameState {
    // Witch already drew +2 cards in standard effects
    // Now apply attack: each other player gains a Curse
    const attackedState = resolveAttack(state, (s, playerIndex) => {
      try {
        return gainCard(s, 'Curse', 'discard', playerIndex);
      } catch {
        // No Curses left in supply
        return s;
      }
    });

    return {
      ...attackedState,
      gameLog: [...attackedState.gameLog, `Player ${attackedState.currentPlayer + 1} played Witch`]
    };
  }

  private handleBureaucrat(state: GameState): GameState {
    // Gain Silver onto deck
    let newState = state;
    try {
      newState = gainCard(newState, 'Silver', 'topdeck');
    } catch {
      // No Silver in supply
    }

    // Attack: each other player topdecks a Victory card from hand
    const attackedState = resolveAttack(newState, (s, playerIndex) => {
      const targetPlayer = s.players[playerIndex];
      const victoryCards = targetPlayer.hand.filter(c => isVictoryCard(c));

      if (victoryCards.length === 0) {
        // Reveal hand (no Victory cards)
        return {
          ...s,
          gameLog: [...s.gameLog, `Player ${playerIndex + 1} revealed hand (no Victory cards)`]
        };
      }

      // Topdeck first Victory card found
      const victoryCard = victoryCards[0];
      const newHand = [...targetPlayer.hand];
      const cardIndex = newHand.indexOf(victoryCard);
      if (cardIndex !== -1) {
        newHand.splice(cardIndex, 1);
      }

      return {
        ...s,
        players: s.players.map((p, i) =>
          i === playerIndex
            ? { ...p, hand: newHand, drawPile: [victoryCard, ...p.drawPile] }
            : p
        ),
        gameLog: [...s.gameLog, `Player ${playerIndex + 1} topdecked ${victoryCard} (Bureaucrat attack)`]
      };
    });

    return {
      ...attackedState,
      gameLog: [...attackedState.gameLog, `Player ${attackedState.currentPlayer + 1} played Bureaucrat`]
    };
  }

  private handleAdventurer(state: GameState): GameState {
    const player = state.players[state.currentPlayer];
    let currentDeck = [...player.drawPile];
    let currentDiscard = [...player.discardPile];
    const revealed: CardName[] = [];
    const treasures: CardName[] = [];

    // Reveal cards until 2 Treasures found
    while (treasures.length < 2) {
      // Reshuffle if needed
      if (currentDeck.length === 0) {
        if (currentDiscard.length === 0) break; // No more cards
        currentDeck = [...this.random.shuffle(currentDiscard)];
        currentDiscard = [];
      }

      if (currentDeck.length > 0) {
        const card = currentDeck[0];
        currentDeck = currentDeck.slice(1);
        revealed.push(card);

        if (isTreasureCard(card)) {
          treasures.push(card);
        }
      } else {
        break;
      }
    }

    // Put Treasures in hand, discard others
    const others = revealed.filter(c => !treasures.includes(c));

    return {
      ...state,
      players: state.players.map((p, i) =>
        i === state.currentPlayer
          ? {
              ...p,
              hand: [...p.hand, ...treasures],
              drawPile: currentDeck,
              discardPile: [...currentDiscard, ...others]
            }
          : p
      ),
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} revealed ${revealed.length} cards, found ${treasures.length} Treasures (Adventurer)`]
    };
  }

  private handleChancellor(state: GameState): GameState {
    // Chancellor already gave +$2 coins in standard effects
    // For now, auto-decline deck-to-discard option (requires user choice)
    return {
      ...state,
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} played Chancellor (+$2)`]
    };
  }

  private handleLibrary(state: GameState): GameState {
    const player = state.players[state.currentPlayer];
    let currentHand = [...player.hand];
    let currentDeck = [...player.drawPile];
    let currentDiscard = [...player.discardPile];
    const setAside: CardName[] = [];

    // Draw until hand has 7 cards
    while (currentHand.length < 7) {
      // Reshuffle if needed
      if (currentDeck.length === 0) {
        if (currentDiscard.length === 0) break; // No more cards
        currentDeck = [...this.random.shuffle(currentDiscard)];
        currentDiscard = [];
      }

      if (currentDeck.length > 0) {
        const card = currentDeck[0];
        currentDeck = currentDeck.slice(1);

        if (isActionCard(card)) {
          // Set aside Action cards (for now, auto set-aside all Actions)
          setAside.push(card);
        } else {
          currentHand.push(card);
        }
      } else {
        break;
      }
    }

    // Discard set-aside cards
    currentDiscard = [...currentDiscard, ...setAside];

    return {
      ...state,
      players: state.players.map((p, i) =>
        i === state.currentPlayer
          ? { ...p, hand: currentHand, drawPile: currentDeck, discardPile: currentDiscard }
          : p
      ),
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} drew to 7 cards (Library), set aside ${setAside.length} Actions`]
    };
  }

  private handleSpy(state: GameState): GameState {
    // Spy already drew +1 card and gave +1 action in standard effects
    // Each player (including attacker) reveals top card of deck
    // Attacker decides whether each revealed card is discarded or returned to top
    // Cards stay on deck until spy_decision is made

    let newState = state;

    for (let i = 0; i < state.players.length; i++) {
      // Skip if Moat blocks (except attacker)
      if (i !== state.currentPlayer && checkForMoatReveal(newState, i)) {
        newState = {
          ...newState,
          gameLog: [...newState.gameLog, `Player ${i + 1} revealed Moat and blocked Spy`]
        };
      }
    }

    return {
      ...newState,
      gameLog: [...newState.gameLog, `Player ${newState.currentPlayer + 1} played Spy (revealing top cards)`]
    };
  }

  private handleSpyDecision(state: GameState, playerIndex: number, card: CardName, keepOnTop: boolean): GameState {
    const player = state.players[playerIndex];

    // Validate card is on top of deck
    if (player.drawPile.length === 0) {
      throw new Error(`Player ${playerIndex + 1} has no cards in deck`);
    }

    if (player.drawPile[0] !== card) {
      throw new Error(`Card ${card} is not on top of Player ${playerIndex + 1}'s deck (top card is ${player.drawPile[0]})`);
    }

    if (keepOnTop) {
      // Keep card on top of deck (no change needed)
      return {
        ...state,
        gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} kept ${card} on top of Player ${playerIndex + 1}'s deck`]
      };
    } else {
      // Discard the card
      return {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                drawPile: p.drawPile.slice(1),
                discardPile: [...p.discardPile, card]
              }
            : p
        ),
        gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} discarded ${card} from Player ${playerIndex + 1}'s deck`]
      };
    }
  }

  private handleThief(state: GameState): GameState {
    // Each opponent reveals top 2 cards
    // Cards stay revealed until attacker makes decision via select_treasure_to_trash

    let newState = state;

    for (let i = 0; i < state.players.length; i++) {
      if (i === state.currentPlayer) continue; // Skip attacker

      // Check for Moat
      if (checkForMoatReveal(newState, i)) {
        newState = {
          ...newState,
          gameLog: [...newState.gameLog, `Player ${i + 1} revealed Moat and blocked Thief`]
        };
      }
    }

    return {
      ...newState,
      gameLog: [...newState.gameLog, `Player ${newState.currentPlayer + 1} played Thief (revealing 2 cards from each opponent)`]
    };
  }

  private handleThiefTrashTreasure(state: GameState, treasure: CardName): GameState {
    // Trash the selected treasure from an opponent's revealed cards
    if (!isTreasureCard(treasure)) {
      throw new Error(`${treasure} is not a Treasure`);
    }

    // Find which opponent has this treasure in top 2 cards
    let newState = state;
    let found = false;

    for (let i = 0; i < state.players.length; i++) {
      if (i === state.currentPlayer) continue; // Skip attacker

      const player = state.players[i];
      const revealed = player.drawPile.slice(0, 2);

      if (revealed.includes(treasure)) {
        // Trash this treasure, discard the other revealed card
        const otherCards = revealed.filter(c => c !== treasure);

        newState = {
          ...newState,
          trash: [...newState.trash, treasure],
          players: newState.players.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  drawPile: p.drawPile.slice(2),
                  discardPile: [...p.discardPile, ...otherCards]
                }
              : p
          ),
          gameLog: [...newState.gameLog, `Player ${state.currentPlayer + 1} trashed ${treasure} from Player ${i + 1}`]
        };
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`${treasure} not found in any opponent's revealed cards`);
    }

    return newState;
  }

  private handleGainFromTrash(state: GameState, card: CardName): GameState {
    // Gain a card from trash to discard pile
    if (!state.trash.includes(card)) {
      throw new Error(`${card} is not in the trash`);
    }

    const newTrash = [...state.trash];
    const cardIndex = newTrash.indexOf(card);
    if (cardIndex !== -1) {
      newTrash.splice(cardIndex, 1);
    }

    return {
      ...state,
      trash: newTrash,
      players: state.players.map((p, i) =>
        i === state.currentPlayer
          ? { ...p, discardPile: [...p.discardPile, card] }
          : p
      )
    };
  }

  private handleThroneRoomSelection(state: GameState, actionCard: CardName): GameState {
    if (!isActionCard(actionCard)) {
      throw new Error(`${actionCard} is not an Action card`);
    }

    const player = state.players[state.currentPlayer];
    if (!player.hand.includes(actionCard)) {
      throw new Error(`${actionCard} not in hand`);
    }

    // Play the action twice
    let newState = state;

    // First play
    let firstPlay = this.playActionCard(newState, actionCard);
    newState = firstPlay;

    // Second play (if still in hand or play area)
    const updatedPlayer = newState.players[newState.currentPlayer];
    if (updatedPlayer.hand.includes(actionCard) || updatedPlayer.inPlay.includes(actionCard)) {
      let secondPlay = this.playActionCard(newState, actionCard);
      newState = secondPlay;
    }

    return newState;
  }

  private handleChancellorDecision(state: GameState, putDeckIntoDiscard: boolean): GameState {
    if (!putDeckIntoDiscard) {
      // Do nothing, just clear pending effect
      return {
        ...state,
        pendingEffect: undefined
      };
    }

    // Put entire deck into discard pile
    return {
      ...state,
      players: state.players.map((p, i) =>
        i === state.currentPlayer
          ? {
              ...p,
              drawPile: [],
              discardPile: [...p.discardPile, ...p.drawPile]
            }
          : p
      ),
      pendingEffect: undefined,
      gameLog: [...state.gameLog, `Player ${state.currentPlayer + 1} put deck into discard (Chancellor)`]
    };
  }

  private handleLibrarySetAside(state: GameState, card: CardName): GameState {
    // Set aside an Action card drawn by Library
    if (!isActionCard(card)) {
      throw new Error(`${card} is not an Action card`);
    }

    const player = state.players[state.currentPlayer];
    if (!player.hand.includes(card)) {
      throw new Error(`${card} not in hand`);
    }

    // Move from hand to discard
    const newHand = [...player.hand];
    const cardIndex = newHand.indexOf(card);
    if (cardIndex !== -1) {
      newHand.splice(cardIndex, 1);
    }

    return {
      ...state,
      players: state.players.map((p, i) =>
        i === state.currentPlayer
          ? {
              ...p,
              hand: newHand,
              discardPile: [...p.discardPile, card]
            }
          : p
      )
    };
  }

  private handleDiscardToHandSize(state: GameState, cards: ReadonlyArray<CardName>): GameState {
    // Discard specified cards from a player's hand
    // Used for Militia attack and similar effects
    // For now, assumes next player (player 1) if not current player
    // In full implementation, would track which player via pendingEffect

    const targetPlayerIndex = (state.currentPlayer + 1) % state.players.length;
    const player = state.players[targetPlayerIndex];

    // Validate all cards are in hand
    const handCounts = new Map<CardName, number>();
    player.hand.forEach(card => {
      handCounts.set(card, (handCounts.get(card) || 0) + 1);
    });

    const discardCounts = new Map<CardName, number>();
    cards.forEach(card => {
      discardCounts.set(card, (discardCounts.get(card) || 0) + 1);
    });

    for (const [card, count] of discardCounts) {
      if ((handCounts.get(card) || 0) < count) {
        throw new Error(`Cannot discard ${count} ${card}(s), only have ${handCounts.get(card) || 0}`);
      }
    }

    // Remove cards from hand
    const newHand = [...player.hand];
    cards.forEach(cardToDiscard => {
      const index = newHand.indexOf(cardToDiscard);
      if (index !== -1) {
        newHand.splice(index, 1);
      }
    });

    return {
      ...state,
      players: state.players.map((p, i) =>
        i === targetPlayerIndex
          ? { ...p, hand: newHand, discardPile: [...p.discardPile, ...cards] }
          : p
      ),
      gameLog: [...state.gameLog, `Player ${targetPlayerIndex + 1} discarded ${cards.length} cards`]
    };
  }

  private handleRevealAndTopdeck(state: GameState, card: CardName): GameState {
    // Move a Victory card from hand to top of deck (Bureaucrat attack)
    if (!isVictoryCard(card)) {
      throw new Error(`${card} is not a Victory card`);
    }

    const targetPlayerIndex = (state.currentPlayer + 1) % state.players.length;
    const player = state.players[targetPlayerIndex];

    if (!player.hand.includes(card)) {
      throw new Error(`${card} not in hand`);
    }

    // Remove from hand
    const newHand = [...player.hand];
    const cardIndex = newHand.indexOf(card);
    if (cardIndex !== -1) {
      newHand.splice(cardIndex, 1);
    }

    return {
      ...state,
      players: state.players.map((p, i) =>
        i === targetPlayerIndex
          ? { ...p, hand: newHand, drawPile: [card, ...p.drawPile] }
          : p
      ),
      gameLog: [...state.gameLog, `Player ${targetPlayerIndex + 1} topdecked ${card} (Bureaucrat attack)`]
    };
  }

  checkGameOver(state: GameState): Victory {
    const supply = state.supply;
    
    // Game ends if Province pile is empty
    if ((supply.get('Province') || 0) <= 0) {
      return this.calculateWinner(state);
    }
    
    // Game ends if any 3 piles are empty
    let emptyPiles = 0;
    for (const count of supply.values()) {
      if (count <= 0) emptyPiles++;
    }
    
    if (emptyPiles >= 3) {
      return this.calculateWinner(state);
    }
    
    return { isGameOver: false };
  }

  private calculateWinner(state: GameState): Victory {
    const scores = state.players.map(player => {
      const allCards = getAllPlayerCards(player.drawPile, player.hand, player.discardPile);
      return calculateScore(allCards);
    });

    const maxScore = Math.max(...scores);
    const winner = scores.indexOf(maxScore);

    return {
      isGameOver: true,
      winner,
      scores
    };
  }

  getValidMoves(state: GameState, playerIndex?: number): Move[] {
    // For backward compatibility, use currentPlayer if playerIndex not provided
    const player = state.players[playerIndex ?? state.currentPlayer];
    const moves: Move[] = [];

    switch (state.phase) {
      case 'action':
        // Can play action cards if we have actions
        if (player.actions > 0) {
          const actionCards = player.hand.filter(card => isActionCard(card));
          actionCards.forEach(card => {
            moves.push({ type: 'play_action', card });
          });
        }

        // Can always end action phase
        moves.push({ type: 'end_phase' });
        break;

      case 'buy': {
        // Can play treasure cards
        const treasureCards = player.hand.filter(card => isTreasureCard(card));
        treasureCards.forEach(card => {
          moves.push({ type: 'play_treasure', card });
        });

        // Can buy cards if we have buys
        if (player.buys > 0) {
          for (const [cardName, count] of state.supply) {
            if (count > 0 && player.coins >= getCard(cardName).cost) {
              moves.push({ type: 'buy', card: cardName });
            }
          }
        }

        // Can always end buy phase
        moves.push({ type: 'end_phase' });
        break;
      }

      case 'cleanup':
        // Only option is to end cleanup (which triggers cleanup logic)
        moves.push({ type: 'end_phase' });
        break;
    }

    return moves;
  }
}