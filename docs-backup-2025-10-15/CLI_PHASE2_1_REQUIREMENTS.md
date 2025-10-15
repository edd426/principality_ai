# CLI Phase 1.5.1 Requirements - Post-Implementation Testing & Fixes

**Version**: 1.0.0
**Status**: APPROVED - Ready for Implementation
**Date**: October 8, 2025
**Target Phase**: Phase 1.5.1 (Post-Implementation Fixes & Enhancements)
**Author**: requirements-architect (based on user testing feedback)

---

## Executive Summary

Following the implementation of Phase 1.5 (CLI UX Improvements), a comprehensive user testing session revealed three critical bugs and one missing usability feature. This document captures those findings and defines requirements for Phase 1.5.1.

**Phase 1.5.1 Scope**:
- ✅ **3 Critical Bugs**: FIXED during testing session
- 📋 **Feature 6**: Card Price Display (NEW - Requires Implementation)

**Total Effort**: 9 hours (6 hours bug fixes + 3 hours Feature 6)

---

## Bug Fixes Implemented (Documentation Only)

These bugs were discovered during user testing and have already been fixed. This section documents them for historical reference.

### Bug 1: Help Text Missing Phase 1.5 Commands ✅ FIXED

**Severity**: Medium (Usability Issue)
**Status**: RESOLVED
**Fix Date**: October 8, 2025

**Issue Description**:
User was unaware of new Phase 1.5 features because the `help` command didn't document them.

**User Quote**:
> "There's nothing on the UI that tells me I can use 't' or 'treasures' to play all my treasures or that I can chain my commands together."

**Root Cause**:
`displayHelp()` method in `display.ts` was not updated when Phase 1.5 features were implemented.

**Resolution**:
Updated help text to include:
- Chain command syntax: `1, 2, 3` or `1 2 3`
- Auto-play treasures: `treasures` or `t`
- VP display in `hand` command
- Command aliases clearly marked

**Files Modified**:
- `packages/cli/src/display.ts` (lines 200-208)

**Validation**:
- ✅ Help command now shows all Phase 1.5 features
- ✅ Examples provided for chain syntax
- ✅ Aliases documented (t, exit, quit, h)

---

### Bug 2: Chain Rollback Corrupted Game State ✅ FIXED

**Severity**: CRITICAL (Game-Breaking)
**Status**: RESOLVED
**Fix Date**: October 8, 2025

**Issue Description**:
When a chain command failed and triggered rollback, the game crashed with:
```
Fatal error: TypeError: supply.get is not a function
```

**User Scenario**:
```
> 1, 2, 3, 4
✓ Player 1 played Copper
✓ Player 1 played Copper
✓ Player 1 bought Copper
✗ Error: Chain failed: Invalid move number: 4...
Fatal error: TypeError: supply.get is not a function
```

**Root Cause**:
The `TransactionManager.saveState()` method used `JSON.parse(JSON.stringify(state))` to clone the game state. This destroyed the `supply` Map object, converting it to a plain object `{}`. When rollback restored this corrupted state, `supply.get()` failed because `supply` was no longer a Map.

**Technical Analysis**:
```typescript
// BEFORE (Bug):
saveState(state: GameState): void {
  this.savedState = JSON.parse(JSON.stringify(state)); // ❌ Destroys Map!
}

// Map { 'Copper' => 60 } becomes {} after JSON round-trip
```

**Resolution**:
Implemented proper deep clone that preserves Map objects:
```typescript
// AFTER (Fixed):
private deepCloneGameState(state: GameState): GameState {
  return {
    players: state.players.map(player => ({
      hand: [...player.hand],
      drawPile: [...player.drawPile],
      discardPile: [...player.discardPile],
      inPlay: [...player.inPlay],
      actions: player.actions,
      buys: player.buys,
      coins: player.coins
    })),
    supply: new Map(state.supply), // ✅ Preserves Map!
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    turnNumber: state.turnNumber,
    gameLog: [...state.gameLog],
    seed: state.seed
  };
}
```

