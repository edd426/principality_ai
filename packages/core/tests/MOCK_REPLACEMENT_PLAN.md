# Mock-Based Tests Replacement Plan

**Status**: ACTIVE
**Created**: 2025-10-29
**Phase**: 2.1 (AI Gameplay Acceleration)
**Purpose**: Document strategy for replacing mock-based tests with real integration tests

## Overview

This document identifies mock-based tests that should be replaced with real integration tests to improve code coverage and eliminate false confidence from mocked tests.

---

## Part 1: Tests to KEEP AS-IS (MCP/Engine Wrapper Tests)

These tests validate the **wrapper layer** between Claude MCP and the game engine. They correctly use mocks because they're testing integration interfaces, not game behavior.

### `/packages/mcp-server/tests/unit/game-execute.test.ts` (Lines 75-205)

**Test Suite**: `UT3.1-3.2: Execute Move Success & Invalid Move`

**Rationale for Keeping Mocks**:
- These tests validate the **MCP tool interface**, not AI or game engine logic
- The GameExecuteTool is a **wrapper** that:
  - Parses natural language moves ("play Village" → move object)
  - Validates syntax before passing to engine
  - Handles error responses from engine
  - Returns formatted responses to Claude
- Testing this wrapper with mocks is appropriate because:
  - We only care that the **wrapper correctly calls engine**, not that engine works
  - The engine has its own comprehensive test suite
  - Mocking isolates the wrapper layer to test parse/validate logic in isolation

**Dependencies**:
- Real GameEngine: No
- Real RulesBasedAI: No
- Mocks: GameEngine, state persistence layer

**What These Tests Validate**:
- Move parsing: "play 0" → { type: 'play_action', card: 'Village' }
- Syntax validation: rejects malformed input before engine sees it
- Error handling: engine errors → helpful user message
- State immutability: failed moves don't corrupt stored state
- Atomicity: partial failures don't leave state inconsistent

**Status**: ✅ KEEP - Correct use of mocks for integration testing

---

### `/packages/mcp-server/tests/unit/game-execute.test.ts` (Lines 208-250)

**Test Suite**: `UT3.X: Error Handling (No Active Game, Wrong Phase)`

**Rationale for Keeping Mocks**:
- Tests error recovery scenarios specific to **MCP tool usage**
- Validates that Claude can recover from common mistakes (no active game, wrong phase)
- The "wrapper" logic being tested is:
  - Check for null/undefined state (no active game)
  - Return appropriate error message
  - Don't corrupt state on error

**Status**: ✅ KEEP - Wrapper-specific error handling

---

## Part 2: Tests to REVIEW & POTENTIALLY REPLACE

These tests have a mix of concerns - some test wrapper functionality, some test underlying game behavior that could be better tested with real integration tests.

### `/packages/core/tests/rules-based-ai.test.ts` (Lines 42-62: UT 2.2)

**Test**: `UT 2.2: AI Makes Valid Move`

**Current Approach**:
```typescript
test('should only suggest valid moves that pass game engine validation', () => {
  const state = engine.initializeGame(2);
  const validMoves = engine.getValidMoves(state, 0);
  if (validMoves.length > 0) {
    const move = validMoves[0];
    const result = engine.executeMove(state, move);
    expect(result.success).toBe(true);
  }
});
```

**Problem**:
- Tests **engine's own getValidMoves**, not AI decision-making
- Doesn't actually call `ai.decideBestMove()` (should be testing AI!)
- Gives false confidence that "AI makes valid moves" when it's really testing "engine's moves are valid"

**Recommendation**: ✅ REPLACE with real AI integration test

**How to Replace**:
1. Use new test `IT-AI-SEQUENCE-11` in `/packages/core/tests/ai-gameplay-integration.test.ts`
   - Creates 50 diverse game states
   - Calls `ai.decideBestMove()` directly
   - Verifies decision is in `validMoves` list
   - Executes decision to verify it works
   - Tests ACTUAL AI behavior, not engine

**Dependencies**:
- Real GameEngine: Yes
- Real RulesBasedAI: Yes
- Mocks: None

