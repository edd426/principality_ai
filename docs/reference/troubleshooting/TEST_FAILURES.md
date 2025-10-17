# Test Failure Analysis Report

**Status**: ACTIVE
**Created**: 2025-10-15
**Last Updated**: 2025-10-17 (moved during documentation reorganization)
**Phase**: 1.5
**Total Failures**: 32 out of 389 tests

---

## Executive Summary

All 32 test failures fall into 3 categories:
1. **Outdated Test Expectations (Feature 6)**: Tests expecting old display format without card costs ✅ **FIX TESTS**
2. **Test Data Issues**: Tests using fake card names that don't exist in card catalog ❌ **BUG IN TESTS**
3. **Missing Error Handling**: Implementation lacks null/undefined guards ⚠️ **REPORT TO DEV-AGENT**

**Decision**:
- Update tests for Feature 6 (card cost display) ✅
- Fix test data to use real card names ✅
- Flag null-handling issues for dev-agent ⚠️

---

## Detailed Failure Analysis (All 32 Tests)

### Category A: Feature 6 Display Format Changes (11 failures)

These tests expect the OLD display format without card costs. Feature 6 requirements MANDATE showing costs.

#### A1. display.test.ts: "should handle missing supply categories"
**Line**: 236
**Failure**:
```
Expected: expect(consoleCapture.contains('Victory:')).toBe(false);
Received: true
```

**Root Cause**: Test creates supply with only Copper, expects "Victory:" label to be absent. But implementation now ALWAYS shows all categories with pricing.

**Implementation (display.ts:130-135)**:
```typescript
if (victory.length > 0) {
  console.log('  Victory:   ' + this.formatSupplyGroup(victory));
}
```

**Analysis**:
- Current impl correctly shows Victory label ONLY if victory cards exist
- BUT the test creates supply with only Copper, so victory.length === 0
- The label SHOULD be absent per current logic
- Yet test fails saying Victory: IS present

**Wait, let me re-examine the test data...**

Looking at test (line 226-238):
```typescript
const state = GameStateBuilder.create()
  .withSupply({
    'Copper': 46 // Only treasures
  })
  .build();
```

This creates ONLY Copper in supply. No victory cards. So `victory.length` should be 0, and "Victory:" should NOT be printed.

**But the test is FAILING** - meaning "Victory:" IS being printed when it shouldn't be.

**This is an IMPLEMENTATION BUG**. The display code is showing empty categories.

❌ **DO NOT FIX TEST** - This is catching a real bug!

---

#### A2. display.test.ts: "should display complete game over information"
**Line**: 296
**Failure**:
```
Expected pattern: /Player 1: 15 VP ★ WINNER/
Received: "Player 1: 15 VP (3 VP (3E)) ★ WINNER"
```

**Root Cause**: Feature 5 (VP Display) added VP breakdown to game over screen. Test expects old format without breakdown.

**Implementation (display.ts:174)**:
```typescript
const vpDisplay = formatVPDisplay(player);
console.log(`  Player ${index + 1}: ${score} VP (${vpDisplay}) ${marker}`);
```

**Analysis**:
- Implementation correctly shows: "15 VP (3 VP (3E))" - total score + VP breakdown
- Test expects: "15 VP" - just the total
- Feature 5 requirements (CLI_PHASE2_1_REQUIREMENTS.md FR-5.1): VP MUST be displayed
- Game over screen should show final VP breakdown

**Decision**: ✅ UPDATE TEST - Implementation is correct per Feature 5 requirements

---

#### A3. display.test.ts: "should mark winner correctly"
**Line**: 324
**Failure**:
```
Expected: expect(consoleCapture.contains('Player 2: 15 VP ★ WINNER')).toBe(true);
Received: false
```

**Root Cause**: Same as A2 - VP breakdown added to format. String match fails because actual output is "Player 2: 15 VP (breakdown) ★ WINNER"

**Decision**: ✅ UPDATE TEST - Use regex pattern to match partial string

---

#### A4. display.test.ts: "should display comprehensive help information"
**Line**: 367
**Failure**:
```
Expected pattern: /exit.*Exit the game/
Received: "quit         - Exit the game (alias: exit)"
```

**Root Cause**: Help text shows "exit" as an alias, not as a standalone command line

**Analysis**:
- Implementation (display.ts:213): `quit         - Exit the game (alias: exit)`
- Test expects: line starting with "exit"
- This is correct! "exit" is an ALIAS, not a primary command
- Help text correctly documents it as an alias

**Decision**: ✅ UPDATE TEST - Test expectation is wrong. "exit" IS documented, just as an alias.

---

### Category B: Test Data Issues - Fake Card Names (3 failures)

These tests use fake card names that don't exist in the card catalog, causing `getCard()` to throw errors.

#### B1. display.test.ts: "should display supply quickly"
**Line**: 433 (test at line 146-158 in actual file)
**Failure**:
```
Unknown card: Card0
  at getCard (../core/src/cards.ts:126:11)
  at src/display.ts:144:27
```

