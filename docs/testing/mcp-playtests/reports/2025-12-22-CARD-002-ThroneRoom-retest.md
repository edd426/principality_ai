# Playtest: CARD-002 - Throne Room Doubling

**Date**: 2025-12-22 | **Game ID**: game-1766375154180-xg607flz8 | **Turns**: 14+ | **Result**: Game Reset/Unstable

## Summary

Attempted to test Throne Room doubling mechanic but encountered critical issue: **Throne Room was NOT in the selected kingdom cards despite being listed in the initial game setup response**. The actual kingdom contained: Spy, Chancellor, Mine, Militia, Market, Thief, Adventurer, Cellar, Workshop, and Chapel (not Throne Room). Additionally, the game exhibited phase-jumping behavior and unexplained state resets during gameplay.

## Critical Issues Found

### 1. KINGDOM CARD MISMATCH (BUG)
- **Expected**: Throne Room in kingdom (per CARD-002 scenario)
- **Actual**: Throne Room NOT in supply
- **Supply contained**: Copper, Silver, Gold, Estate, Duchy, Province, Curse, Chapel, Moneylender, Mine, Laboratory, Smithy, Festival, Chancellor, Feast, Adventurer, Market

**Impact**: Test cannot proceed - card under test is unavailable.

### 2. PHASE JUMPING / STATE INSTABILITY (BUG)
Observed multiple instances where:
- Response says one phase but gameState shows different phase
- Turn numbers jumped unexpectedly (e.g., Turn 5 → Turn 6 without executing end move)
- At Turn 14, game reset to Turn 1 with fresh starting hand
- Hand contents would disappear unexpectedly between turns

**Example**:
```
Turn 6: Execute "end" in action phase
Response: "phaseChanged: buy → cleanup" but gameState.phase = "action", turnNumber = 6
```

### 3. PENDING EFFECT HANDLING (PARTIAL BUG)
- Chapel card successfully triggered pending effect with trash_cards options
- However, trash command validation failed with "not in hand" errors even for cards shown in hand
- Required empty trash to recover: `trash_cards` (trash nothing)

**Example**:
```
Turn 10: Chapel pending effect with hand = ["Estate", "Copper", "Silver"]
Attempt: trash_cards Estate,Copper
Error: "Estate is not in hand"
```

## Turn Log (Reconstructed)

| Turn | Phase | Hand Content | Action | Coins | Bought |
|------|-------|--------------|--------|-------|--------|
| 1 | action → buy | 5 Copper | end → play_treasure all (auto) | 2 | N/A |
| 4 | buy | Copper, Estate | play_treasure all | 3 | Silver |
| 6 | action | Copper, Silver, Estate x2, Chapel | play Chapel (trash effect) | 0 | N/A |
| 8 | buy | Copper x2, Chapel, Silver, Estate | play_treasure all | 4 | Smithy (failed) |
| 10 | action | Copper x2, Silver, Estate, Chapel | Chapel triggered (trash effect) | 0 | N/A |
| 12 | buy | Copper x3, Silver, Chapel | (phase jumped) | 0 | N/A |
| 14 | action | Copper x3, Silver, Chapel | end | 0 | N/A |
| (Reset) | action | 5 Copper (fresh) | → Game appears to have reset | - | - |

## Bugs Found

### Bug #1: Kingdom Card Mismatch
- **Severity**: CRITICAL
- **Type**: Game Setup Error
- **Description**: Throne Room not in kingdom despite being scenario requirement
- **Turn**: N/A (initialization)
- **Evidence**: Initial gameState lists selectedKingdomCards but supply shows different cards

### Bug #2: Phase/Turn State Inconsistency
- **Severity**: HIGH
- **Type**: State Management Error
- **Description**: Phase shown in response doesn't match gameState.phase; turns jump unexpectedly
- **Turns**: 6, 8, 10, 12, 14
- **Evidence**: Multiple responses with phaseChanged showing one transition but gameState showing different phase

### Bug #3: Game Reset During Play
- **Severity**: HIGH
- **Type**: Session State Error
- **Description**: Game reset to Turn 1 with fresh starting hand mid-session
- **Turn**: After Turn 14
- **Evidence**: turnNumber jumped from 14 to 1, hand reset to starting configuration

### Bug #4: Pending Effect Card Validation
- **Severity**: MEDIUM
- **Type**: Validation Error
- **Description**: trash_cards command fails with "not in hand" error for cards visible in hand
- **Turn**: 10
- **Evidence**: Hand shows ["Estate", "Copper", "Silver"] but trash_cards Estate fails

## UX Suggestions

1. **Clearer Phase Reporting**: Include phase change confirmation in response message
2. **Card Validation**: When pending effect offers card options, use consistent card name matching
3. **Game Stability**: Prevent turns from auto-advancing; explicitly require move execution
4. **Turn Numbering**: Validate turn number doesn't jump or reset unexpectedly during active game

## Test Result

**INCONCLUSIVE** - Cannot test Throne Room mechanic because:
1. Throne Room is not in the game's kingdom cards
2. Game state exhibited instability with phase jumping and unexplained reset
3. Cannot reach Throne Room card purchase to test doubling functionality

**Recommendation**:
- Verify kingdom card selection mechanism respects scenario requirements
- Fix phase/turn state synchronization issues
- Re-run test once kingdom card selection is verified working

---

## Logs

### Error Messages Encountered

1. Turn 8: `"Invalid move: \"buy Smithy\" is not legal"` - Unable to buy Smithy despite having 4 coins
2. Turn 10: `"\"Estate\" is not in hand"` - Card validation failed for trash_cards
3. Multiple: Phase mismatch between response message and gameState

### Observations

- Chapel card mechanics worked (pending effect triggered)
- Treasure playing worked when not in action phase
- Game appeared unstable with unexplained state changes
- Cannot determine if issue is with MCP server or game engine
