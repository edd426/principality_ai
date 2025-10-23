# Google's Unit Testing Principles

**Source**: Software Engineering at Google, Chapter 12: Unit Testing
**Authority**: Google's authoritative engineering practices guide
**Reference**: https://abseil.io/resources/swe-book/html/ch12.html
**Last Updated**: 2025-10-23
**Status**: Unmodified reference material - Use for test audit baseline

---

## Introduction

Unit tests form the foundation of a healthy test suite. Google's approach to unit testing emphasizes that valuable tests serve two critical purposes: **preventing bugs** and **improving engineers' productivity**.

---

## Core Principle: Maintainability as Primary Goal

The most critical insight from Google's experience at massive scale:

> **"Maintainable tests are ones that 'just work': after writing them, engineers don't need to think about them again until they fail."**

Brittle, unclear tests drain productivity rather than enhance it. This principle supersedes coverage metrics and code style preferences.

---

## Fundamental Principles for Quality Tests

### 1. Strive for Unchanging Tests (The Most Important Principle)

The ideal test never requires modification unless system requirements fundamentally change.

**Test Stability Through Production Code Changes**:
- ✅ **Stable through refactorings**: Tests remain unchanged when internal structure changes
- ✅ **Stable through new features**: Tests remain unchanged when new unrelated features are added
- ✅ **Stable through bug fixes**: Tests remain unchanged when bugs in other areas are fixed
- ❌ **Changed only for behavior changes**: Only when actual system behavior requirements change

**Why This Matters**: Tests that break for legitimate reasons (refactoring, new features) signal they're testing implementation details rather than behavior.

### 2. Test Public APIs, Not Implementation Details

**The Most Important Practice**:

> "Write tests that invoke the system being tested in the same way its users would; that is, make calls against its public API rather than its implementation details."

**Consequences of Testing Implementation**:
- Tests break every time internal code structure changes
- Tests couple development to specific implementations
- Refactoring becomes risky (might break tests for no behavior reason)
- Hidden from reality (users call public APIs, not implementation)

**Example of Wrong Approach**:
```typescript
// ❌ BAD: Testing internal state
expect(game.state.hand).toContain('Copper');
expect(game.phase).toBe('buy');

// ✅ GOOD: Testing public behavior
const result = game.executeMove('buy Copper');
expect(result.success).toBe(true);
expect(game.getCurrentPhase()).toBe('cleanup');
```

### 3. Test Behaviors, Not Methods

Rather than creating one test per method, frame tests around behaviors using given/when/then structure.

**Key Insight**: A single method often implements multiple behaviors, and some behaviors span multiple methods. Testing methods creates artificial relationships in test code.

**Better Approach: Behavior-Driven**
```typescript
// ❌ BAD: One test per method
describe('hand', () => {
  it('should have hasCard method', () => { ... });
  it('should have removeCard method', () => { ... });
});

// ✅ GOOD: Test behaviors
describe('When player plays a Copper card', () => {
  it('should generate 1 coin', () => { ... });
  it('should remove card from hand', () => { ... });
});
```

### 4. Clarity: Tests Must Communicate Three Things

**Upon reading a test, it must clearly show**:
1. **The behavior being validated** - What aspect of the system is being tested?
2. **Why the test failed** - Through descriptive failure messages
3. **How to fix the problem** - From context, not from error messages alone

**Avoiding Logic in Tests**:
> "If you feel like you need to write a test to verify your test, something has gone wrong!"

Tests should be simple and obvious. If you're writing helper functions or doing conditional logic in tests, the test is too complex.

**Effective Test Naming**:
Test names should summarize behavior and expected outcomes. Good test names help engineers diagnose failures from log reports alone.

**Bad Names**:
```typescript
it('works', () => { ... });
it('test buy phase', () => { ... });
it('handles cards', () => { ... });
```

**Good Names**:
```typescript
it('should buy the card when player has sufficient coins', () => { ... });
it('should reject purchase when player lacks coins', () => { ... });
it('should advance to cleanup phase after buying', () => { ... });
```

### 5. Code Sharing: DAMP Over DRY

