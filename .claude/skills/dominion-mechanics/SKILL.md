---
name: dominion-mechanics
description: Comprehensive guide to Dominion MVP game mechanics, card syntax, phase structure, and decision frameworks. Use when learning game rules, confused about phase flow, receiving invalid move errors, or needing card information.
---

# Dominion Mechanics Guide

## Overview

This skill explains the core mechanics of the Dominion card game, focusing on the MVP implementation with 8 kingdom cards and the fundamental rules that Claude must understand to play effectively.

## Table of Contents

1. [Game Flow: Three Phase Turn Structure](#game-flow-three-phase-turn-structure)
2. [Core Misconception: Treasures Must Be PLAYED](#core-misconception-treasures-must-be-played)
3. [Coin Generation](#coin-generation)
4. [Action Economy](#action-economy)
5. [Command Reference](#command-reference)
6. [Phase-by-Phase Decision Making](#phase-by-phase-decision-making)
7. [Victory Points and Scoring](#victory-points-and-scoring)
8. [Supply Piles](#supply-piles)
9. [Common Mistakes & Recovery](#common-mistakes--recovery)
10. [Decision Framework](#decision-framework)
11. [Quick Reference: All 15 Cards](#quick-reference-all-15-cards)
12. [Auto-Invocation Triggers](#auto-invocation-triggers)
13. [Common Syntax Errors](#common-syntax-errors)
14. [Phase Checklist](#phase-checklist)
15. [Detailed Card Information](#detailed-card-information)
16. [Troubleshooting Guide](#troubleshooting-guide)

## Game Flow: Three Phase Turn Structure

Every turn follows this exact sequence:

1. **Action Phase**: You have 1 action. Play action cards (cards that say "+1 action" or similar).
2. **Buy Phase**: You have 1 buy. Play treasure cards to generate coins, then buy cards from supply.
3. **Cleanup Phase**: Discard all cards in hand and played cards. Draw 5 new cards.

The game ends when the Province pile is empty OR any 3 supply piles are empty.

## Core Misconception: Treasures Must Be PLAYED

**Critical Rule**: Treasures in your hand do NOT automatically give you coins. You must PLAY them to generate coins.

For example:
- If you have 2 Copper cards in hand, you have 0 coins until you PLAY them
- Playing 2 Copper gives you 2 coins
- Playing 1 Silver (if you have it) gives you 2 coins

This is the #1 mistake Claude makes - thinking treasures generate coins just by being in hand.

## Coin Generation

Your buying power comes from playing treasures in the Buy phase:
- Copper (0 cost): +1 coin
- Silver (3 cost): +2 coins
- Gold (6 cost): +3 coins

Example: If you play 2 Copper + 1 Silver, you get 1+1+2 = 4 coins total.

## Action Economy

Some action cards provide "+1 action", meaning you can play another action card:
- Village (+1 card, +2 actions): Lets you play 2 action cards total
- Smithy (+3 cards): Draws 3 cards (no actions)
- Market (+1 card, +1 action, +1 buy, +1 coin): Utility card

The "action" resource is crucial for playing multiple powerful cards.

## Command Reference

### Play Command - Multiple Syntaxes

**Syntax Option 1: By Index (Auto-Detects Card Type)**
- **Syntax**: `play 0` (where 0 is the index of the card in your hand)
- **Usage**: Works in any phase - automatically determines if card is action or treasure
- **Example**:
  - If your hand shows "[0] Village (action), [1] Copper (treasure)"
  - `play 0` in action phase → plays action card
  - `play 1` in buy phase → plays treasure card automatically
- **Benefit**: Single command works everywhere; system detects card type

**Syntax Option 2: Explicit Action Card**
- **Syntax**: `play_action CardName` (explicit for action cards)
- **Usage**: Clearer intent, explicitly plays an action card by name
- **Example**: `play_action Village` plays the Village card from your hand
- **Valid in**: Action phase only

**Syntax Option 3: Explicit Treasure Card**
- **Syntax**: `play_treasure CardName` (explicit for treasure cards)
- **Usage**: Plays a treasure to generate coins
- **Example**: `play_treasure Copper` generates 1 coin
- **Valid in**: Buy phase only

**Recommendation**: Use `play 0` for simplicity. System auto-detects the card type and handles it correctly.

### Buy Command
- **Syntax**: `buy CardName` (card name must match exactly)
- **Usage**: Used in Buy phase to buy cards from supply
- **Example**: "buy Silver" purchases a Silver card
- **Valid cards**: Copper, Silver, Gold, Estate, Duchy, Province, Village, Smithy, Market

### End Command
- **Syntax**: `end`
- **Usage**: End current phase and move to next phase
- **In Action phase**: Ends action phase, moves to Buy phase
- **In Buy phase**: Ends buy phase, moves to Cleanup phase
- **In Cleanup phase**: Completes turn

## Phase-by-Phase Decision Making

### Action Phase
- **Goal**: Play action cards to draw more cards or generate actions
- **What to do**: If you have action cards, decide which to play
- **When to end**: When you run out of useful actions to play
- **Important**: Don't play treasures in action phase - save them for buy phase
- **Check**: After each action card played, count remaining actions shown in game state

### Buy Phase
- **Goal**: Spend your coins wisely on cards that improve your deck
- **Steps**:
  1. Play all your treasure cards to generate coins
  2. Count your total coins displayed
  3. Decide what card to buy based on coins available
  4. Execute the buy using exact card name
  5. Verify purchase succeeded
- **When to end**: When you've used your buy (1 buy per turn by default)
- **Coins**: Only count coins from played treasures, not cards in hand
- **Multiple treasures**: Play each treasure separately or together (result is same)

### Cleanup Phase
- **Automatic**: You don't choose moves
- **What happens**: All cards in hand and played cards go to discard pile
- **Then**: You draw exactly 5 new cards for next turn
- **Deck building**: Your deck now includes any card you bought this turn

## Victory Points and Scoring

Victory point cards:
- Estate (2 cost): 1 VP
- Duchy (5 cost): 3 VP
- Province (8 cost): 6 VP

At game end, count all VP cards in your entire deck (hand + discard + deck). Highest total wins.

**Strategy**: Early game you buy treasures (Copper, Silver, Gold) to increase buying power. Late game you buy VP cards (Estates, Duchies, Provinces).

## Supply Piles

The supply displays available cards to buy. Each card type has a pile with a limited number of cards (depends on game setup). When a pile reaches 0, it's empty.

**Game end**: When Province pile is empty OR any 3 piles are empty, the game ends immediately.

## Common Mistakes & Recovery

### Mistake 1: Index-based plays using wrong syntax
- **Error**: You try "play 0" but it doesn't work or returns wrong result
- **Recovery**: Verify you're using just `play 0` (index), not the card name
- **Fix**: The system automatically detects if card at index 0 is action or treasure
- **Why it happened**: Old parser couldn't auto-detect card type; new parser can

### Mistake 2: Trying to play in wrong phase
- **Error**: You try action card commands when in Buy phase
- **Recovery**: Immediately say "I should be playing treasures first. Let me do that."
- **Fix**: Use "play_treasure CardName" or "play N" to play treasures first

### Mistake 3: Playing treasures in Action phase
- **Error**: "play_treasure Copper" when you're in action phase
- **Recovery**: Remember treasures go in Buy phase, not Action
- **Fix**: End the action phase first ("end"), then play treasures in Buy phase

### Mistake 4: Wrong card names
- **Error**: "buy Silvers" (plural) or "buy silver" (lowercase)
- **Recovery**: Check exact card name - "buy Silver" (exact name, title case)
- **Fix**: Use correct capitalization

### Mistake 5: Insufficient coins
- **Error**: "buy Province" when you only have 5 coins (need 8)
- **Recovery**: Count played treasures again or choose cheaper card
- **Fix**: Buy what you can afford (e.g., "buy Silver" for 3 coins)

### Mistake 6: Forgetting treasures need to be PLAYED
- **Error**: You think "I have 2 Copper in hand, so I have 2 coins" without playing them
- **Recovery**: In Buy phase, you must explicitly play treasures first to generate coins
- **Fix**: Before buying, play all treasures: `play 0`, `play 1`, `play 2`, etc.
- **Why it's easy to miss**: Unlike some games, coins don't generate automatically

## Decision Framework

### When You Have Action Cards
"Should I play this action card?"
1. Does it draw more cards? (better for finding treasures)
2. Does it give me more actions? (lets me play more cards)
3. Does it give me +1 buy? (lets me buy more cards)
- Answer: Usually YES - play action cards before ending action phase

### When You Have Coins in Buy Phase
"What should I buy?"
1. If I have 6+ coins: Consider buying Gold (improves treasure economy)
2. If I have 3+ coins: Consider buying Silver (improves treasure economy)
3. If I have 8+ coins: Consider buying Province (VP card, moves toward win)
4. If I have 2 coins: Buy Estate or save for later
- Answer: Early game prioritize treasures, late game buy VP

## Quick Reference: All 15 Cards

### Treasures
- Copper (0 cost, +1 coin): Base treasure
- Silver (3 cost, +2 coins): Tier 1 upgrade
- Gold (6 cost, +3 coins): Tier 2 upgrade

### Action Cards
- Village (3 cost, +1 card, +2 actions): Draw and actions
- Smithy (4 cost, +3 cards): Draw cards
- Market (5 cost, +1 card, +1 action, +1 buy, +1 coin): Versatile

### Victory Cards
- Estate (2 cost, 1 VP): Base VP
- Duchy (5 cost, 3 VP): Mid-tier VP
- Province (8 cost, 6 VP): High VP

### Miscellaneous
- Copper (starting card in hand)

## Auto-Invocation Triggers

This skill should be automatically injected when:
1. **Invalid move error**: You receive an error message like "Invalid move" or "Cannot play that card"
2. **Phase confusion**: You ask "What phase am I in?" or try to do something in the wrong phase
3. **Coin generation question**: You ask "How many coins do I have?" or seem confused about treasure mechanics
4. **Card reference questions**: You ask "Can I play this?" or "What does this card do?"

When these triggers occur, review the relevant section above to reorient yourself.

## Common Syntax Errors

| Mistake | Error Message | Solution |
|---------|---------------|----------|
| `play Village` | "Invalid move - use index" | Use `play 0` (index), not card name |
| `buy silver` | "Card not found" | Use exact name: `buy Silver` |
| `end` in Action phase | Proceeds to Buy phase | This is correct! |
| `buy Copper` when 0 coins | "Insufficient coins" | Count treasures played in Buy phase |

## Phase Checklist

**Action Phase**: Play action cards? Yes → keep playing. No → end.
**Buy Phase**: Play treasures → Count coins → Buy card → end.
**Cleanup**: Automatic.

Remember: Read the game state to know which phase you're in. It always displays "Phase: action", "Phase: buy", or "Phase: cleanup".

## Detailed Card Information

### Understanding Card Effects

When you see a card description like "Village: +1 card, +2 actions":
- **+1 card**: You draw 1 additional card from your deck to your hand
- **+2 actions**: You get 2 additional action points to play other action cards
- These happen WHEN you play the card, not before

Each card effect resolves sequentially. Play the card → See the effect → Use the resources.

### Card Availability

Not all cards are always available. Supply piles have limited quantities:
- Starting supply has 8 of most cards
- When you buy a card, it comes from that pile
- When a pile reaches 0, that card type is no longer buyable
- Check current supply before deciding to buy

### Action Card Chains

You can chain action cards to maximize their effects:
- Play Village (gives +2 actions) → Play Smithy (costs 1 action, gives +3 cards)
- This is more valuable than playing them separately
- But both approaches work mechanically

## Troubleshooting Guide

### "I can't afford what I want to buy"
Build your treasure deck first. Early game: buy Silver and Gold. These improve future turns.

### "I keep getting confused about phases"
Check game state display. It tells you the phase. If confused, say `end` to move to next phase.

### "How do I know if I'm winning?"
Your deck's VP cards matter at game end. Estates/Duchies/Provinces add VP. Higher VP wins.

### "What's the strategy?"
Early: Build treasures (Copper → Silver → Gold). Late: Buy victory cards (Estates → Duchies → Provinces).
