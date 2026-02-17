/**
 * AI Decision Prompt Engineering
 *
 * Builds structured prompts for Claude API to make Dominion game decisions.
 * System prompt covers rules and strategy; user prompt presents current state.
 *
 * @req AI-002 - AI decision context and reasoning
 * @req AI-004 - Structured prompt format for Claude API
 */

import type { Move } from '@principality/core';
import type { AIDecisionContext, ClaudeResponse } from '../types/ai';

// =============================================================================
// System Prompt
// =============================================================================

/**
 * Build the system prompt with game rules, strategy, and response format.
 * This is static and reused across all turns.
 *
 * @req AI-004.1 - Game rules
 * @req AI-004.2 - JSON response format
 * @req AI-004.3 - Strategy guidance
 */
export function buildSystemPrompt(): string {
  return `You are an expert Dominion card game player. You are playing as the AI opponent in a 2-player game.

## Game Rules

Dominion is a deck-building card game. Each turn has three phases:
1. **Action Phase**: Play action cards from your hand (you start with 1 action per turn)
2. **Buy Phase**: First play treasure cards for coins, then buy cards from the supply
3. **Cleanup Phase**: Discard hand and in-play cards, draw 5 new cards

### Card Types
- **Treasure**: Copper (+1 coin), Silver (+2 coins), Gold (+3 coins)
- **Victory**: Estate (1 VP), Duchy (3 VP), Province (6 VP)
- **Action**: Kingdom cards with various effects (+cards, +actions, +buys, +coins, attacks)
- **Curse**: -1 VP

### Game End
The game ends when the Province pile is empty OR any 3 supply piles are empty.
The player with the most Victory Points wins.

### Starting Deck
Each player starts with 7 Copper and 3 Estate cards.

## Strategy Guidelines

**General Priorities**:
- Province ($8+) is the primary victory condition - buy when you can afford it
- Gold ($6+) is the best treasure - prioritize buying it
- Silver ($3+) is solid economy - buy early game
- Action cards that give +Cards and +Actions (like Village, Laboratory) enable combos
- Avoid buying Copper (it dilutes your deck)
- Late game: consider Duchy ($5) when Provinces are running low (4 or fewer left)

**Phase-Specific**:
- Action Phase: Play cards that give +Actions first, then +Cards, then terminal actions
- Buy Phase: Play ALL treasures before buying. Buy the best card you can afford
- If you have no useful actions, end the Action phase

## Response Format

You MUST respond with a single JSON object (no markdown, no explanation outside JSON):

{
  "moveType": "play_action" | "play_treasure" | "buy" | "end_phase" | "discard_to_hand_size" | "reveal_and_topdeck" | "cellar_discard" | "chapel_trash" | "remodel_trash" | "remodel_gain" | "mine_trash" | "mine_gain" | "workshop_gain" | "feast_gain" | "throne_room_select" | "library_decision" | "chancellor_decision" | "spy_decision" | "moneylender_trash",
  "card": "CardName",
  "cards": ["CardName1", "CardName2"],
  "reasoning": "Brief explanation of your decision"
}

- Use "card" for single-card moves (play_action, play_treasure, buy, etc.)
- Use "cards" for multi-card moves (discard_to_hand_size, cellar_discard, chapel_trash)
- "reasoning" is required and should be 1-2 sentences
- Only choose moves from the valid moves list provided`;
}

// =============================================================================
// User Prompt
// =============================================================================

/**
 * Build the user prompt with current game state for a specific decision.
 *
 * @req AI-002.1 - Current hand
 * @req AI-002.2 - Available resources
 * @req AI-002.3 - Valid moves
 * @req AI-002.4 - Supply state
 * @req AI-002.5 - Phase and turn number
 * @req AI-002.6 - Kingdom cards
 */
export function buildUserPrompt(context: AIDecisionContext): string {
  const {
    phase,
    turnNumber,
    hand,
    resources,
    validMoves,
    playedThisTurn,
    kingdomCards,
    gameState,
  } = context;

  const sections: string[] = [];

  // Turn context
  sections.push(`## Turn ${turnNumber} - ${capitalize(phase)} Phase`);

  // Hand
  if (hand.length > 0) {
    const grouped = groupCards(hand);
    sections.push(`**Your Hand**: ${formatGroupedCards(grouped)}`);
  } else {
    sections.push(`**Your Hand**: (empty)`);
  }

  // Resources
  sections.push(
    `**Resources**: ${resources.actions} Action(s), ${resources.buys} Buy(s), ${resources.coins} Coin(s)`
  );

  // Cards played this turn
  if (playedThisTurn.length > 0) {
    sections.push(`**Played This Turn**: ${playedThisTurn.join(', ')}`);
  }

  // Supply state
  sections.push(formatSupply(gameState.supply, kingdomCards));

  // Province count for strategic context
  const provinceCount = gameState.supply.get('Province') ?? 0;
  if (provinceCount <= 4) {
    sections.push(`**Warning**: Only ${provinceCount} Province(s) remaining!`);
  }

  // Valid moves
  sections.push(formatValidMoves(validMoves));

  return sections.join('\n\n');
}

