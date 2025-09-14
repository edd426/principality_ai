import { CardName } from './types';

export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.seed / Math.pow(2, 32);
  }

  shuffle<T>(array: ReadonlyArray<T>): ReadonlyArray<T> {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export function createStartingDeck(): ReadonlyArray<CardName> {
  return [
    'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper',
    'Estate', 'Estate', 'Estate'
  ];
}

export function createDefaultSupply(): ReadonlyMap<CardName, number> {
  return new Map([
    // Basic cards (always available)
    ['Copper', 60],
    ['Silver', 40],
    ['Gold', 30],
    ['Estate', 12],
    ['Duchy', 12],
    ['Province', 12],
    
    // Kingdom cards (MVP set - all 8 available)
    ['Village', 10],
    ['Smithy', 10],
    ['Laboratory', 10],
    ['Market', 10],
    ['Woodcutter', 10],
    ['Festival', 10],
    ['Council Room', 10],
    ['Cellar', 10]
  ]);
}

export function calculateScore(cards: ReadonlyArray<CardName>): number {
  let score = 0;
  for (const cardName of cards) {
    if (cardName === 'Estate') score += 1;
    else if (cardName === 'Duchy') score += 3;
    else if (cardName === 'Province') score += 6;
  }
  return score;
}

export function getAllPlayerCards(deck: ReadonlyArray<CardName>, hand: ReadonlyArray<CardName>, discard: ReadonlyArray<CardName>): ReadonlyArray<CardName> {
  return [...deck, ...hand, ...discard];
}