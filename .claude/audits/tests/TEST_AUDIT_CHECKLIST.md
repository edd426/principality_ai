# Test Audit Checklist

**Purpose**: Actionable criteria for evaluating test quality based on Google's principles and anti-patterns
**Last Updated**: 2025-10-23
**Based On**:
- Google's Unit Testing Principles (Software Engineering at Google, Chapter 12)
- Software Testing Anti-patterns (Kapelonis)

---

## How to Use This Checklist

For each test file, evaluate the criteria below. Mark each as:
- ✅ Meets expectation
- ⚠️ Partial/questionable
- ❌ Fails expectation

Use the scoring section to calculate overall test quality.

---

## Part 1: Structural Quality Indicators

### 1.1 Test Names and Clarity
**Criterion**: Test names clearly communicate what behavior is being tested.

**Check**:
- [ ] Test names describe the behavior, not the method
- [ ] Test names include expected outcome (e.g., "should buy the card when player has sufficient coins")
- [ ] No vague names like "test", "works", "should handle"
- [ ] Names would help diagnose failure without reading test body

**Issues to Flag**:
- ❌ `it('test1', ...)`
- ❌ `it('should work', ...)`
- ❌ `it('game', ...)`
- ✅ `it('should buy the card when player has sufficient coins', ...)`

**Red Flag**: Vague or auto-generated test names suggest tests verify implementation not behavior.

---

### 1.2 Test Structure and Clarity
**Criterion**: Tests are simple and clear enough to understand without writing a test to verify the test.

**Check**:
- [ ] Test body is simple and obvious (no complex logic)
- [ ] No conditional statements in test (if/else)
- [ ] No loops or complex control flow
- [ ] Setup is minimal and clear
- [ ] Assertions are straightforward
- [ ] A new developer could understand the test without asking questions

**Issues to Flag**:
- ❌ Tests with if/else branches
- ❌ Tests with nested loops or data generation logic
- ❌ Complex helper function chains
- ❌ Setup code longer than test code itself
- ✅ Simple, obvious test structure

**Red Flag**: If the test itself needs a test to verify it works, it's too complex.

---

### 1.3 Setup and Teardown
**Criterion**: Test setup is minimal and focused.

**Check**:
- [ ] Setup code is as short as possible
- [ ] Only the minimum required objects are created
- [ ] Setup code is obvious (new X(...))
- [ ] No complex builder patterns or factories in setup
- [ ] Teardown is automatic (no manual cleanup)

**Issues to Flag**:
- ❌ Setup code longer than test code
- ❌ Complex builder chains
- ❌ Manual cleanup in afterEach hooks
- ❌ Implicit dependencies in setup
- ✅ Minimal, obvious setup

**Red Flag**: Complex setup makes tests fragile and hard to understand.

---

### 1.4 Assertions and Verification
**Criterion**: Assertions clearly verify what matters.

**Check**:
- [ ] Each test has clear assertions
- [ ] Assertions verify behavior, not internal state
- [ ] Assertions would fail if the bug exists
- [ ] Each assertion verifies one conceptual fact
- [ ] No assertions on implementation details (private fields)

**Issues to Flag**:
- ❌ Assertions on private fields using reflection
- ❌ Assertions on internal state variables
- ❌ Assertions that verify method was called (interaction testing)
- ❌ Multiple unrelated assertions in one test
- ✅ Clear assertions on public behavior

**Red Flag**: Tests that verify internal state break during refactoring.

---

## Part 2: Stability and Brittleness

### 2.1 Refactoring Resilience
**Criterion**: Tests remain stable when code is refactored legitimately.

**Check**:
- [ ] Test would survive internal refactoring
- [ ] Test doesn't depend on internal structure
- [ ] Test doesn't mock/spy on implementation details
- [ ] Test uses public APIs, not reflection

**How to Check**:
1. Review the test
2. Ask: "If I rewrote this implementation, would this test still pass?"
3. If answer is "no" → test is brittle

**Issues to Flag**:
- ❌ Tests accessing private fields
- ❌ Tests checking internal method calls
- ❌ Tests using reflection or spies
- ❌ Tests would break if internal structure changed
- ✅ Tests would survive internal refactoring

**Red Flag**: Brittle tests become unmaintainable and create fear of refactoring.

---

### 2.2 Flakiness Assessment
**Criterion**: Tests pass consistently and deterministically.

**Check**:
- [ ] Test passes consistently (no randomness)
- [ ] No timing assumptions (sleep, delays)
- [ ] No external dependency assumptions
- [ ] No thread/concurrency issues
- [ ] No shared global state

**How to Check**:
1. Run test 10 times → all 10 pass?
2. Run in parallel with other tests → still pass?
3. Run on different machines → same result?

**Issues to Flag**:
- ❌ `setTimeout` or `sleep` in test
- ❌ Assumptions about timing
- ❌ External API/database calls
- ❌ Shared global state
- ❌ Random data in test assertions
- ✅ Deterministic, isolated tests

**Red Flag**: Flaky tests destroy developer confidence.

