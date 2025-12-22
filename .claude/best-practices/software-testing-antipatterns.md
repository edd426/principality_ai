# Software Testing Anti-patterns

**Source**: "Software Testing Anti-patterns" by Kostis Kapelonis
**Authority**: Comprehensive catalog of testing pitfalls and failures
**Reference**: https://blog.codepipes.com/testing/software-testing-antipatterns.html
**Last Updated**: 2025-10-23
**Status**: Unmodified reference material - Use for identifying problematic test patterns

---

## Introduction

Testing anti-patterns are recurring solutions to common problems that produce negative consequences. This document catalogs 13 major anti-patterns that undermine software quality, explains why each is harmful, and identifies how to detect them in code reviews.

---

## The 13 Major Testing Anti-Patterns

### Anti-Pattern 1: Unit Tests Without Integration Tests

**Definition**: Relying exclusively on unit tests while ignoring integration testing.

**Why It's Harmful**:
- Unit tests validate isolated components but miss critical integration issues
- Database transactions, triggers, stored procedures can only be examined via integration tests
- Cross-cutting concerns (logging, caching, transactions) are invisible to unit tests alone
- Components that work in isolation may fail when combined

**Real-World Impact**:
Two components might pass all unit tests individually but fail when integrated due to:
- State sharing between components
- Unexpected side effects
- Configuration incompatibilities
- Data flow issues

**How to Detect It**:
```
- Test suite has 90%+ unit tests, <10% integration tests
- Feature works in unit tests but fails in actual deployment
- Mock dependencies prevent real interactions from being tested
```

**How to Fix It**:
- Add integration tests that use real (or close-to-real) dependencies
- Test actual workflows that span multiple components
- Include database operations, API calls, and message queues in tests

---

### Anti-Pattern 2: Integration Tests Without Unit Tests

**Definition**: Testing only at the integration/E2E level while ignoring unit tests.

**Why It's Harmful**:
- Exponential test complexity: Testing at integration level requires exponentially more test cases
- Poor diagnosis: When integration tests fail, it's hard to know which component caused the failure
- Slow feedback: Integration tests are slow; developers wait long for test results
- High maintenance burden: Brittle integration tests break for many reasons

**The Complexity Explosion**:
A service with 4 modules having cyclomatic complexities of 2, 5, 3, and 2:
- Unit tests required: 2 + 5 + 3 + 2 = **12 focused tests**
- Integration tests required: 2 × 5 × 3 × 2 = **60 possible tests** (exponential!)

**How to Detect It**:
```
- Test suite has almost no unit tests, mostly integration tests
- Test suite is very slow (takes minutes/hours to run)
- Test failures don't clearly indicate which component broke
- Same logic tested many times from different integration angles
```

**How to Fix It**:
- Add focused unit tests for individual modules
- Use mocks to isolate dependencies
- Reserve integration tests for critical workflows only
- Apply the Test Pyramid: 80% unit, 15% integration, 5% E2E

---

### Anti-Pattern 3: Wrong Test Distribution

**Definition**: Not distributing tests according to application risk and complexity.

**Why It's Harmful**:
- Different applications have different critical areas
- Pursuing arbitrary 100% coverage wastes effort on unimportant code
- Ignoring critical code creates unnecessary risk

**The Rule of 20%**:
> "Try to write tests that work towards 100% coverage of critical code, not total coverage."

Typically 20% of code is critical and changes frequently (business logic). This 20% deserves:
- Deep unit test coverage
- Integration tests
- Focused E2E tests

The remaining 80% (utilities, helpers, glue code) deserves:
- Basic unit tests
- Minimal integration coverage

**How to Detect It**:
```
- Test suite has 100% coverage but tests are brittle
- High test-to-code ratio but few tests catch real bugs
- Most test coverage is in trivial code (getters, setters, config)
- Critical business logic has minimal test coverage
```

**How to Fix It**:
- Identify critical code (business logic, complex algorithms, integration points)
- Concentrate 80% of test effort on that 20% of code
- Use risk-based testing rather than percentage-based metrics
- Accept lower coverage in non-critical areas

---

### Anti-Pattern 4: Testing Wrong Functionality

**Definition**: Writing many tests for trivial code while ignoring complex, brittle code.

**Why It's Harmful**:
- Wastes testing effort on code that's unlikely to break
- Leaves critical code untested
- Creates false confidence (high coverage, high bug rate)
- Diverts resources from where they matter most

**Examples of Overtest Code**:
```typescript
// ❌ Don't waste tests on this
get coins(): number {
  return this._coins;
}

isEmpty(): boolean {
  return this.cards.length === 0;
}
```

**Examples of Undertest Code**:
```typescript
// ✅ Concentrate tests here
function calculateBuyPriority(cards: Card[], coins: number): Card[] {
  // Complex business logic with many branches
  // This changes frequently
  // This is where bugs hide
}
```

**How to Detect It**:
```
- Tests concentrate on getters/setters rather than business logic
- Complex algorithms have minimal test coverage
- Edge cases in critical code are untested
- Coverage report shows 100% coverage but bugs are frequent
```

