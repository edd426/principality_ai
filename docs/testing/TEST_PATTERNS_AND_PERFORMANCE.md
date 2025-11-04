# Test Patterns and Performance Guidelines

**Status**: ACTIVE
**Created**: 2025-10-23
**Phase**: 2
**Audience**: Development Team

---

## Part 1: Test Pattern Best Practices

### Overview

This document consolidates testing best practices based on Google's software engineering principles and project learnings from Phase 1-2 development.

---

### Pattern 1: Behavior-Focused Testing (Not Implementation Details)

#### ❌ BAD: Tests implementation details

```typescript
test('should return success response', () => {
  const response = execute(move);
  expect(response).toHaveProperty('success');      // ← Response structure
  expect(response.error?.message).toBeDefined();   // ← Error format
  expect(response.phaseChanged).toBeDefined();     // ← Response field
});
```

**Problems**:
- Tests break when response structure changes
- Even if behavior is correct, tests fail
- Couples tests to implementation

#### ✅ GOOD: Tests actual behavior

```typescript
test('should prevent invalid moves from executing', () => {
  const initialState = getGameState();
  const initialCoins = initialState.players[0].coins;

  executeMove({ type: 'buy', card: 'Province' });

  const finalState = getGameState();

  // Verify BEHAVIOR: coins unchanged (move prevented)
  expect(finalState.players[0].coins).toBe(initialCoins);
});
```

**Benefits**:
- Tests survive response refactoring
- Focus on game integrity
- Clear behavioral intent

#### Implementation Checklist

```
For each test:
  ☐ Identify what it tests (behavior vs. implementation)
  ☐ Replace assertions on response format with behavior checks
  ☐ Verify test fails if behavior breaks
  ☐ Remove assertions on private fields or internal state
  ☐ Test via public API only
```

---

### Pattern 2: TDD - Tests Before Implementation

#### ✅ Correct TDD Workflow

1. **DEFINE** requirements in tests (RED phase)
2. **IMPLEMENT** feature to pass tests (GREEN phase)
3. **REFACTOR** while tests pass (REFACTOR phase)

#### Example: Multi-Card Chains Feature

```typescript
// STEP 1: Define requirements with tests
describe('Multi-Card Chains', () => {
  test('should execute multiple moves in sequence', () => {
    // @req: Chain [buy Market, buy Silver] executes in order
    // @edge: Second move uses coins from first move
    // @why: Complex sequences must work atomically

    const state = gameState.withCoins(10).withBuys(2);

    const result = executeChain([
      { type: 'buy', card: 'Market' },   // costs 5 coins
      { type: 'buy', card: 'Silver' }    // costs 3 coins (5 remain)
    ]);

    expect(result.success).toBe(true);
    expect(result.state.players[0].hand).toContain('Market', 'Silver');
  });
});

// STEP 2: Implement to pass tests
// STEP 3: Refactor (tests keep passing)
```

#### Anti-Pattern: Implementation First

```typescript
// ❌ Bad: Implementation without tests
// Code committed without tests → creates coverage gap
// Developers don't know if feature works as intended
// Bug fix later = test needed after the fact
```

---

### Pattern 3: Test Clarity (Self-Documenting Tests)

#### ✅ GOOD: Clear test names + documentation tags

```typescript
describe('UT2.1: Valid Move Execution', () => {
  test('should apply card effects when playing action card', () => {
    // @req: Playing Village gives +1 card and +2 actions
    // @input: hand has Village, execute play_action move
    // @output: hand grows by 1, actions increase by 2
    // @assert: Card effects applied correctly
    // @level: Unit
    // @edge: Check both effects (cards AND actions)
    // @why: Action cards define game mechanics

    const initial = getState();
    playCard('Village');
    const final = getState();

    expect(final.players[0].hand.length)
      .toBe(initial.players[0].hand.length + 1);
    expect(final.players[0].actions)
      .toBe(initial.players[0].actions + 2);
  });
});
```

#### Tag Reference

| Tag | Purpose | Example |
|-----|---------|---------|
| `@req` | Core requirement | "Player can play action cards" |
| `@input` | Test setup | "hand has Village, 1 action" |
| `@output` | Expected result | "hand grows, actions increase" |
| `@assert` | What we verify | "Card effects applied correctly" |
| `@level` | Test type | "Unit", "Integration", "E2E" |
| `@edge` | Edge case covered | "Multiple treasures combine" |
| `@why` | Business reason | "Core game mechanic" |

#### Benefits

- **Clarity**: Anyone can understand test intent
- **Maintenance**: Clear what will break if test fails
- **Requirements**: Tests ARE the specification
- **Communication**: Tags help team understand coverage

---

### Pattern 4: Minimal Assertions (One Logical Fact Per Test)

#### ✅ GOOD: Each test verifies one thing

```typescript
test('should add card to hand when drawing', () => {
  // ONE assertion: focused, clear, fast to fail
  expect(hand.length).toBe(initialLength + 1);
});

test('should remove card from hand when playing', () => {
  // ONE assertion: different test for different behavior
  expect(hand.length).toBe(initialLength - 1);
});
```

