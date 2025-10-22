# MCP Gameplay Debugging: Why Claude Was Confused About Moves

## The Problem

Claude was confused about how to play treasures in the buy phase. The error messages and available information weren't clear enough for the AI to understand:

1. Claude saw `play_treasure` in the valid moves but the `game_execute` tool couldn't parse `play_treasure` commands
2. Claude was told "0 coins" but didn't understand it needed to play treasures first to generate coins
3. The hand didn't indicate which cards were treasures vs action cards
4. Error messages didn't clearly explain what moves were valid in the current phase

## Root Causes

### 1. Missing `play_treasure` Command Support
**File**: `packages/mcp-server/src/tools/game-execute.ts`

The core game engine's `getValidMoves()` returns moves of type `play_treasure` in the buy phase, but the MCP tool's move parser only supported:
- `play N` (for action cards)
- `buy CARD`
- `end`

The parser didn't know how to handle the `play_treasure` command that the game engine was advertising.

**Fix**: Added parsing for `play_treasure CARD` syntax:
```typescript
// Parse "play_treasure CARD" or "play treasure CARD"
if (trimmed.startsWith('play_treasure ') || trimmed.startsWith('play treasure ')) {
  const cardName = trimmed.includes('_')
    ? trimmed.substring('play_treasure '.length).trim()
    : trimmed.substring('play treasure '.length).trim();

  const normalizedName = cardName.charAt(0).toUpperCase() + cardName.slice(1);

  if (player.hand.includes(normalizedName)) {
    return { type: 'play_treasure', card: normalizedName };
  }
}
```

### 2. Unclear Hand Display
**File**: `packages/mcp-server/src/tools/game-observe.ts`

The hand was displayed as just card names with indices, with no indication of card type (treasure, action, victory).

**Fix**: Enhanced `formatHand()` to include card type:
```typescript
{
  index: 0,
  name: "Copper",
  type: "treasure"  // ← Now indicates this is a treasure
},
{
  index: 1,
  name: "Estate",
  type: "victory"
}
```

### 3. Missing Move Instructions
**File**: `packages/mcp-server/src/tools/game-observe.ts`

Valid moves weren't clearly described with the actual command syntax Claude should use.

**Fix**: Enhanced `formatValidMoves()` to include command examples:
```typescript
{
  type: "play_treasure",
  card: "Copper",
  description: "Play treasure card: Copper (generates coins)",
  command: "play_treasure Copper"  // ← Exact command to use
}
```

### 4. Poor Error Messages
**File**: `packages/mcp-server/src/tools/game-execute.ts`

Error suggestions didn't clearly explain the Dominion game flow.

**Fix**: Improved error messages:

Before:
```
Cannot play treasures outside buy phase
```

After:
```
Cannot play treasures in action phase. You're in action phase - play action cards or "end" to move to buy phase.
```

## Game Flow Clarification

The confusion stemmed from misunderstanding Dominion's turn structure:

```
ACTION PHASE (current player has 1 action, 0 coins, 1 buy)
├─ Play action cards (like Village, Smithy)
└─ Once actions exhausted → "end"

BUY PHASE (1 buy available)
├─ Play treasure cards to generate coins (required!)
│  └─ "play_treasure Copper" → +1 coin
│  └─ "play_treasure Copper" → +1 coin (now have 2 coins)
├─ Buy cards with generated coins
│  └─ "buy Silver" (costs 3 coins, or less)
└─ Once done buying → "end"

CLEANUP PHASE (automatic)
├─ Hand + played cards → discard pile
├─ Draw new 5-card hand
└─ Next player's turn
```

**Key insight Claude needed**: Treasures don't automatically generate coins. You must explicitly play them with `play_treasure CARD` to add their coin value to your available coins pool.

## Testing the Fix

After the changes, the workflow becomes:

1. **Game state shows**:
   ```
   Hand:
   - [0] Copper (treasure)
   - [1] Copper (treasure)
   - [2] Estate (victory)

   Phase: buy
   Valid Moves:
   - play_treasure Copper
   - play_treasure Copper
   - end
   ```

2. **Claude understands**:
   - "These Copper cards are treasures (not action cards)"
   - "I need to use `play_treasure Copper` to generate coins"
   - "Only then can I use `buy` to purchase cards"

3. **Clear command example**:
   ```
   game_execute(move="play_treasure Copper")
   → Success: +1 coin generated

   game_execute(move="play_treasure Copper")
   → Success: +1 coin generated (now have 2 coins total)

   game_execute(move="buy Silver")
   → Success: Silver purchased (costs 2 coins)
   ```

## Impact on AI Gameplay

With these fixes, Claude can now:

✅ Recognize which cards are treasures vs actions
✅ Understand that treasures must be played to generate coins
✅ Know exactly which command to use (`play_treasure CARD`)
✅ Follow the logical game flow without confusion
✅ See clear error messages if something goes wrong

The AI no longer gets stuck trying invalid commands or misunderstanding the game mechanics.

## Files Changed

1. **packages/mcp-server/src/tools/game-execute.ts**
   - Added `play_treasure` command parsing
   - Improved error suggestions and phase transition messages
   - Better guidance for valid moves in each phase

2. **packages/mcp-server/src/tools/game-observe.ts**
   - Enhanced hand display with card types
   - Added command examples to valid moves
   - Better descriptions of move effects

## Future Improvements

To make this even clearer, consider:

1. **Use core game card API**: Import `isActionCard()`, `isTreasureCard()` from `@principality/core` instead of hardcoding card names
2. **Add phase descriptions**: Include text like "You are in BUY phase. Play treasures to generate coins, then buy cards."
3. **Coins breakdown**: Show how coins are generated: "2 Copper played = 2 coins (1 each)"
4. **Multi-card suggestions**: "You can play all treasures at once with: play_treasure Copper, play_treasure Copper"