**Files Modified**:
- `packages/cli/src/transaction.ts` (lines 16-54)

**Validation**:
- ✅ Chain rollback preserves Map objects correctly
- ✅ No more "supply.get is not a function" errors
- ✅ Game state fully restored after failed chain
- ✅ Immutability preserved (returns new instance)

---

### Bug 3: Chain Move Numbers Shift During Execution ✅ FIXED

**Severity**: CRITICAL (Incorrect Behavior)
**Status**: RESOLVED
**Fix Date**: October 8, 2025

**Issue Description**:
When executing a chain like `1, 2, 3`, the move numbers shifted after each execution, causing wrong moves to be executed.

**User Scenario**:
```
Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Play Copper
  [4] Buy Copper

> 1, 2, 3
✓ Player 1 played Copper      ← Correct (move 1)
✓ Player 1 played Copper      ← Correct (move 2)
✓ Player 1 bought Estate      ← WRONG! Should have played 3rd Copper
```

**Root Cause**:
The `executeChain()` method called `getValidMoves()` **inside the loop**, recalculating available moves after each execution:

```typescript
// BEFORE (Bug):
for (let i = 0; i < chain.length; i++) {
  const validMoves = this.engine.getValidMoves(this.gameState); // ❌ Recalculates!
  const move = validMoves[chain[i] - 1];
  // After playing Copper [1], move [3] becomes move [2]
}
```

**Why This Failed**:
1. User types `1, 2, 3` looking at initial move list
2. Executes move 1 (Play Copper) → Copper removed from hand
3. `getValidMoves()` recalculates → move numbers shift
4. Move "3" now points to a different card
5. Wrong move executed!

**Resolution**:
Capture all moves at the **start** of the chain, before any execution:

```typescript
// AFTER (Fixed):
private executeChain(chain: number[]): void {
  // ✅ Capture ALL moves BEFORE executing ANY
  const initialValidMoves = this.engine.getValidMoves(this.gameState);

  // Validate all move numbers upfront
  for (const moveNumber of chain) {
    if (moveNumber < 1 || moveNumber > initialValidMoves.length) {
      this.display.displayError(`Invalid move number: ${moveNumber}...`);
      return;
    }
  }

  // Convert move numbers to actual Move objects
  const movesToExecute = chain.map(num => initialValidMoves[num - 1]);

  // Execute the frozen list of moves
  for (let i = 0; i < movesToExecute.length; i++) {
    const move = movesToExecute[i]; // ✅ Always the same move!
    const result = this.engine.executeMove(this.gameState, move);
    // ...
  }
}
```

**Files Modified**:
- `packages/cli/src/cli.ts` (lines 148-191)

**Validation**:
- ✅ Chain `1, 2, 3` now executes correct moves
- ✅ Move numbers stable throughout chain
- ✅ Validation happens upfront before any execution
- ✅ Clear error messages for invalid move numbers

---

## Feature 6: Card Price Display (NEW REQUIREMENT)

**Priority**: Should-Have (High Usability Value)
**Status**: APPROVED - Ready for Implementation
**Estimated Effort**: 3 hours

### User Story

**As a player**, I want to see card costs when making buy decisions, so that I can make informed purchases without memorizing the entire card catalog.

**User Quote**:
> "I noticed that I can't find out what the price of each buy option is in the CLI. Can you please add this to the requirements?"

### Current vs Proposed Behavior

**Current (Missing Information)**:
```
Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Play Copper
  [4] Buy Copper      ← How much does this cost?
  [5] Buy Silver      ← How much does this cost?
  [6] Buy Estate      ← How much does this cost?
  [7] End Phase

> supply
Supply:
  Treasures:
    Copper: 60        ← No cost shown
    Silver: 40        ← No cost shown
    Gold: 30          ← No cost shown
```