**Status**: 🔄 REPLACE - Misses AI testing, tests wrong layer

---

### `/packages/core/tests/rules-based-ai.test.ts` (Lines 200-379: UT 2.6-2.11)

**Tests**: Buy Phase Strategy (Gold Available, Silver Available, Province, Duchy, Estate, Curse)

**Current Approach**:
- Create a test state with specific coins/supplies
- Verify valid moves **exist** (not that AI chooses them)
- Example: "should prioritize Gold when 6+ coins available"
  ```typescript
  const canBuyGold = validMoves.some(m => m.type === 'buy' && m.card === 'Gold');
  expect(canBuyGold).toBe(true);
  ```

**Problem**:
- Tests that Gold **is buyable**, not that **AI chooses** Gold
- Never calls `ai.decideBestMove()`
- Would pass even if AI always chose Silver over Gold
- Tests engine capabilities, not AI strategy

**Recommendation**: ✅ REPLACE with real AI strategy tests

**How to Replace**:
1. Create new tests in `/packages/core/tests/ai-buy-strategy.test.ts` (future phase)
   - Call `ai.decideBestMove()` with various coin levels
   - Verify AI chooses expected cards
   - Example: with $6, AI should decide to buy Gold (not just that Gold is available)
   - Sequence multiple buy decisions to verify strategy progression

2. Use patterns from existing real tests:
   - `ai-treasure-strategy.test.ts`: Shows how to test actual AI decisions
   - `ai-decision-logic.test.ts`: Direct `ai.decideBestMove()` calls

**Dependencies**:
- Real GameEngine: Yes
- Real RulesBasedAI: Yes
- Mocks: None

**Status**: 🔄 REPLACE - Tests wrong layer (engine, not AI)

---

## Part 3: Tests Already Using Real Integration (No Replacement Needed)

These tests correctly use real engines and AI without mocks.

### `/packages/core/tests/ai-treasure-strategy.test.ts`

**Status**: ✅ GOOD - Uses real AI, real engine, real state transitions
- Unit tests (UT-AI-TREASURE-*): Direct AI decisions
- Integration tests (IT-AI-TREASURE-*): Full sequences with actual moves
- E2E tests (E2E-AI-TREASURE-*): Multi-turn gameplay

**Model for Future Tests**: These tests should be the template for other AI behavior tests

---

### `/packages/core/tests/ai-decision-logic.test.ts`

**Status**: ✅ GOOD - Real AI decision testing
- Tests direct `ai.decideBestMove()` calls
- Verifies decision logic against state
- Tests immutability and determinism with real state
- No mocks

---

### `/packages/core/tests/ai-gameplay-integration.test.ts` (NEW)

**Status**: ✅ NEW - Phase 2 integration tests
- 14 tests of AI decision sequences
- Tests multi-move turns
- Tests multi-turn game progression
- Tests edge cases and error conditions
- No mocks, all real behavior

---

## Part 4: Summary & Migration Plan

### Tests by Category

| Location | Test | Status | Recommendation |
|----------|------|--------|-----------------|
| game-execute.test.ts (UT3.1-3.2) | Execute Move Success | ✅ Good | KEEP - Wrapper testing |
| game-execute.test.ts (UT3.X) | Error Handling | ✅ Good | KEEP - Wrapper testing |
| rules-based-ai.test.ts (UT 2.2) | AI Makes Valid Move | 🔄 Weak | REPLACE |
| rules-based-ai.test.ts (UT 2.6-2.11) | Buy Strategy | 🔄 Weak | REPLACE |
| ai-treasure-strategy.test.ts | All | ✅ Good | KEEP |
| ai-decision-logic.test.ts | All | ✅ Good | KEEP |
| ai-gameplay-integration.test.ts (NEW) | All | ✅ Good | NEW (Phase 2) |

### Migration Strategy

**Phase 2.1 (Current)**:
1. ✅ Create `/packages/core/tests/ai-gameplay-integration.test.ts` with 14 real integration tests
2. ✅ Document mock replacement plan (this file)
3. Document which rules-based-ai.test.ts tests should be replaced