#### ❌ BAD: Multiple unrelated assertions

```typescript
test('should handle card play correctly', () => {
  // TOO MANY: If test fails, which assertion failed?
  // CONFUSING: What's the actual requirement?

  expect(hand.length).toBe(initialLength - 1);
  expect(inPlay.length).toBe(1);
  expect(coins).toBeGreaterThan(0);
  expect(actions).toBeLessThanOrEqual(3);
  // ... 10 more assertions
});
```

---

### Pattern 5: Test Independence (No Shared State)

#### ❌ BAD: Tests depend on each other

```typescript
describe('Game', () => {
  let gameState;

  test('A: initialize game', () => {
    gameState = new Game();  // ← Shared state
    expect(gameState.phase).toBe('action');
  });

  test('B: execute move', () => {
    // FAILS if test A doesn't run first!
    // Broken if tests run in different order!
    executeMove(gameState, move);
    expect(gameState.phase).toBe('buy');
  });
});
```

#### ✅ GOOD: Each test is independent

```typescript
describe('Game', () => {
  let gameState;

  beforeEach(() => {
    // FRESH state for each test
    gameState = new Game();
  });

  test('A: initialize game', () => {
    expect(gameState.phase).toBe('action');
  });

  test('B: execute move', () => {
    // Completely independent - can run in any order
    executeMove(gameState, move);
    expect(gameState.phase).toBe('buy');
  });
});
```

---

### Pattern 6: Meaningful Test Names

#### ❌ BAD: Vague names

```typescript
test('test1', () => { ... });
test('it works', () => { ... });
test('game', () => { ... });
test('should handle', () => { ... });
```

#### ✅ GOOD: Descriptive names

```typescript
test('should apply Village card effects (draw 1, gain 2 actions)', () => { ... });
test('should prevent playing action card in buy phase', () => { ... });
test('should correctly calculate VP from Estate, Duchy, Province', () => { ... });
```

**Benefits**:
- Test output is self-documenting
- Debugging failures is faster
- Can diagnose issues without reading test code

---

## Part 2: Performance Thresholds

### Overview

Performance tests ENFORCE thresholds rather than just reporting them.

---

### Pattern: Performance Assertion (Not Advisory)

#### ❌ BAD: Advisory only (doesn't fail)

```typescript
test('should execute move quickly', () => {
  const start = Date.now();
  executeMove(state, move);
  const elapsed = Date.now() - start;

  // ❌ Just logs, doesn't enforce
  console.log(`Move took ${elapsed}ms`);

  // Test still passes even if elapsed is 5000ms!
});
```

#### ✅ GOOD: Assertion enforces threshold

```typescript
test('should execute move in < 10ms', () => {
  const start = Date.now();
  executeMove(state, move);
  const elapsed = Date.now() - start;

  // ✅ Test FAILS if threshold exceeded
  expect(elapsed).toBeLessThan(10);
});
```

---

### Baseline Thresholds

| Operation | Target | Max Time | Rationale |
|-----------|--------|----------|-----------|
| Game initialization | <50ms | 100ms | Fresh game startup |
| Single move execution | <10ms | 20ms | Responsive gameplay |
| Get valid moves | <5ms | 10ms | UI feedback |
| State immutability check | <1ms | 5ms | Shallow comparison |
| Phase transition | <5ms | 10ms | Between phases |
| Full turn cycle | <200ms | 500ms | Action→Buy→Cleanup |
| Shuffle (new deck) | <50ms | 100ms | Rare operation |

#### Threshold Adjustment Process

1. **Establish baseline**: Run on production hardware
2. **Add assertion**: `expect(elapsed).toBeLessThan(baseline * 1.5)`
3. **Monitor in CI**: Catch regressions early
4. **Adjust if needed**: Update when fundamentals change

---

### Performance Test Template

```typescript
describe('Performance: Move Execution', () => {
  test('should execute move within 10ms threshold', () => {
    // @req: Move execution < 10ms (user perceives as instant)
    // @perf: Critical for UI responsiveness
    // @tolerance: 20ms max (200% of target)

    const state = gameState.withCards(/* realistic hand */);
    const move = engine.getValidMoves(state)[0];

    const start = Date.now();
    engine.executeMove(state, move);
    const elapsed = Date.now() - start;

    // ✅ Enforces threshold, fails if exceeded
    expect(elapsed).toBeLessThan(20); // 2x tolerance
  });

  test('should handle 100-move sequence in < 1s', () => {
    // @req: Full game playable without lag
    // @perf: ~10ms per move target

    let state = gameState;
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      const moves = engine.getValidMoves(state);
      if (moves.length > 0) {
        const result = engine.executeMove(state, moves[0]);
        if (result.newState) state = result.newState;
      }
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000); // ~10ms per move
  });
});
```

---

