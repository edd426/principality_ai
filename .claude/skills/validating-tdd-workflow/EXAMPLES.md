# TDD Validation Examples

This file provides detailed examples of correct and incorrect TDD workflows, including real bugs from this project.

## Table of Contents

1. [Real Bug Case Study: Help Command](#real-bug-case-study-help-command)
2. [Correct TDD Workflows](#correct-tdd-workflows)
3. [Anti-Patterns to Block](#anti-patterns-to-block)
4. [Test Coverage Checklists](#test-coverage-checklists)
5. [Special Scenarios](#special-scenarios)

---

## Real Bug Case Study: Help Command

**Context**: Phase 1.6 feature implementation

### What Happened (Anti-Pattern)

**Requirements Document** (incomplete):
```markdown
## Help Command Feature

**Requirement**: Display card information during gameplay

**Unit Level**:
- `handleHelpCommand('Copper')` returns `'Copper | 0 | treasure | +1 Coin'`
- Case-insensitive lookup

❌ MISSING: Integration level specification
❌ MISSING: E2E level specification
```

**Tests Written** (incomplete coverage):
```typescript
// ✅ Unit test - PASSES
test('displays card information for valid card', () => {
  const output = handleHelpCommand('Copper');
  expect(output).toContain('Copper');
});

// ❌ No integration test for CLI parser
// ❌ No E2E test for user workflow
```

**Implementation**:
```typescript
// ✅ Function exists and works
export function handleHelpCommand(cardName: string): string {
  // ... implementation ...
  return 'Copper | 0 | treasure | +1 Coin';
}

// ❌ CLI parser doesn't recognize 'help' command
// ❌ Function never called during gameplay
```

**Result**:
- ✅ Unit tests pass (function works in isolation)
- ❌ Feature completely broken for users
- ❌ Users type `help copper` → error message
- ❌ No integration between parser and handler

### Why It Failed

1. **Requirements Gap**: requirements-architect didn't specify integration/E2E levels
2. **Test Gap**: test-architect only wrote unit tests (followed incomplete requirements)
3. **Implementation Gap**: dev-agent implemented function but didn't wire it to CLI
4. **Validation Gap**: No one caught the missing test levels

### Correct Approach

**Requirements Document** (complete):
```markdown
## Help Command Feature

**Unit Level**:
- `handleHelpCommand('Copper')` returns `'Copper | 0 | treasure | +1 Coin'`
- Case-insensitive lookup: Copper = copper = COPPER
- Invalid card returns error message

**Integration Level**:
- CLI parser recognizes `help <cardname>` pattern
- Parser extracts card name parameter
- Parser routes to `handleHelpCommand()` with parameter
- Handler return value displayed to user

**E2E Level**:
- User types `help copper` during gameplay
- System displays: `Copper | 0 | treasure | +1 Coin`
- Game state unchanged (informational command)
- Works in all game phases (action, buy, cleanup)
```

**Tests Written** (complete coverage):
```typescript
// Unit Tests
describe('handleHelpCommand', () => {
  test('UT-1: displays card info for valid card', () => {
    const output = handleHelpCommand('Copper');
    expect(output).toBe('Copper | 0 | treasure | +1 Coin');
  });

  test('UT-2: case-insensitive lookup', () => {
    expect(handleHelpCommand('copper')).toBe('Copper | 0 | treasure | +1 Coin');
    expect(handleHelpCommand('COPPER')).toBe('Copper | 0 | treasure | +1 Coin');
  });

  test('UT-3: returns error for invalid card', () => {
    const output = handleHelpCommand('InvalidCard');
    expect(output).toContain('Unknown card');
  });
});

// Integration Tests
describe('CLI Parser - Help Command', () => {
  test('INT-1: recognizes help command pattern', () => {
    const input = 'help copper';
    const parsed = parseCommand(input);
    expect(parsed.command).toBe('help');
    expect(parsed.args).toEqual(['copper']);
  });

  test('INT-2: routes help command to handler', () => {
    const result = executeCommand('help copper', gameState);
    expect(result.output).toContain('Copper');
  });

  test('INT-3: displays handler output to user', () => {
    const output = captureConsoleOutput(() => {
      executeCommand('help copper', gameState);
    });
    expect(output).toContain('Copper | 0 | treasure | +1 Coin');
  });
});

// E2E Tests
describe('Help Command - User Workflow', () => {
  test('E2E-1: user gets help during action phase', async () => {
    const game = startNewGame();
    const output = await sendUserInput('help Village');
    expect(output).toContain('Village | 3 | action | +1 Card, +2 Actions');
    expect(game.phase).toBe('action'); // State unchanged
  });

  test('E2E-2: help works across all phases', async () => {
    // Action phase
    await sendUserInput('help Copper');
    expect(lastOutput()).toContain('Copper');

    // Buy phase
    await sendUserInput('done');
    await sendUserInput('help Province');
    expect(lastOutput()).toContain('Province');

    // Cleanup phase
    await sendUserInput('done');
    await sendUserInput('help Estate');
    expect(lastOutput()).toContain('Estate');
  });
});
```

**Implementation**:
```typescript
// 1. Handler function (satisfies unit tests)
export function handleHelpCommand(cardName: string): string {
  const card = lookupCard(cardName.toLowerCase());
  if (!card) return `Unknown card: ${cardName}`;
  return `${card.name} | ${card.cost} | ${card.type} | ${card.effect}`;
}

// 2. Parser integration (satisfies integration tests)
function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  const command = parts[0].toLowerCase();

  if (command === 'help') {
    return { command: 'help', args: parts.slice(1) };
  }
  // ... other commands ...
}

// 3. CLI routing (satisfies E2E tests)
function executeCommand(input: string, state: GameState): CommandResult {
  const parsed = parseCommand(input);

  if (parsed.command === 'help') {
    const output = handleHelpCommand(parsed.args[0]);
    console.log(output);
    return { success: true, output, state }; // State unchanged
  }
  // ... other commands ...
}
```

**Result**:
- ✅ All three test levels pass
- ✅ Feature works for users
- ✅ Complete integration from input to output

---

## Correct TDD Workflows

### Workflow 1: New Feature Implementation

```
Step 1: Requirements (requirements-architect)
├─ Defines feature requirements
├─ Specifies unit, integration, AND E2E levels
└─ Documents edge cases and error handling

Step 2: Tests (test-architect)
├─ Writes unit tests (all FAIL - red phase)
├─ Writes integration tests (all FAIL - red phase)
├─ Writes E2E tests (all FAIL - red phase)
└─ Commits: "Add tests for Feature X (0/15 passing)"

Step 3: Implementation (dev-agent)
├─ Implements code to pass unit tests first
├─ Extends implementation for integration tests
├─ Completes implementation for E2E tests
├─ All tests PASS (green phase)
└─ Commits: "Implement Feature X (15/15 passing)"

Step 4: Refactoring (optional)
├─ Improve code quality
├─ All tests still pass
└─ Commits: "Refactor Feature X (15/15 passing)"
```

### Workflow 2: Bug Fix

```
Step 1: Bug Report
└─ User reports: "Help command doesn't work during gameplay"

Step 2: Reproduction Test (test-architect)
├─ Writes E2E test reproducing bug
├─ Test FAILS (validates bug exists)
└─ Commits: "Add test reproducing help command bug (0/1 passing)"

Step 3: Bug Fix (dev-agent)
├─ Analyzes failing test
├─ Implements fix (CLI parser wiring)
├─ Test PASSES (validates fix works)
└─ Commits: "Fix help command parser integration (1/1 passing)"

Step 4: Regression Prevention
└─ Test remains in suite forever
```

### Workflow 3: Refactoring (No New Functionality)

```
Step 1: Current State
├─ All tests passing (504/504)
└─ Code works but needs cleanup

Step 2: Refactor (dev-agent)
├─ Improves code structure
├─ Runs tests continuously
├─ All tests still pass (504/504)
└─ Commits: "Refactor card lookup logic (504/504 passing)"

✅ No new tests needed (functionality unchanged)
```

---

## Anti-Patterns to Block

### Anti-Pattern 1: "Implement First, Test Later"

**❌ Blocked Request**:
```
User: "Can you implement the multi-card chain feature?
       We'll write tests after to verify it works."
```

**🛡️ Validation Response**:
```
❌ TDD Protocol Violation Detected

**Issue**: Implementation requested without tests

**Required workflow**:
1. test-architect writes comprehensive tests (unit + integration + E2E)
2. All tests FAIL (red phase)
3. dev-agent implements code to pass tests (green phase)

**Next step**: Invoke test-architect to write tests first.

Tests define "done." Implementation follows tests.
```

### Anti-Pattern 2: "Fix the Failing Test"

**❌ Blocked Request**:
```
User: "The test expects hand size to increase by 1,
       but my implementation discards the played card.
       Can we update the test to expect hand size to stay the same?"
```

**🛡️ Validation Response**:
```
❌ TDD Protocol Violation Detected

**Issue**: Attempting to modify test to match implementation

**Correct approach**:
- Tests define requirements (contract)
- Implementation must fulfill contract
- If test is wrong, requirement is wrong

**Options**:
A) Fix implementation to pass test (if test is correct)
B) Update requirement document first (if test is wrong)
C) Consult requirements-architect to clarify

**Next step**: Determine if test correctly validates requirement.

Do NOT modify tests to match implementation.
```

### Anti-Pattern 3: "Unit Tests Are Enough"

**❌ Blocked Request**:
```
User: "I've written unit tests for handleHelpCommand().
       Can dev-agent implement it now?"
```

**🛡️ Validation Response**:
```
❌ TDD Protocol Violation Detected

**Issue**: Incomplete test coverage (only unit tests)

**Missing**:
- ❌ Integration tests (CLI parser recognition)
- ❌ E2E tests (user workflow)

**Required**:
All three levels needed:
1. Unit: handleHelpCommand() function behavior
2. Integration: CLI parser → handler routing
3. E2E: User types "help copper" → sees output

**Next step**: test-architect completes integration and E2E tests.

See case study above for real bug caused by missing levels.
```

### Anti-Pattern 4: "Manual Testing Proves It Works"

**❌ Blocked Request**:
```
User: "I tested it manually and it works.
       Do we really need automated tests?"
```

**🛡️ Validation Response**:
```
❌ TDD Protocol Violation Detected

**Issue**: Manual testing doesn't replace automated tests

**Why automated tests required**:
- Prevents regressions (runs on every change)
- Documents expected behavior
- Enables refactoring safely
- Validates edge cases consistently
- CI/CD enforcement (can't merge without passing)

**Next step**: test-architect writes automated tests covering:
- Happy path you tested manually
- Edge cases not manually tested
- Error scenarios

Manual testing is validation, not replacement.
```

### Anti-Pattern 5: "Tests Take Too Long"

**❌ Blocked Request**:
```
User: "Writing tests will slow us down.
       Can we skip tests for this small feature?"
```

**🛡️ Validation Response**:
```
❌ TDD Protocol Violation Detected

**Issue**: Attempting to skip tests for "small" feature

**Project standard**: ALL code requires tests (no exceptions)

**Actual time savings from TDD**:
- Bugs caught immediately (not in production)
- Refactoring confidence (tests catch breaks)
- Documentation built-in (tests show usage)
- Debugging time reduced (tests isolate issues)

**Next step**: test-architect writes tests for feature.

"Small" features without tests become big bugs.
```

---

## Test Coverage Checklists

### Feature Implementation Checklist

Before invoking dev-agent, verify:

- [ ] **Requirements complete** (all three levels specified)
- [ ] **Unit tests written** (function/method behavior)
- [ ] **Integration tests written** (component interactions)
- [ ] **E2E tests written** (user workflow)
- [ ] **Edge cases covered** (boundary conditions)
- [ ] **Error handling tested** (invalid inputs)
- [ ] **All tests failing** (red phase - validates tests catch issues)

### Bug Fix Checklist

Before fixing bug, verify:

- [ ] **Bug reproduced** (can trigger bug reliably)
- [ ] **Reproduction test written** (test fails with bug)
- [ ] **Test specific enough** (would pass only when fixed)
- [ ] **Test won't break** (won't be brittle during refactoring)

### Refactoring Checklist

Before refactoring, verify:

- [ ] **All tests passing** (baseline established)
- [ ] **No new functionality** (behavior unchanged)
- [ ] **Tests run quickly** (can run frequently during refactor)

---

## Special Scenarios

### Scenario 1: Performance Optimization

**Situation**: Code works but is slow

**Approach**:
```
1. test-architect writes performance tests FIRST
   └─ Test FAILS (doesn't meet target)

2. dev-agent optimizes implementation
   └─ Performance test PASSES

3. Verify functional tests still pass
   └─ No regressions introduced
```

**Example**:
```typescript
// Performance test (written first)
test('shuffle completes within 50ms', () => {
  const start = Date.now();
  const result = shuffle(largeDeck);
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(50);
});

// Then optimize implementation to pass
```

### Scenario 2: Documentation Updates

**Situation**: Need to update README or comments

**Approach**:
```
✅ No tests needed (no code logic changes)

Allowed changes:
- README.md updates
- Code comments
- CLAUDE.md additions
- Documentation files

NOT allowed:
- Production code logic
- Function signatures
- API contracts
```

### Scenario 3: Exploratory Development

**Situation**: Not sure how to implement something

**Approach**:
```
Option A: Write tests for expected behavior (TDD)
└─ Even if unsure HOW, define WHAT

Option B: Create spike branch (exploration)
├─ Mark as [SPIKE] in branch name
├─ Explore approaches
├─ Delete spike code
└─ Write tests THEN implement properly

❌ Don't merge spike code without tests
```

### Scenario 4: Third-Party Library Integration

**Situation**: Adding new dependency

**Approach**:
```
1. test-architect writes integration tests
   └─ How will library be used?

2. dev-agent integrates library
   └─ Tests validate integration

3. Write adapter/wrapper if needed
   └─ Tests validate adapter behavior
```

**Example**:
```typescript
// Integration test (written first)
test('seeded random generates deterministic results', () => {
  const rng1 = new SeededRandom('seed123');
  const rng2 = new SeededRandom('seed123');

  expect(rng1.next()).toBe(rng2.next());
  expect(rng1.next()).toBe(rng2.next());
});

// Then integrate library to pass test
```

---

## Summary

**Golden Rules**:
1. Tests define "done" (not implementation)
2. Write tests FIRST (red → green → refactor)
3. All three levels required (unit + integration + E2E)
4. Never skip tests (not even for "small" features)
5. Fix implementation to pass tests (don't change tests to match code)

**When in doubt**: Ask "Do comprehensive tests exist?" If no → Block and request tests.
