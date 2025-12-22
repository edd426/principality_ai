# Playtest: CARD-001 Chapel Trashing

**Date**: 2025-12-21 | **Game ID**: game-1766324333134-h5pya4wiq | **Turns**: 12 | **Result**: stuck

## Summary
Game became unplayable at Turn 12 due to multiple critical bugs in phase transitions, pending effect handling, and move parsing. Chapel was never purchased despite being available and in the kingdom. Mine card was purchased and played, but created a blocking state that couldn't be resolved.

## Bugs Found

### BUG 1: Buy Phase Auto-Skip / Phase Transition Malfunction (CRITICAL)
**Severity**: CRITICAL
**Description**: After ending action phase with `end` command, the game frequently skips buy phase and advances directly to the next turn's action phase. The response message claims "Cleanup auto-skipped" but actually skips the entire buy phase.

**Evidence**:
- Turn 1-8: Pattern of `end` commands from action phase resulting in state that appears to show buy phase in response, but next move shows game is already in next turn's action phase
- Response shows "phase: buy" but executing any move puts player in "phase: action" of next turn
- Buy purchases are somehow happening (Silver, Gold, Mine were bought) but no explicit buy commands were executed

**Impact**:
- Player cannot reliably execute purchases in buy phase
- Chapel acquisition strategy impossible to implement
- Game state becomes unsynchronized with player actions

**Example**:
```
YOU: game_execute(move: "end")  [Turn 9, action phase]
RESPONSE: {"gameState":{"phase":"buy","turnNumber":9},"validMoves":["play_treasure all",...]}
YOU: game_execute(move: "play_treasure all")  [Attempting to play in buy phase]
RESPONSE: {"gameState":{"phase":"action","turnNumber":10}} [Jumped to next turn!]
```

### BUG 2: Unparseable Move in validMoves (CRITICAL)
**Severity**: CRITICAL
**Description**: When a card effect (Mine) creates a pending effect (select_treasure_to_trash), the validMoves array includes "select_treasure_to_trash" as a move, but this move string cannot be parsed or executed by any valid syntax.

**Evidence**:
- Turn 12: game_observe shows validMoves: ["select_treasure_to_trash", "select_treasure_to_trash"]
- Attempting to execute with `select_treasure_to_trash` → "Cannot parse move"
- Attempting with `select_treasure_to_trash Copper` → "Cannot parse move"
- Attempting with `play 3` (card index) → Rejected with "Cannot play treasures in action phase"
- Attempting with `end` → Rejected as "Invalid move"
- Game is stuck with no valid move that can be executed

**Impact**:
- Player becomes completely stuck when Mine is played
- No way to resolve pending trashing effects
- Game unplayable

**Root Cause**: The move parser doesn't support pending effect move syntax, but the effect handler is generating moves in that format. The `generateMoveOptions` or `parseMove` functions don't handle the "select_treasure_to_trash" command type.

**Example**:
```
Stuck at Turn 12 with validMoves: ["select_treasure_to_trash", "select_treasure_to_trash"]
NO syntax works:
- "select_treasure_to_trash" → parse error
- "select_treasure_to_trash Copper" → parse error
- "Copper" → parse error
- "play 3" → wrong phase error
- "end" → invalid move error
```

### BUG 3: Game State Desynchronization (CRITICAL)
**Severity**: CRITICAL
**Description**: The gameState returned in move responses does not match the actual game state when the next move is executed. Game makes hidden purchases and advances turns without player visibility.

**Evidence**:
- Turn 2-11: Multiple instances where response shows one game state (e.g., phase: buy), but execution of next move shows different state (phase: action, different turn number)
- Turn 5: Response claimed I was in buy phase with valid treasure play options, but executing `play_treasure all` showed game was already in action phase of next turn
- Purchases of Silver (Turn 2), Gold (Turn 6), Mine (Turn 9) never appeared in explicit buy commands
- GameLog shows purchases happening but player had no opportunity to execute them

**Impact**:
- Player cannot trust game state responses
- Moves that should succeed fail with wrong phase errors
- Deck composition unpredictable

### BUG 4: Chapel Never Available for Purchase (MEDIUM)
**Severity**: MEDIUM
**Description**: Despite Chapel being in the supply with 10 remaining cards and cost 2 (affordable from Turn 2 onward), Chapel was never purchased and never appeared in player's hand.

**Evidence**:
- Supply shows Chapel: remaining=10, cost=2
- Player had 2+ coins starting Turn 2 (with treasures played)
- No explicit buy Chapel command could be executed due to phase skip issues
- Final hand at Turn 12: Silver, Estate, Copper (no Chapel)
- GameLog shows only Silver, Gold, Mine purchases - no Chapel

**Impact**:
- Strategy objective (acquire Chapel for trashing) impossible
- Cannot test Chapel's trash mechanic
- Unknown if Chapel would function correctly

**Possible Cause**: Buy phase auto-skip prevents player from purchasing desired cards, and hidden auto-purchases are using different logic (possibly random or big-money strategy).

## Turn Log

| Turn | Intended | Actual Result | Notes |
|------|----------|---------------|-------|
| 1 | Play 4 Copper, buy Chapel (2 coins) | Advanced to Turn 2 without buy phase | No visible buy action |
| 2 | Play treasures, buy Chapel | Game advanced; Silver purchased instead | Phase skip, auto-purchase? |
| 3-4 | Buy Chapel with 2+ coins available | Phase skip patterns continue | Chapel never targeted |
| 5 | Play 4 Copper + 1 Silver = 6 coins | Game auto-completed, advancement to Turn 6 | buy phase showed but skipped |
| 6-8 | Multiple attempts to reach buy phase | Inconsistent phase transitions | Some turns show "buy → cleanup → action" incorrectly |
| 9 | Proper buy phase achieved! Hand: Estate, 2 Copper, Silver, Gold | Play treasures attempted but game jumped to Turn 10 action | Brief correct phase, then failed |
| 10 | End action phase | Game moved to Turn 11 buy phase correctly | Finally working? |
| 11 | Play treasures (Silver, 3 Copper) | Game jumped to Turn 12 action phase with Mine in hand | Mine somehow purchased without buy command |
| 12 | Play Mine to trash treasures | Game stuck in pending effect state with no parseable moves | Unresolvable trashing effect |

## Test Objectives vs Results

**Objective 1**: Buy Chapel by Turn 2 → **FAILED** - Chapel never purchased, phase skip prevents buying
**Objective 2**: Play Chapel in action phase to trash cards → **FAILED** - Chapel never acquired
**Objective 3**: Test trash mechanic with Chapel → **FAILED** - Got stuck with Mine instead
**Objective 4**: Buy Silver/Gold after Chapel → **PARTIAL** - Silver and Gold were purchased, but not via explicit player commands
**Objective 5**: Complete 15 turns → **FAILED** - Game stuck unplayable at Turn 12

## Recommendation

This test must be run again AFTER the following fixes are applied:
1. Fix phase transition logic - buy phase must reliably execute between action and cleanup
2. Fix pending effect move parsing - "select_treasure_to_trash" and similar must be parseable
3. Fix game state synchronization - responses must reflect actual game state
4. Verify Chapel is purchasable and functional before retry

Current implementation is unplayable due to critical bugs in core game loop.
