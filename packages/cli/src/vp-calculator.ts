import { PlayerState, CardName } from '@principality/core';

/**
 * Calculate victory points for a player from their entire deck
 * Includes cards in: hand, drawPile, discardPile, and inPlay
 */
export function calculateVictoryPoints(player: PlayerState | undefined | null): number {
  if (!player) {
    return 0;
  }

  // Collect all cards from all zones
  const allCards: CardName[] = [
    ...player.hand,
    ...player.drawPile,
    ...player.discardPile,
    ...player.inPlay
  ];

  let vp = 0;

  // Count victory points from each card
  allCards.forEach(card => {
    if (card === 'Estate') {
      vp += 1;
    } else if (card === 'Duchy') {
      vp += 3;
    } else if (card === 'Province') {
      vp += 6;
    }
  });

  return vp;
}

/**
 * Format victory points display with breakdown
 * Returns compact format: "5 VP (3E, 1D)" or "0 VP"
 */
export function formatVPDisplay(player: PlayerState | undefined | null): string {
  if (!player) {
    return '0 VP';
  }

  const allCards: CardName[] = [
    ...player.hand,
    ...player.drawPile,
    ...player.discardPile,
    ...player.inPlay
  ];

  let estates = 0;
  let duchies = 0;
  let provinces = 0;

  allCards.forEach(card => {
    if (card === 'Estate') estates++;
    else if (card === 'Duchy') duchies++;
    else if (card === 'Province') provinces++;
  });

  const totalVP = estates * 1 + duchies * 3 + provinces * 6;

  if (totalVP === 0) {
    return '0 VP';
  }

  const parts: string[] = [];
  if (estates > 0) parts.push(`${estates}E`);
  if (duchies > 0) parts.push(`${duchies}D`);
  if (provinces > 0) parts.push(`${provinces}P`);

  return `${totalVP} VP (${parts.join(', ')})`;
}

/**
 * Format victory points display in expanded format
 * Returns: "5 Victory Points (2 Estates, 1 Duchy)"
 */
export function formatVPDisplayExpanded(player: PlayerState | undefined | null): string {
  if (!player) {
    return '0 Victory Points';
  }

  const allCards: CardName[] = [
    ...player.hand,
    ...player.drawPile,
    ...player.discardPile,
    ...player.inPlay
  ];

  let estates = 0;
  let duchies = 0;
  let provinces = 0;

  allCards.forEach(card => {
    if (card === 'Estate') estates++;
    else if (card === 'Duchy') duchies++;
    else if (card === 'Province') provinces++;
  });

  const totalVP = estates * 1 + duchies * 3 + provinces * 6;

  if (totalVP === 0) {
    return '0 Victory Points';
  }

  const parts: string[] = [];
  if (estates > 0) {
    parts.push(`${estates} ${estates === 1 ? 'Estate' : 'Estates'}`);
  }
  if (duchies > 0) {
    parts.push(`${duchies} ${duchies === 1 ? 'Duchy' : 'Duchies'}`);
  }
  if (provinces > 0) {
    parts.push(`${provinces} ${provinces === 1 ? 'Province' : 'Provinces'}`);
  }

  return `${totalVP} Victory Points (${parts.join(', ')})`;
}
