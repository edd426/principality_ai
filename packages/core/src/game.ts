import { GameState, PlayerState, Move, GameResult, Victory, CardName, GameOptions } from './types';
import { getCard, isActionCard, isTreasureCard } from './cards';
import { SeededRandom, createStartingDeck, createDefaultSupply, calculateScore, getAllPlayerCards } from './utils';

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
      gameLog: ['Game started']
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

  getValidMoves(state: GameState): Move[] {
    const player = state.players[state.currentPlayer];
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