**Root Cause**: Performance test creates 30 fake cards named "Card0", "Card1", etc. These don't exist in card catalog. When `formatSupplyGroup()` calls `getCard(name)`, it throws.

**Test Code (line 147-151)**:
```typescript
const state = GameStateBuilder.create()
  .withSupply(Object.fromEntries(
    Array(30).fill(0).map((_, i) => [`Card${i}`, 10])
  ))
  .build();
```

**Analysis**:
- Test is trying to stress-test display performance with many cards
- But uses fake card names that don't exist
- Implementation correctly throws error for unknown cards
- This is a TEST BUG, not an implementation bug

**Decision**: ✅ FIX TEST - Use real card names or mock `getCard()`

---

#### B2. performance.test.ts: "should display supply quickly"
**Line**: 780
**Same issue as B1** - Same root cause, same test pattern, same fix needed.

**Decision**: ✅ FIX TEST - Use real card names or mock `getCard()`

---

#### B3. performance.test.ts: "should handle very large game states"
**Line**: 802
**Failure**:
```
Unknown card: StressCard0
```

**Same pattern** - Stress test uses fake card names.

**Decision**: ✅ FIX TEST - Use real card names or mock `getCard()`

---

### Category C: Null/Undefined Handling (2 failures)

Implementation lacks defensive guards for null/undefined states.

#### C1. display.test.ts: "should handle null/undefined states gracefully"
**Line**: 487 (test at 206-209)
**Failure**:
```
TypeError: Cannot read properties of null (reading 'players')
  at Display.displayGameState (src/display.ts:25:26)
```

**Test Code**:
```typescript
// @ts-expect-error Testing robustness
expect(() => display.displayGameState(null)).not.toThrow();
```

**Implementation (display.ts:24-25)**:
```typescript
displayGameState(state: GameState): void {
  const player = state.players[state.currentPlayer]; // ❌ No null check
```

**Analysis**:
- Test explicitly checks robustness with null input
- Implementation lacks null guards
- TypeScript types say GameState is non-nullable, but test wants runtime safety
- This is an edge case for robustness

**Question**: Should the implementation handle null, or should tests not pass null?

**Decision**: ⚠️ **ESCALATE TO DEV-AGENT** - This is a design decision:
  - Option A: Add null guards (defensive programming)
  - Option B: Remove robustness tests (trust TypeScript types)

---

#### C2. display.test.ts: "should handle states with missing properties"
**Line**: 499 (test at 211-221)
**Failure**:
```
TypeError: Cannot read properties of undefined (reading 'hand')
  at Display.displayPlayerHand (src/display.ts:42:32)
```

**Same issue as C1** - Partial state object causes crash.

**Decision**: ⚠️ **ESCALATE TO DEV-AGENT** - Same design decision

---

### Category D: Move Execution Display Format (6 failures)

Tests expect "✓" checkmark in move execution output, but it's not appearing.

#### D1. cli.test.ts: "should execute valid moves successfully"
**Line**: 177
**Failure**:
```
Expected: expect(consoleCapture.contains('✓')).toBe(true);
Received: false
```

**Test Code (line 163-177)**:
```typescript
mockReadline.addInput('1');
await cli.start();
expect(consoleCapture.contains('✓')).toBe(true);
```

**Analysis**: Test executes a move and expects success checkmark. Need to check where checkmarks are displayed in move execution flow.

**Looking at cli.ts** - need to trace how moves are executed and displayed.

**Question**: Is the checkmark not being displayed, or is the test mock setup incorrect?

**This requires deeper investigation of the CLI execution flow.**

**Decision**: ⚠️ **INVESTIGATE FURTHER** - Need to trace execution flow

---

#### D2-D6: Similar checkmark-related failures
- cli.test.ts: "should handle unknown commands" (line 284)
- integration.test.ts: "should execute valid moves through engine" (line 118)
- integration.test.ts: "should handle complete turn cycle" (line 165)
- integration.test.ts: "should handle complete action phase" (line 309)
- integration.test.ts: "should recover from errors and continue with features" (line 849)

**All have same pattern** - expecting "✓" checkmark that's not appearing.

**Decision**: ⚠️ **INVESTIGATE FURTHER** - Same root cause as D1

---

### Category E: Error Resilience - Missing Try/Catch (3 failures)

CLI should handle internal errors gracefully, but throws instead.

#### E1. cli.test.ts: "should handle parser errors gracefully"
**Line**: 436
**Failure**:
```
expect(received).resolves.not.toThrow()
Received promise rejected instead of resolved
Rejected to value: [Error: Parser error]
```

**Test Code (line 425-437)**:
```typescript
const mockParseInput = jest.spyOn(cli['parser'], 'parseInput')
  .mockImplementation(() => { throw new Error('Parser error'); });

await expect(cli.start()).resolves.not.toThrow();
```

**Analysis**: Test mocks parser to throw error, expects CLI to catch and handle gracefully. But CLI doesn't have try/catch around parser calls.

**Decision**: ⚠️ **REPORT TO DEV-AGENT** - Missing error handling in CLI main loop

---