**Proposed (With Pricing)**:
```
Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Play Copper
  [4] Buy Copper ($0)     ✅ Cost visible!
  [5] Buy Silver ($3)     ✅ Cost visible!
  [6] Buy Estate ($2)     ✅ Cost visible!
  [7] End Phase

> supply
Supply:
  Treasures:
    Copper ($0): 60       ✅ Cost visible!
    Silver ($3): 40       ✅ Cost visible!
    Gold ($6): 30         ✅ Cost visible!
```

---

### Functional Requirements

#### FR-6.1: Display Card Costs in Buy Move Descriptions

**Description**: When displaying buy moves in the available moves list, show the card's cost in parentheses.

**Format**: `Buy [CardName] ($[cost])`

**Examples**:
- `Buy Copper ($0)`
- `Buy Silver ($3)`
- `Buy Province ($8)`

**Implementation Location**: `packages/cli/src/display.ts` - `describeMoveCompact()` method (lines 214-228)

**Acceptance Criteria**:
- ✅ All buy moves show costs
- ✅ Format is consistent: `Buy [Name] ($[cost])`
- ✅ Costs match card definitions in `packages/core/src/cards.ts`

---

#### FR-6.2: Display Card Costs in Supply Command

**Description**: When displaying the supply piles via the `supply` command, show each card's cost alongside its count.

**Format**: `[CardName] ($[cost]): [count]`

**Example Output**:
```
Supply:
  Treasures:
    Copper ($0): 60
    Silver ($3): 40
    Gold ($6): 30

  Victory Cards:
    Estate ($2): 8
    Duchy ($5): 8
    Province ($8): 8

  Kingdom Cards:
    Village ($3): 10
    Smithy ($4): 10
    Laboratory ($5): 10
    Market ($5): 10
```

**Implementation Location**: `packages/cli/src/display.ts` - `displaySupply()` method (lines 108-144)

**Acceptance Criteria**:
- ✅ All supply piles show costs
- ✅ Format is consistent across all categories
- ✅ Costs displayed even when pile count is 0

---

#### FR-6.3: Use Existing Card Cost API

**Description**: Retrieve card costs using the existing `getCard()` function from the core package.

**API**: `getCard(cardName).cost`

**Example**:
```typescript
import { getCard } from '@principality/core';

const card = getCard('Silver');
console.log(card.cost); // 3
```

**Acceptance Criteria**:
- ✅ No hardcoded cost values in display.ts
- ✅ Uses `getCard()` from `@principality/core`
- ✅ Handles all card types (treasures, victory, kingdom)

---

#### FR-6.4: Show Costs for All Buyable Cards

**Description**: Display costs for all cards that can be purchased: treasures, victory cards, and kingdom cards.

**Card Categories**:
- **Treasures**: Copper ($0), Silver ($3), Gold ($6)
- **Victory**: Estate ($2), Duchy ($5), Province ($8)
- **Kingdom**: Village ($3), Smithy ($4), Laboratory ($5), Market ($5), Woodcutter ($3), Festival ($5), Council Room ($5), Cellar ($2)

**Acceptance Criteria**:
- ✅ All 8 kingdom cards show costs
- ✅ All 3 treasures show costs
- ✅ All 3 victory cards show costs

---

#### FR-6.5: Update Help Text with Pricing Example

**Description**: Include a pricing example in the help command to educate users about the cost display feature.

**Proposed Help Text Addition**:
```
  [number]     - Select move (e.g., "5" to buy Silver for $3)
```

**Implementation Location**: `packages/cli/src/display.ts` - `displayHelp()` method (line 201)

**Acceptance Criteria**:
- ✅ Help text mentions pricing in example
- ✅ Example uses realistic card and cost

---

### Non-Functional Requirements

#### NFR-6.1: Cost Lookup Performance

**Requirement**: Cost lookup should complete in < 5ms per card

**Rationale**: Cost lookup happens during display rendering. Must be fast to avoid UI lag.

**Implementation**: The `getCard()` function is a simple hash map lookup with O(1) complexity, so this should be easily achievable.

**Validation**:
```typescript
const start = performance.now();
const card = getCard('Silver');
const cost = card.cost;
const end = performance.now();
console.log(`Cost lookup: ${end - start}ms`); // Should be < 1ms
```