---

### 2.3 Test Isolation
**Criterion**: Tests are independent and don't interfere with each other.

**Check**:
- [ ] Test doesn't depend on other tests
- [ ] Test doesn't use shared state
- [ ] Test can run in any order
- [ ] Test can run in parallel
- [ ] Test cleanup is automatic

**How to Check**:
1. Run test in isolation → pass?
2. Run test suite multiple times → consistent results?
3. Run specific test → pass without running others?

**Issues to Flag**:
- ❌ Tests that depend on execution order
- ❌ Shared state between tests
- ❌ beforeAll hooks that affect test state
- ❌ Tests that fail when run in parallel
- ✅ Fully isolated tests

**Red Flag**: Isolation issues create intermittent failures.

---

## Part 3: Test Coverage Quality

### 3.1 Meaningful Coverage
**Criterion**: Tests cover meaningful behavior, not trivial code.

**Check**:
- [ ] Tests cover critical business logic
- [ ] Tests cover edge cases and error conditions
- [ ] Tests don't over-cover getters/setters
- [ ] Tests don't cover trivial configurations
- [ ] Tests focus on code that changes frequently

**How to Check**:
1. Identify critical code in the file
2. Ask: "Do tests cover the risky code?"
3. Ask: "Are there unnecessary tests on trivial code?"

**Issues to Flag**:
- ❌ 100% coverage of getters/setters
- ❌ Tests only on simple utility functions
- ❌ Configuration code tested thoroughly
- ❌ Complex business logic untested
- ✅ Coverage focused on critical code

**Red Flag**: High coverage with low bug detection = tests verify wrong things.

---

### 3.2 Behavior Coverage (Unit + Integration + E2E)
**Criterion**: Behavior is tested at appropriate levels.

**Check**:
- [ ] Unit tests cover component behavior in isolation
- [ ] Integration tests cover component interactions
- [ ] E2E/functional tests cover complete workflows
- [ ] No single test level handles all testing
- [ ] Distribution roughly 80/15/5 (unit/integration/E2E)

**How to Check**:
1. List all tests in file
2. Categorize each as unit/integration/E2E
3. Calculate distribution
4. Check if coverage gaps exist

**Issues to Flag**:
- ❌ Only unit tests (no integration coverage)
- ❌ Only integration tests (exponential complexity)
- ❌ Complex workflow in unit test (should be E2E)
- ⚠️ Distribution significantly different from 80/15/5
- ✅ Appropriate mix of test levels

**Red Flag**: Missing integration/E2E tests hide real issues.

---

### 3.3 Edge Case and Error Coverage
**Criterion**: Tests cover important edge cases and error conditions.

**Check**:
- [ ] Happy path is tested
- [ ] Error conditions are tested
- [ ] Boundary conditions are tested
- [ ] Invalid inputs are tested
- [ ] State transitions are tested

**How to Check**:
1. Identify edge cases for the code
2. Look for tests of each edge case
3. Check error handling tests

**Issues to Flag**:
- ❌ Only happy path tested
- ❌ No error/exception tests
- ❌ No boundary condition tests
- ❌ No invalid input tests
- ✅ Comprehensive edge case coverage

**Red Flag**: Edge cases create production bugs when untested.

---

## Part 4: Anti-Pattern Detection

### 4.1 Implementation Coupling
**Criterion**: Tests don't depend on internal implementation details.

**Check**:
- [ ] Tests use public APIs
- [ ] No reflection or private field access
- [ ] No spying on internal method calls
- [ ] No testing through back-door (database directly)
- [ ] No tight coupling to internal structure

**Issues to Flag**:
- ❌ Accessing private fields with `expect(obj._field)`
- ❌ Using reflection to access protected data
- ❌ Spying on internal method calls
- ❌ Testing by checking database directly
- ✅ Tests via public APIs only

**Red Flag**: Implementation-coupled tests prevent refactoring.

---

### 4.2 Excessive Mocking
**Criterion**: Mocks are used appropriately for isolation, not as proxies for real testing.

**Check**:
- [ ] Mocks used for external dependencies (API, DB)
- [ ] Not mocking internal components
- [ ] Real objects used where possible
- [ ] Mock assertions on critical behavior
- [ ] Test actually exercises code, not just mocks

**Issues to Flag**:
- ❌ Mocking internal business logic
- ❌ So many mocks that nothing real is tested
- ❌ Mock expectations but no actual behavior verification
- ❌ Mocking to avoid setup complexity
- ✅ Strategic mocking of external dependencies

**Red Flag**: Over-mocking means test doesn't validate real code.

---

### 4.3 Dummy/Placeholder Tests
**Criterion**: Tests verify meaningful behavior, not just check that code runs.

**Check**:
- [ ] Each test has real assertions (not just `expect(true)`)
- [ ] Assertions would fail if code breaks
- [ ] Tests aren't just checking `instanceof` or types
- [ ] Tests verify behavior, not just "no exception thrown"
- [ ] Test would catch the reported bug if it existed