**Phase 3 (Future)**:
1. Create `/packages/core/tests/ai-buy-strategy.test.ts` with real buy decision tests
   - Replace UT 2.6-2.11 from rules-based-ai.test.ts
   - Test actual AI strategy, not just move availability
2. Create `/packages/core/tests/ai-action-strategy.test.ts` with real action phase tests
   - Replace UT 2.3-2.5 from rules-based-ai.test.ts
   - Test actual action card prioritization
3. Optionally mark old tests with `@deprecated` comments
4. Eventually retire weak tests in rules-based-ai.test.ts

---

## Specific Replacements: rules-based-ai.test.ts

### Tests to Replace (Marked in Source)

**UT 2.2 Line 43-62**:
- Tests: `should only suggest valid moves...`
- **Problem**: Never calls `ai.decideBestMove()`, tests engine instead
- **Replace with**: `IT-AI-SEQUENCE-11` (50 diverse states, real AI decisions)

**UT 2.6 Line 201-228** (Buy - Gold Available):
- Tests: `should prioritize Gold when 6+ coins available`
- **Problem**: Tests that Gold **is buyable**, not that **AI chooses** Gold
- **Replace with**: Test `ai.decideBestMove()` with coins=6, verify `decision.move.card === 'Gold'`
- **New test**: `IT-AI-BUY-1` (when ready in Phase 3)

**UT 2.7 Line 232-261** (Buy - Silver Available):
- Tests: `should buy Silver when 3-5 coins but no Gold`
- **Problem**: Tests move availability, not AI strategy
- **Replace with**: `IT-AI-BUY-2` - verify AI chooses Silver with $3-5 and Gold unavailable

**UT 2.8-2.11** (Province, Duchy, Estate, Curse):
- Same pattern: test move availability, not AI decision
- All should be replaced with real AI behavior tests

---

## Benefits of Replacement

### Current State (Mock Tests)
- ❌ Test wrapper layers, not actual behavior
- ❌ Would pass even if AI strategy is broken
- ❌ Don't reveal 4-Copper accumulation bug (bug wasn't caught by mocks)
- ❌ False confidence in AI correctness

### After Replacement (Real Integration Tests)
- ✅ Test actual AI decision-making
- ✅ Catch strategy bugs (like 4-Copper accumulation)
- ✅ Verify AI works across multi-move sequences
- ✅ Real confidence in AI behavior
- ✅ Model-aligned testing (MCP needs AI to work, not just be callable)

---

## Quality Metrics

### Current Coverage (with mocks)
- AI decision coverage: Low (tests don't call `decideBestMove()`)
- Strategy coverage: None (tests don't verify strategy logic)
- Sequence coverage: None (tests single states only)
- Multi-turn coverage: None

### Target Coverage (after replacement)
- AI decision coverage: High (all `decideBestMove()` calls tested)
- Strategy coverage: Complete (Big Money strategy tested across coin levels)
- Sequence coverage: Comprehensive (14 integration tests for various sequences)
- Multi-turn coverage: Full games tested

---

## Implementation Checklist

- [x] Create `ai-gameplay-integration.test.ts` with 14 real tests
- [x] Document mock replacement plan
- [ ] Phase 3: Create `ai-buy-strategy.test.ts` to replace UT 2.6-2.11
- [ ] Phase 3: Create `ai-action-strategy.test.ts` to replace UT 2.3-2.5
- [ ] Phase 3: Mark old tests in `rules-based-ai.test.ts` as `@deprecated`
- [ ] Phase 3: Retire weak mock-based tests

---

## References

- **Real Integration Test Examples**: `ai-treasure-strategy.test.ts`, `ai-decision-logic.test.ts`
- **New Integration Tests**: `ai-gameplay-integration.test.ts` (14 tests, all passing)
- **Mock Test Analysis**: Lines 43-62, 200-379 in `rules-based-ai.test.ts`
- **MCP Wrapper Tests** (Keep as-is): `game-execute.test.ts` UT3.1-3.X