---

#### NFR-6.2: No Performance Impact on Move Display

**Requirement**: Adding cost display should not degrade move display performance

**Baseline**: Current `displayAvailableMoves()` renders in < 10ms for 50 moves

**Target**: With cost display, should still render in < 15ms for 50 moves

**Validation**: Run performance tests in `packages/cli/tests/performance.test.ts`

---

#### NFR-6.3: Use Existing Core API

**Requirement**: Must use the existing `getCard()` API from the core package, not duplicate cost data

**Rationale**:
- **Single Source of Truth**: Card costs defined once in cards.ts
- **Maintainability**: Changes to costs don't require CLI updates
- **Type Safety**: TypeScript ensures correct card names

**Anti-Pattern** (DO NOT DO THIS):
```typescript
// ❌ BAD: Hardcoded costs in display.ts
const costs = { 'Copper': 0, 'Silver': 3, 'Gold': 6 };
```

**Correct Pattern**:
```typescript
// ✅ GOOD: Use core API
import { getCard } from '@principality/core';
const cost = getCard(move.card!).cost;
```

---

### Edge Cases

#### EC-6.1: Cards with Cost 0

**Scenario**: Copper has a cost of $0

**Expected Behavior**: Display as `Buy Copper ($0)`, not `Buy Copper ()` or `Buy Copper`

**Rationale**: Consistent format makes the UI predictable. Players should see the cost even when it's zero.

**Test Case**:
```typescript
test('should display $0 cost for Copper', () => {
  const move = { type: 'buy', card: 'Copper' };
  const description = display.describeMoveCompact(move);
  expect(description).toBe('Buy Copper ($0)');
});
```

---

#### EC-6.2: Cards with High Costs

**Scenario**: Province costs $8, the highest cost in the MVP card set

**Expected Behavior**: Display as `Buy Province ($8)` with proper formatting

**Rationale**: Ensure the display format works for all cost values (0-8)

**Test Case**:
```typescript
test('should display high cost correctly for Province', () => {
  const move = { type: 'buy', card: 'Province' };
  const description = display.describeMoveCompact(move);
  expect(description).toBe('Buy Province ($8)');
});
```

---

### Acceptance Criteria

#### AC-6.1: Buy Moves Show Costs

**Scenario**: Player views available moves during buy phase

**Given**: Player has $5 available
**When**: They view available moves
**Then**: Buy moves display costs: `Buy Silver ($3)`, `Buy Estate ($2)`

**Validation**:
```bash
npm run play
# Buy phase
> help
Available Moves:
  [21] Buy Copper ($0)
  [22] Buy Silver ($3)
  [23] Buy Estate ($2)
```

---

#### AC-6.2: Supply Command Shows Costs

**Scenario**: Player checks supply piles

**Given**: Player types `supply` command
**When**: Supply is displayed
**Then**: All cards show costs alongside counts

**Validation**:
```bash
> supply
Supply:
  Treasures:
    Copper ($0): 60
    Silver ($3): 40
    Gold ($6): 30
```

---

#### AC-6.3: Help Text Mentions Pricing

**Scenario**: New player reads help command

**Given**: Player types `help`
**When**: Help text is displayed
**Then**: Pricing format is mentioned in examples

**Validation**:
```bash
> help
Available Commands:
  [number]     - Select move (e.g., "5" to buy Silver for $3)
```

---

#### AC-6.4: Costs Match Card Definitions

**Scenario**: Verify displayed costs are accurate

**Given**: Card costs defined in `packages/core/src/cards.ts`
**When**: Costs are displayed in CLI
**Then**: CLI costs match core package definitions exactly

**Validation**:
```typescript
test('displayed costs match card definitions', () => {
  const allCards = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province',
                    'Village', 'Smithy', 'Laboratory', 'Market'];

  allCards.forEach(cardName => {
    const card = getCard(cardName);
    const move = { type: 'buy', card: cardName };
    const description = display.describeMoveCompact(move);
    expect(description).toContain(`($${card.cost})`);
  });
});
```

