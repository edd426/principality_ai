# AI Treasure-Playing Strategy

**Status**: ACTIVE
**Created**: 2025-10-29
**Phase**: 3
**Owner**: requirements-architect

---

## Executive Summary

The Rules-Based AI's treasure-playing logic has a critical bug where it plays only ONE treasure per decision cycle instead of ALL available treasures before making purchase decisions. This causes the AI to end the buy phase prematurely with insufficient coins for optimal purchases.

**Example Bug**: With 4 Coppers in hand, AI plays 1 Copper ($1), then immediately concludes "No profitable purchases available" and ends phase, missing opportunity to accumulate $5 total.

## Problem Statement

### Current Buggy Behavior
```
Hand: Copper, Copper, Copper, Copper
Coins: $0

Decision 1: "Play Copper for coins" → Coins: $1, InPlay: [Copper]
Decision 2: "No profitable purchases available" → Phase ends with $1
```

**Root Cause**: `decideBuyPhase()` uses a Set to track played treasures:
```typescript
const inPlayTreasures = new Set(player_state.inPlay.filter(...));
const unplayedTreasure = treasureCards.find(card => !inPlayTreasures.has(card));
```

This breaks with duplicate cards because after playing 1 Copper, `inPlayTreasures = {'Copper'}`, so subsequent calls find no "unplayed" Copper.

### Impact
- **Economics**: AI reaches insufficient coin totals, can't buy Silver/Gold appropriately
- **Strategy**: Trades like (Copper → Silver → Gold) delayed or skipped
- **Competitiveness**: Human player gains advantage over AI
- **Game Balance**: AI gets stuck in early-game loops instead of progressing

## Requirements

### FR 3.1: Play All Treasures Before Purchase Decision

**Description**: AI must play ALL treasures currently in hand before making any purchase decision.

**Acceptance Criteria**:
- AC 3.1.1: With 4 Coppers, AI plays all 4 before evaluating buys
- AC 3.1.2: With 2 Copper + 1 Silver, AI plays all 3 before evaluating buys
- AC 3.1.3: After playing all treasures, AI evaluates best purchase
- AC 3.1.4: Coins accurately reflect all treasures played

### FR 3.2: Handle Duplicate Treasures Correctly

**Description**: AI must correctly count and play multiple copies of the same treasure card.

**Acceptance Criteria**:
- AC 3.2.1: Each Copper in hand is played individually
- AC 3.2.2: Coin value accumulates correctly (4 × Copper = $4, not $1)
- AC 3.2.3: Hand is depleted of treasures before purchase decision
- AC 3.2.4: No "already played" check prevents duplicate plays

### FR 3.3: Maximize Coin Accumulation Per Turn

**Description**: AI must accumulate maximum available coins before making purchase decision.

**Acceptance Criteria**:
- AC 3.3.1: All treasures played results in correct total coins
- AC 3.3.2: Purchase decision reflects maximum coin potential
- AC 3.3.3: Big Money strategy applies to maximum coin total, not intermediate values

### FR 3.4: Maintain Treasure-Playing Order

**Description**: Treasures should be played in a consistent order (to enable future special effects).

**Acceptance Criteria**:
- AC 3.4.1: Treasures played in hand order (left to right)
- AC 3.4.2: All treasures of same type play before different type
- AC 3.4.3: InPlay array shows complete treasure history for this phase

## Current Implementation Issue

**File**: `/packages/core/src/ai.ts` (lines 76-95)

```typescript
private decideBuyPhase(gameState: GameState, playerIndex: number, _player: any): AIDecision {
  const player_state = gameState.players[playerIndex];

  // BUG: This logic fails with duplicate treasures
  const treasureCards = player_state.hand.filter((card: CardName) => isTreasureCard(card));

  if (treasureCards.length > 0) {
    const inPlayTreasures = new Set(player_state.inPlay.filter(...));
    const unplayedTreasure = treasureCards.find(card => !inPlayTreasures.has(card));

    if (unplayedTreasure) {
      return { move: { type: 'play_treasure', card: unplayedTreasure }, ... };
    }
  }

  // Premature exit: assumes treasures exhausted when Set contains treasure type
  // But with duplicates, all Coppers fail the !inPlayTreasures.has(card) check
}
```

## Solution Approach

### Algorithm Change

Instead of tracking which **types** of treasures have been played, track how many of each type **remain in hand**.

**Pseudocode**:
```
treasureCount = count treasures in current hand
if treasureCount > 0:
  play first treasure from hand
  return "Playing [treasure] for coins"
else:
  # Hand is now empty of treasures
  evaluate purchases based on total coins accumulated
  return best purchase or end_phase
```

### Implementation Strategy

1. **Play one treasure per decision cycle**: Each call to `decideBuyPhase()` plays exactly one treasure if hand contains treasures
2. **Count hand contents**: Determine if treasures remain by checking hand array, not inPlay history
3. **Defer purchase logic**: Only enter purchase evaluation when `treasureCards.length === 0`

## Testing Strategy

### Unit Tests (UT-AI-TREASURE-*)
Test the decision logic in isolation:
- Single copper (trivial case)
- Multiple coppers (4 copies)
- Mixed treasures (Copper + Silver)
- Empty hand (no treasures)
- Verify correct coin accumulation

### Integration Tests (IT-AI-TREASURE-*)
Test within full game flow:
- Complete AI turn with 4 Coppers → must buy Silver (not stuck at $1)
- Multiple rounds showing progression (Copper → Silver → Gold)
- Turn ending only after all treasures played

### E2E Tests (E2E-AI-TREASURE-*)
Full game validation:
- 10-turn game with AI playing Copper → Silver → Gold progression
- Verify final deck composition matches Big Money strategy
- Compare against human baseline

## Success Metrics

- **100% Test Pass Rate**: All unit, integration, and E2E tests pass
- **Economic Progression**: AI achieves Silver by turn 3, Gold by turn 5 (baseline)
- **Coin Accumulation**: Coins always reflect all treasures played in current hand
- **No Regressions**: Existing AI strategy tests still pass (Big Money priorities preserved)

## Related Issues

- **Phase 3.2**: "Treasure Playing Rules" - Verified treasures are only playable in buy phase ✅
- **Phase 3.4**: "AI Game Flow" - AI currently auto-executes correctly ✅
- **This Issue**: "Treasure Accumulation" - Duplicate treasures not played completely ❌

---

## Timeline

- **Requirements**: 30 min (DONE)
- **Tests**: 2-3 hours
- **Implementation**: 1 hour
- **Validation**: 30 min

**Total**: ~4 hours