## Part 3: Test Coverage Summary

### Coverage by Package

#### @principality/core
- **Quality**: 82-85%
- **Tests**: 40+ (game mechanics)
- **Focus**: Game engine, card effects, state management
- **Gaps**: Card combination scenarios

#### @principality/cli
- **Quality**: 75% → 85%+ (improved Phase 1.5+)
- **Tests**: 584+ (all features)
- **Focus**: Parser, Display, Commands, Features
- **Strengths**: Complete feature coverage

#### @principality/mcp-server
- **Quality**: 68% (improving)
- **Tests**: 31+ real (+ 27 pending)
- **Issues**: game_observe has placeholder tests
- **Plan**: Phase 2.1+ implementation

---

## Part 4: Quality Metrics

### What Gets Measured?

| Metric | Target | Method | Tool |
|--------|--------|--------|------|
| Test Coverage | 95%+ | Code path coverage | Jest --coverage |
| Quality Score | 85%+ | Audit checklist | Manual + test audit |
| Pass Rate | 100% | CI/CD | GitHub Actions |
| Performance | <10ms move | Assertions | Jest --testTimeout |
| Flakiness | 0% | Test runs | CI/CD history |

### Anti-Metrics (❌ Don't Optimize For)

```
❌ Line coverage percentage alone
   → Can be 100% with meaningless tests

❌ Test count
   → 1000 placeholder tests worse than 100 real tests

❌ Avoiding E2E tests
   → Some behaviors MUST be tested end-to-end

❌ 100% code coverage
   → Diminishing returns after 95%
```

---

## Part 5: TDD Workflow Summary

### Feature Development Checklist

```
New Feature: [Name]

□ Phase 1: Requirements
  □ Define feature in requirements document
  □ List acceptance criteria
  □ Identify edge cases
  □ Define performance targets

□ Phase 2: Testing (FIRST)
  □ Write unit tests
  □ Write integration tests (if applicable)
  □ Write E2E tests (if user-facing)
  □ Include edge case tests
  □ All tests FAIL (RED phase)

□ Phase 3: Implementation
  □ Implement feature
  □ Run tests frequently (every small step)
  □ All tests PASS (GREEN phase)
  □ Commit with message referencing tests

□ Phase 4: Quality Review
  □ Tests document behavior
  □ Code coverage > 95%
  □ No performance regression
  □ Code review (team)

□ Phase 5: Release
  □ All tests passing in CI/CD
  □ Deployment ready
  □ Tests become regression detection
```

---

## Part 6: Common Test Anti-Patterns (And Fixes)

### Anti-Pattern 1: Placeholder Tests

```typescript
// ❌ BAD
test('should return minimal detail', () => {
  expect(true).toBe(true);  // ← Meaningless!
});

// ✅ GOOD
test('should return minimal detail with < 100 tokens', () => {
  const response = gameObserve({ detail: 'minimal' });
  const tokens = estimateTokens(response);
  expect(tokens).toBeLessThan(100);
});
```

### Anti-Pattern 2: Over-Mocking

```typescript
// ❌ BAD: Mocks everything, tests nothing real
test('should handle move', () => {
  jest.spyOn(engine, 'executeMove').mockReturnValue({});
  jest.spyOn(state, 'update').mockReturnValue({});
  jest.spyOn(validator, 'isValid').mockReturnValue(true);

  // At this point, we're not testing anything real!
  execute(move);
});

// ✅ GOOD: Mock only external dependencies
test('should handle move', () => {
  // Use REAL engine, REAL state
  // Only mock external API calls
  jest.spyOn(api, 'fetchRemoteConfig').mockResolvedValue({});

  // Now test actual behavior
  execute(move);
});
```

### Anti-Pattern 3: Flaky Tests

```typescript
// ❌ BAD: Timing assumptions
test('should shuffle quickly', (done) => {
  setTimeout(() => {
    shuffle();
    done();  // ← Race condition!
  }, 100);
});

// ✅ GOOD: No timing assumptions
test('should shuffle correctly', () => {
  const original = [...cards];
  const shuffled = shuffle(original);

  // Verify behavior: all cards present, order changed
  expect(shuffled).toHaveLength(original.length);
  expect(shuffled).not.toEqual(original);
});
```

---

## References

- **Google Software Engineering Book**: Chapter 12 (Unit Testing Principles)
- **Project Audit**: `.claude/audits/tests/2025-10-23-test-audit.md`
- **Best Practices**: `.claude/audits/best-practices/`
- **TDD Compliance**: `.claude/audits/tests/TDD_COMPLIANCE_GAPS.md`

---

## Next Steps

1. **Implement game_session tests** (Phase 2)
2. **Convert game_observe placeholders** (Phase 2.1)
3. **Add card combination tests** (Phase 2.5)
4. **Complete E2E mocking** (Phase 3)
5. **Review and update** (Every phase end)

---

**Last Updated**: 2025-10-23
**Audience**: Development Team
**Review Cycle**: End of each phase