**How to Check**:
1. Remove one line of implementation
2. Does the test fail? → Test is meaningful
3. Does nothing fail? → Test is dummy

**Issues to Flag**:
- ❌ `expect(true)` assertions
- ❌ `expect(result).toBeDefined()`
- ❌ Tests that pass regardless of implementation
- ❌ `describe` blocks with no assertions
- ❌ Tests that say "should work" without verifying what "work" means
- ✅ Tests with clear, meaningful assertions

**Red Flag**: Dummy tests give false confidence.

---

### 4.4 Code Coverage Misuse
**Criterion**: Coverage is measured as a tool, not a goal.

**Check**:
- [ ] Coverage isn't used as pass/fail metric
- [ ] Low coverage areas are analyzed, not just fixed
- [ ] Coverage gaps are understood (intentional or not)
- [ ] Team doesn't pursue 100% coverage
- [ ] Coverage is tracked but not enforced rigidly

**Issues to Flag**:
- ❌ "We need 100% coverage"
- ❌ PRs rejected for coverage percentage alone
- ❌ Tests added solely to increase coverage
- ❌ No discussion of what coverage metrics mean
- ✅ Coverage used as diagnostic tool

**Red Flag**: Coverage obsession creates dummy tests.

---

## Part 5: Test Maintenance

### 5.1 Test Code Quality
**Criterion**: Tests are maintained to same standard as production code.

**Check**:
- [ ] No copy-paste duplication in test code
- [ ] Helper functions/utilities for common patterns
- [ ] Clear test data/fixture patterns
- [ ] Consistent naming and structure
- [ ] No "code smell" in test code

**Issues to Flag**:
- ❌ Identical test setup repeated 10 times
- ❌ No helper functions for common patterns
- ❌ Inconsistent test style
- ❌ Test code harder to understand than production code
- ✅ Well-maintained test code with helpers

**Red Flag**: Low-quality test code becomes unmaintainable.

---

### 5.2 Test Documentation
**Criterion**: Test purpose is clear from name and comments.

**Check**:
- [ ] Test name is self-documenting
- [ ] No additional comments needed to understand test
- [ ] Setup is obvious without explanation
- [ ] Test assertions speak for themselves

**Issues to Flag**:
- ❌ Comments explaining obvious test
- ❌ Comments required to understand test purpose
- ❌ Test name doesn't match what test does
- ✅ Self-documenting tests

**Red Flag**: Tests needing extensive comments are too complex.

---

## Part 6: Coverage Summary Scoring

For a test file, score each section:

### Scoring Guide
- **✅ 90-100% pass**: Excellent test quality
- **⚠️ 70-89% pass**: Good quality, some improvements needed
- **❌ 50-69% pass**: Significant issues, needs refactoring
- **❌ <50% pass**: Critical quality problems, consider rewriting

### Example Scoring Template

```
File: packages/core/tests/game.test.ts

Structural Quality: 85%
- Test names clear: ✅
- Simple structure: ✅
- Minimal setup: ⚠️
- Clear assertions: ✅

Stability: 90%
- Refactoring resilient: ✅
- Not flaky: ✅
- Well-isolated: ✅

Coverage Quality: 75%
- Meaningful coverage: ⚠️
- Behavior levels: ✅
- Edge cases: ⚠️

Anti-Patterns: 70%
- Implementation coupling: ⚠️
- Mocking appropriate: ✅
- No dummy tests: ✅
- Coverage misuse: ⚠️

Maintenance: 80%
- Code quality: ⚠️
- Self-documenting: ✅

OVERALL SCORE: 80% (Good quality, some improvements needed)

Action Items:
1. Refactor setup code (currently 100 lines)
2. Add integration tests for workflow scenarios
3. Cover more edge cases in phase transition tests
```

---

## Anti-Pattern Detection Quick Reference

### Is this test potentially a dummy test?
- [ ] Real assertions that would fail if code breaks? If no → Dummy
- [ ] Verifies meaningful behavior? If no → Dummy
- [ ] Tests would catch actual bugs? If no → Dummy

### Is this test brittle?
- [ ] Uses public API? If no → Brittle
- [ ] Stable through refactoring? If no → Brittle
- [ ] Doesn't access private fields? If no → Brittle

### Is this test flaky?
- [ ] Passes consistently? If no → Flaky
- [ ] No timing assumptions? If no → Flaky
- [ ] No external dependencies? If no → Flaky

### Does this test focus on wrong things?
- [ ] Testing critical code? If no → Wrong focus
- [ ] Testing behavior vs implementation? If no → Wrong focus
- [ ] Edge cases covered? If no → Wrong focus

---

## How to Conduct a Full Test Audit

1. **Identify all test files** in the project
2. **For each file**, go through sections 1-5 of this checklist
3. **Score each file** using the scoring guide
4. **Calculate overall metrics**:
   - Total tests
   - Tests by level (unit/integration/E2E)
   - Test quality distribution
   - Identified anti-patterns
5. **Create report** with findings and remediation priorities

See `tests/2025-10-23-test-audit.md` for example audit report format.