#### E2-E3: Similar error handling failures
- cli.test.ts: "should handle display errors gracefully" (line 453)
- cli.test.ts: "should handle readline errors gracefully" (line 468)
- integration.test.ts: "should handle engine errors in CLI context" (line 504)
- integration.test.ts: "should handle corrupted game state gracefully" (line 488)

**All expect graceful error handling that's missing.**

**Decision**: ⚠️ **REPORT TO DEV-AGENT** - Same issue as E1

---

### Category F: State Immutability Test Expectations (3 failures)

Tests capture initial state and expect it to remain unchanged. Failing due to Map vs Object comparison.

#### F1. cli.test.ts: "should maintain game state consistency across moves"
**Line**: 589
**Failure**:
```
- Expected  - supply: Object {}
+ Received  + supply: Map { 'Copper' => 60, ... }
```

**Test Code (line 586-589)**:
```typescript
const initialState = JSON.parse(JSON.stringify(cli['gameState']));
const cli2 = new PrincipalityCLI('test-seed-deterministic');
expect(cli2['gameState']).toEqual(initialState);
```

**Root Cause**: Test uses `JSON.parse(JSON.stringify())` to capture initial state. This destroys the Map, converting it to `{}`. Then compares against new CLI instance which has a proper Map.

**Analysis**: This is a TEST BUG - the JSON round-trip destroys the Map. The comparison is invalid.

**Decision**: ✅ FIX TEST - Don't use JSON round-trip to capture state. Use proper deep equality check.

---

#### F2-F3: Same Map comparison issues
- integration.test.ts: "should maintain game state immutability" (line 144)
- integration.test.ts: "should maintain state consistency across display operations" (line 456)

**Decision**: ✅ FIX TEST - Same fix as F1

---

### Category G: Feature Integration Tests (10 failures)

Tests for Phase 1.5 feature combinations are failing.

#### G1. integration.test.ts: "should auto-play treasures mid-chain when transitioning to buy phase"
**Line**: 600
**Failure**:
```
Expected: expect(consoleCapture.contains('Auto-playing treasures')).toBe(true);
Received: false
```

**Analysis**: Test expects specific output message that may not match actual implementation.

**Decision**: ⚠️ **INVESTIGATE** - Check if feature is implemented correctly

---

#### G2. integration.test.ts: "should handle treasure command in chain"
**Line**: 615
**Failure**:
```
Expected: expect(consoleCapture.contains('Cannot mix moves and commands')).toBe(true);
Received: false
```

**Analysis**: Test expects error message for mixing moves and commands in chain.

**Decision**: ⚠️ **INVESTIGATE** - Check chain validation logic

---

#### G3-G10: Similar feature integration failures
Multiple tests checking stable numbers, VP display, chain rollback, and error messages.

**Pattern**: Tests expect specific output messages that don't match implementation.

**Decision**: ⚠️ **INVESTIGATE** - Need to check actual implementation vs test expectations

---

## Summary by Category

| Category | Count | Action Required |
|----------|-------|-----------------|
| Feature 6 Display Format | 4 | ✅ Update tests to match new format |
| Test Data - Fake Cards | 3 | ✅ Fix test data to use real cards |
| Null Handling | 2 | ⚠️ Escalate design decision to dev-agent |
| Move Execution Display | 6 | ⚠️ Investigate execution flow |
| Error Resilience | 5 | ⚠️ Report missing error handling |
| State Immutability | 3 | ✅ Fix JSON round-trip bug in tests |
| Feature Integration | 10 | ⚠️ Investigate implementation vs expectations |

---

## Next Steps

### Immediate Actions (Test Fixes)
1. ✅ Update 4 display format tests for Feature 5/6
2. ✅ Fix 3 tests using fake card names
3. ✅ Fix 3 state comparison tests (Map vs Object)

### Investigation Required
1. ⚠️ Trace move execution flow to find missing checkmarks (6 tests)
2. ⚠️ Check feature integration implementation (10 tests)

### Escalate to Dev-Agent
1. ⚠️ Null/undefined handling design decision (2 tests)
2. ⚠️ Missing error handling in CLI main loop (5 tests)
3. ⚠️ Display showing empty supply categories (1 test - A1)

---

## Test Integrity Assessment

**Tests That Are Correct (catching real bugs)**:
- A1: "should handle missing supply categories" - Catching bug where empty categories are shown
- C1-C2: Null handling tests - Exposing lack of defensive programming
- E1-E5: Error resilience tests - Exposing missing try/catch blocks

**Tests That Need Updating (outdated expectations)**:
- A2-A4: Display format tests - Feature 5/6 changed output format correctly
- B1-B3: Performance tests - Using fake data incorrectly
- F1-F3: State comparison tests - JSON round-trip bug in test code

**Tests That Need Investigation**:
- D1-D6: Checkmark display tests - Need to verify implementation
- G1-G10: Feature integration tests - Need to verify implementation

---

**Confidence Level**: HIGH for Categories A-F, MEDIUM for Categories D & G pending investigation

**Recommendation**: Proceed with fixing Categories A (partial), B, and F immediately. Investigate D and G before making changes. Escalate C and E to dev-agent.