**How to Fix It**:
- Analyze code for complexity and change frequency
- Concentrate tests on code that breaks often
- Use cyclomatic complexity metrics to identify high-complexity code
- Focus on business logic, not infrastructure

---

### Anti-Pattern 5: Testing Internal Implementation

**Definition**: Tests tightly coupled to internal code structure and implementation details.

**Why It's Harmful**:
- Tests break whenever internal structure changes (even legitimate refactoring)
- Refactoring becomes risky and expensive
- Tests don't reflect real user workflows
- Implementation becomes frozen (can't change without breaking tests)

**Examples**:
```typescript
// ❌ BAD: Testing internal structure
expect(game.internalState.phase).toBe('buy');
expect(game._hand[0].name).toBe('Copper');
expect(game.deck.length).toBe(5);

// ✅ GOOD: Testing public behavior
expect(game.getCurrentPhase()).toBe('buy');
expect(game.playTreasure('Copper').coins).toBe(1);
expect(game.canBuyCard('Silver')).toBe(true);
```

**How to Detect It**:
```
- Tests access private fields or internal state
- Tests break when internal refactoring occurs
- Tests verify internal data structures rather than behavior
- Tests use reflection to inspect object internals
```

**How to Fix It**:
- Write tests against public APIs only
- Refactor internal structure without changing tests
- Test observable behavior, not implementation
- Keep internal state private

---

### Anti-Pattern 6: Excessive Coverage Obsession

**Definition**: Pursuing 100% code coverage as a primary metric.

**Why It's Harmful**:
> "Code coverage is completely useless as a metric."

- 100% coverage doesn't mean all behaviors are tested
- Encourages testing trivial code
- Creates false confidence
- Exhibits dramatic diminishing returns

**The Reality**:
- 0-20% coverage: Improving coverage helps (easy wins)
- 20-80% coverage: Good ROI on effort
- 80-100% coverage: Dramatic diminishing returns (tests unimportant code)

The critical 20% of code where bugs hide can have 100% coverage while the other 80% has 50% coverage, and tests are more valuable overall.

**How to Detect It**:
```
- Team members regularly cite "we need X% coverage"
- Coverage percentage is used to approve/reject PRs
- Coverage percentage has increased but bug rate hasn't decreased
- Team spends hours writing tests for unimportant code
```

**How to Fix It**:
- Replace coverage metrics with risk-based testing
- Focus on coverage of critical code only
- Use coverage as a tool (find untested areas) not a goal
- Measure test effectiveness by bugs caught, not coverage percentage

---

### Anti-Pattern 7: Flaky or Slow Tests

**Definition**: Tests that sometimes pass and sometimes fail, or run very slowly.

**Why It's Harmful**:
- Destroys developer trust ("I don't know why this failed")
- Developers start ignoring test failures
- Debugging flaky tests wastes enormous effort
- Slow tests delay feedback (developers take breaks instead of fixing)
- Test suite becomes unreliable

**Flaky Tests Indicators**:
```
- "This test sometimes fails on CI but passes locally"
- "Rerunning the test suite produced different results"
- Timing-dependent operations without proper synchronization
- External dependencies (APIs, databases) assumed to always be available
```

**Slow Tests Indicators**:
```
- Test suite takes >5 minutes to run
- Developers avoid running tests locally
- Waiting for tests becomes part of the workflow
```

**How to Detect It**:
```
- Run test suite 10 times: do all 10 runs produce identical results?
- Do tests rely on timing assumptions or external services?
- Are there sleep() or arbitrary delays in tests?
- Do tests share global state?
```

**How to Fix It**:
- Use proper synchronization instead of timing
- Mock or isolate external dependencies
- Run tests in parallel with unique state per test
- Use test containers for deterministic databases
- Make tests independent (no shared state)

---

### Anti-Pattern 8: Manual Test Execution

**Definition**: Tests exist but must be executed manually instead of automatically.

**Why It's Harmful**:
- Tests aren't run consistently
- Developers skip tests under time pressure
- Manual testing introduces human error
- No automatic feedback

**How to Detect It**:
```
- Tests require manual steps to run
- Setup/teardown isn't automated
- Environment preparation requires manual work
- Test reports aren't automatically generated
```

**How to Fix It**:
- All tests must run with single command
- Environment setup must be automatic
- Test execution must be part of CI/CD pipeline
- Test results must be automatically reported

---

### Anti-Pattern 9: Treating Tests as Second-Class Code

**Definition**: Test code is written with lower standards than production code.

**Why It's Harmful**:
- Test code becomes unmaintainable over time
- Tests become harder to update and modify
- Technical debt in tests mirrors to quality issues
- Copy-paste test code leads to inconsistency

**How to Detect It**:
```
- Test code violates DRY principle heavily
- Tests have duplicated setup code
- Tests lack clear structure or naming
- Tests are harder to understand than production code
- No code review for test code quality
```

**How to Fix It**:
- Apply same design principles to tests as production code
- Use DAMP (Descriptive And Meaningful Phrases) not DRY for tests
- Refactor test code regularly
- Use test helpers and fixtures appropriately
- Review test code quality in pull requests

---

### Anti-Pattern 10: Ignoring Production Bugs

**Definition**: Bugs that escape to production aren't converted to tests.

**Why It's Harmful**:
- Same bug can reoccur later (no regression prevention)
- Tests stem from production experience are more valuable than added during development
- Missed opportunity to improve test suite reliability

**The Rule**:
> "Software tests that stem from actual bugs are more valuable than tests added as part of new development."

**How to Detect It**:
```
- Bug reported in production
- Bug is fixed in code
- No new test is added to prevent recurrence
- Same bug type occurs again in future
```

**How to Fix It**:
- Require test coverage for all production bugs
- Create test BEFORE fixing the bug (test reproduces the issue)
- Test should fail with old code, pass with fix
- Every production bug should add a permanent regression test

---

### Anti-Pattern 11: TDD Fundamentalism

**Definition**: Rigid adherence to TDD regardless of context or usefulness.

**Why It's Harmful**:
- TDD is powerful but not universally applicable
- Forced TDD in inappropriate contexts wastes effort
- Creates resentment toward testing practices
- Ignores pragmatic reality of different coding tasks

**Context Where TDD Works Well**:
- Complex business logic with many edge cases
- Code that will be modified frequently
- Collaborative development (tests clarify intent)

**Context Where TDD is Overkill**:
- Spike code or experiments
- Simple utility functions
- Configuration code
- Throwaway prototypes

**How to Detect It**:
```
- Team requires tests-first for all code without exception
- Developers write trivial tests just to satisfy TDD mandate
- Tests are written for code that rarely changes
- Team wastes time testing configuration
```

**How to Fix It**:
- Apply TDD selectively to complex, frequently-changing code
- Allow pragmatism for simple code
- Judge by results: TDD should improve quality and speed, not hinder it
- Encourage tests but don't mandate tests-first for everything

---

### Anti-Pattern 12: Insufficient Testing Knowledge

**Definition**: Developers copy-paste test code without learning framework capabilities.

**Why It's Harmful**:
- Creates inconsistent test styles across codebase
- Developers reinvent utilities that frameworks provide
- Tests become unnecessarily complex
- Knowledge gaps lead to poor test design

**How to Detect It**:
```
- Similar test helpers reimplemented multiple times
- Tests use verbose patterns when concise ones exist
- Framework capabilities are unused (reinvented locally)
- Test code looks fundamentally different in different files
```

**How to Fix It**:
- Invest in team testing knowledge
- Document testing patterns and best practices
- Create shared test utilities and helpers
- Code review for test quality, not just functionality
- Share learning about testing improvements

---

### Anti-Pattern 13: Dismissing Testing Entirely

**Definition**: Rejecting testing entirely based on past negative experiences.

**Why It's Harmful**:
- Creates risk and instability
- Ignores that anti-patterns caused the negative experience, not testing itself
- Results in slower development (manual testing becomes dominant)

**The Reality**:
> "Bad experiences of testing in the past should not clutter your judgment."

Many teams that abandoned testing did so because they implemented the anti-patterns in this document, not because testing itself is flawed.

**How to Detect It**:
```
- Team has no automated tests
- "We tried testing and it slowed us down"
- Blame for past testing failures is never analyzed
- No investment in learning better testing approaches
```

**How to Fix It**:
- Analyze what went wrong (usually it's the anti-patterns here)
- Start fresh with better practices
- Begin with critical code only
- Let success with tests demonstrate value
- Invest in team knowledge

---

## Using This Document in Test Audits

When auditing tests, identify which anti-patterns are present:

1. **Coverage imbalance** (Anti-Pattern 1, 2): Too much unit without integration? Too much integration without unit?
2. **Wrong focus** (Anti-Pattern 3, 4): Testing trivial code while ignoring complex code?
3. **Implementation coupling** (Anti-Pattern 5): Tests break when code is refactored?
4. **Quality issues** (Anti-Pattern 7, 9): Flaky tests? Second-class test code?
5. **Process failures** (Anti-Pattern 8, 10): Manual testing? Ignored production bugs?

Tests exhibiting these anti-patterns should be prioritized for remediation.

---

## Summary: Red Flags

When auditing a test suite, watch for:

- ⚠️ Tests that break during legitimate refactoring
- ⚠️ Flaky tests that pass/fail intermittently
- ⚠️ Tests that verify internal state rather than public behavior
- ⚠️ High coverage of trivial code, low coverage of critical logic
- ⚠️ Manual test execution or complex setup
- ⚠️ Tests that don't reflect real user workflows
- ⚠️ Slow test suite that discourages running tests
- ⚠️ Vague test names like "should work" or "test1"
- ⚠️ Complex logic or conditional statements in tests
- ⚠️ Duplicated test code and inconsistent patterns