---

### Implementation Notes

#### File Changes Required

**1. packages/cli/src/display.ts**

```typescript
import { getCard } from '@principality/core'; // Add this import

// Update describeMoveCompact() method (line 214):
private describeMoveCompact(move: Move): string {
  switch (move.type) {
    case 'play_action':
      return `Play ${move.card}`;
    case 'play_treasure':
      return `Play ${move.card}`;
    case 'buy':
      const card = getCard(move.card!);
      return `Buy ${move.card} ($${card.cost})`; // Add cost here
    case 'end_phase':
      return 'End Phase';
    case 'discard_for_cellar':
      return 'Discard cards for Cellar';
    default:
      return 'Unknown move';
  }
}

// Update displaySupply() method (lines 108-144):
displaySupply(state: GameState): void {
  console.log('\nSupply:');

  // Treasures
  console.log('  Treasures:');
  const treasures = ['Copper', 'Silver', 'Gold'];
  treasures.forEach(name => {
    const count = state.supply.get(name) || 0;
    const card = getCard(name as CardName);
    console.log(`    ${name} ($${card.cost}): ${count}`); // Add cost here
  });

  // Victory cards
  console.log('  Victory Cards:');
  const victoryCards = ['Estate', 'Duchy', 'Province'];
  victoryCards.forEach(name => {
    const count = state.supply.get(name) || 0;
    const card = getCard(name as CardName);
    console.log(`    ${name} ($${card.cost}): ${count}`); // Add cost here
  });

  // Kingdom cards
  console.log('  Kingdom Cards:');
  const kingdomCards = ['Village', 'Smithy', 'Laboratory', 'Market',
                        'Woodcutter', 'Festival', 'Council Room', 'Cellar'];
  kingdomCards.forEach(name => {
    const count = state.supply.get(name) || 0;
    if (count > 0) {
      const card = getCard(name as CardName);
      console.log(`    ${name} ($${card.cost}): ${count}`); // Add cost here
    }
  });

  console.log('');
}
```

**2. packages/cli/tests/display.test.ts**

Add tests for cost display:
```typescript
describe('Card cost display', () => {
  test('should show cost for buy moves', () => {
    const move = { type: 'buy', card: 'Silver' };
    const description = display.describeMoveCompact(move);
    expect(description).toBe('Buy Silver ($3)');
  });

  test('should show $0 for Copper', () => {
    const move = { type: 'buy', card: 'Copper' };
    const description = display.describeMoveCompact(move);
    expect(description).toBe('Buy Copper ($0)');
  });

  test('supply command should show costs', () => {
    const output = display.displaySupply(gameState);
    expect(output).toContain('Copper ($0):');
    expect(output).toContain('Silver ($3):');
    expect(output).toContain('Gold ($6):');
  });
});
```

---

### Effort Estimate

**Feature 6 Total**: 3 hours

**Breakdown**:
- Implementation (display.ts updates): 1 hour
- Testing (manual + automated): 1 hour
- Code review & documentation: 1 hour

**Phase 1.5.1 Total**: 9 hours (6 hours bug fixes + 3 hours Feature 6)

---

## Summary

**Phase 1.5.1 Status**:
- ✅ **Bug 1**: Help text updated - FIXED
- ✅ **Bug 2**: Chain rollback Map preservation - FIXED
- ✅ **Bug 3**: Chain move number stability - FIXED
- 📋 **Feature 6**: Card price display - APPROVED, ready for implementation

**Next Steps**:
1. dev-agent implements Feature 6 (~3 hours)
2. test-architect adds tests for price display
3. User validates complete Phase 1.5 + 1.5.1
4. Mark Phase 1.5 + 1.5.1 as COMPLETE

**Files to Modify**:
- `packages/cli/src/display.ts` (add costs to buy moves and supply)
- `packages/cli/tests/display.test.ts` (add price display tests)

---

**Document Version**: 1.0.0
**Last Updated**: October 8, 2025
**Status**: APPROVED - Ready for Implementation