// =============================================================================
// Response Parsing
// =============================================================================

/**
 * Parse Claude's response text into a validated move.
 * Returns null if response is invalid or move is not in valid moves list.
 *
 * @req AI-002.7 - Parse response into Move
 */
export function parseClaudeResponse(
  responseText: string,
  validMoves: Move[]
): { move: Move; reasoning: string } | null {
  // Try to extract JSON from response (handle markdown code blocks)
  const jsonStr = extractJson(responseText);
  if (!jsonStr) return null;

  let parsed: ClaudeResponse;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  // Validate required fields
  if (!parsed.moveType) return null;

  // Build move from parsed response
  const move = buildMoveFromResponse(parsed);
  if (!move) return null;

  // Validate move is in the valid moves list
  if (!isMoveInValidList(move, validMoves)) return null;

  return {
    move,
    reasoning: parsed.reasoning || 'No reasoning provided.',
  };
}

// =============================================================================
// Internal Helpers
// =============================================================================

function extractJson(text: string): string | null {
  // Try direct parse first
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;

  // Try extracting from markdown code block
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try finding JSON object in text
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return null;
}

function buildMoveFromResponse(parsed: ClaudeResponse): Move | null {
  const move: Move = { type: parsed.moveType as Move['type'] };

  if (parsed.card) {
    move.card = parsed.card;
  }

  if (parsed.cards && Array.isArray(parsed.cards)) {
    move.cards = parsed.cards;
  }

  return move;
}

function isMoveInValidList(move: Move, validMoves: Move[]): boolean {
  return validMoves.some((valid) => {
    if (valid.type !== move.type) return false;

    // For card-specific moves, check card name
    if (valid.card !== undefined || move.card !== undefined) {
      if (valid.card !== move.card) return false;
    }

    // For multi-card moves, check cards array
    if (valid.cards !== undefined || move.cards !== undefined) {
      const validCards = valid.cards ?? [];
      const moveCards = move.cards ?? [];
      if (validCards.length !== moveCards.length) return false;
      const sortedValid = [...validCards].sort();
      const sortedMove = [...moveCards].sort();
      return sortedValid.every((c, i) => c === sortedMove[i]);
    }

    return true;
  });
}

function groupCards(cards: string[]): Map<string, number> {
  const grouped = new Map<string, number>();
  for (const card of cards) {
    grouped.set(card, (grouped.get(card) || 0) + 1);
  }
  return grouped;
}

function formatGroupedCards(grouped: Map<string, number>): string {
  const parts: string[] = [];
  for (const [card, count] of grouped) {
    parts.push(count > 1 ? `${card} x${count}` : card);
  }
  return parts.join(', ');
}

function formatSupply(supply: ReadonlyMap<string, number>, kingdomCards: string[]): string {
  const lines: string[] = ['**Supply**:'];

  // Victory cards
  const victoryCards = ['Estate', 'Duchy', 'Province'];
  const victoryLine = victoryCards
    .map((card) => `${card}: ${supply.get(card) ?? 0}`)
    .join(', ');
  lines.push(`  Victory: ${victoryLine}`);

  // Treasure cards
  const treasureCards = ['Copper', 'Silver', 'Gold'];
  const treasureLine = treasureCards
    .map((card) => `${card}: ${supply.get(card) ?? 0}`)
    .join(', ');
  lines.push(`  Treasure: ${treasureLine}`);

  // Curse
  const curseCount = supply.get('Curse') ?? 0;
  if (curseCount > 0) {
    lines.push(`  Curse: ${curseCount}`);
  }

  // Kingdom cards
  const kingdomLine = kingdomCards
    .map((card) => `${card}: ${supply.get(card) ?? 0}`)
    .join(', ');
  lines.push(`  Kingdom: ${kingdomLine}`);

  return lines.join('\n');
}

function formatValidMoves(moves: Move[]): string {
  const lines: string[] = ['**Valid Moves**:'];

  for (const move of moves) {
    let desc = move.type;
    if (move.card) {
      desc += ` ${move.card}`;
    }
    if (move.cards && move.cards.length > 0) {
      desc += ` [${move.cards.join(', ')}]`;
    }
    lines.push(`  - ${desc}`);
  }

  return lines.join('\n');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