Google explicitly rejects strict DRY (Don't Repeat Yourself) principles for test code.

> "Promote DAMP—'Descriptive And Meaningful Phrases'"

A small amount of duplication improves clarity when it makes tests more understandable and self-contained.

**Recommended Approaches**:
- **Helper methods for test values**: Allow specifying only relevant parameters while setting reasonable defaults
- **Minimal setup methods**: Limited to constructing objects and basic collaborators
- **Focused validation helpers**: Assert single conceptual facts rather than performing multiple checks

**Anti-Pattern Example**:
```typescript
// ❌ Over-DRYed (hard to understand)
const player = createTestPlayer({ hand: ['Copper', 'Copper'] });
expect(player.getCoins()).toBe(2);

// ✅ More explicit (clearer intent)
const player = new Player();
player.hand = ['Copper', 'Copper'];
expect(player.getCoins()).toBe(2);
```

---

## Practical Test Categories

### Unit Tests (80% of your tests)
- Test individual functions or classes in isolation
- Fast (milliseconds)
- Deterministic (never flaky)
- Example: Test that playing a Copper card generates 1 coin

### Integration Tests (15% of your tests)
- Test multiple components working together
- Moderate speed (seconds)
- Must be reliable and deterministic
- Example: Test that game correctly transitions between phases

### End-to-End Tests (5% of your tests)
- Test complete user workflows
- Slower (may use UI, databases, networks)
- Most prone to flakiness
- Example: Test complete game from start to finish

**The Test Pyramid**: Pursue this distribution (80/15/5) for efficiency and reliability.

---

## Test Quality Indicators

### Signs of Good Tests
- ✅ Tests pass consistently (never flaky)
- ✅ Tests remain unchanged through refactoring
- ✅ Test names clearly describe what's being tested
- ✅ Test failures clearly indicate what broke
- ✅ Tests verify public behavior, not internal state
- ✅ Each test validates one behavior
- ✅ Setup is minimal and obvious
- ✅ Assertions are clear and specific

### Signs of Poor Tests
- ❌ Tests sometimes pass, sometimes fail (flaky)
- ❌ Tests break when code is refactored
- ❌ Vague names like "test", "works", "should handle"
- ❌ Tests verify implementation details
- ❌ Multiple behaviors mixed in one test
- ❌ Complex setup obscures what's being tested
- ❌ Assertions are assertions are vague or coupled to implementation
- ❌ Tests require modification for legitimate code changes

---

## Key Anti-Patterns to Avoid

### 1. Testing Implementation Rather Than Behavior
Tests tightly coupled to internal structure break during refactoring.

### 2. Flaky or Non-Deterministic Tests
Tests that sometimes pass and sometimes fail undermine confidence and waste time.

### 3. Excessive Mocking
Mocks are useful for isolation, but excessive mocking can mean you're testing stubs rather than real code.

### 4. Brittle Tests
Tests that break for any code change signal they're testing the wrong thing.

### 5. Logic in Tests
If tests contain conditional logic or loops, they're too complex and need simplification.

### 6. Poor Test Names
Vague names like "test1", "should work", "handles input" don't communicate intent.

### 7. Ignoring Non-Determinism
Asynchronous operations, timing dependencies, and random number generation cause flakiness.

---

## Infrastructure and Test Organization

### Test Infrastructure Must Have Tests
Test utilities, helpers, and infrastructure should themselves be tested. Fragmented infrastructure creates inconsistency.

### Standardization Across Projects
Organization-wide standardization prevents teams from creating their own mini-frameworks.

### Test Maintenance
Tests require ongoing maintenance alongside production code. Treating tests as second-class code leads to decay.

---

## Summary: Core Maxims

1. **Make tests unchanging** through refactoring and feature additions
2. **Test public APIs**, not implementation details
3. **Test behaviors**, not individual methods
4. **Write clear tests** that communicate their purpose
5. **Prefer clarity over DRY** in test code (use DAMP)
6. **Aim for 80/15/5** test distribution (unit/integration/E2E)
7. **Keep tests simple** - if you need a test to verify your test, something is wrong
8. **Eliminate flakiness** - tests must be reliable and deterministic
9. **Test infrastructure** like any other code
10. **Maintain tests** as carefully as production code

---

## How to Use This Document in Test Audits

When auditing tests, evaluate each against these principles:

1. **Stability**: Does the test break when code is refactored legitimately?
2. **Public API**: Does the test use public APIs or poke internal implementation?
3. **Behavior**: Does the test verify a behavior or just a method?
4. **Clarity**: Would a new developer immediately understand what the test validates?
5. **Maintenance**: Would developers want to maintain this test?

Tests that fail most of these criteria are candidates for rewriting or removal.
