---
name: validating-tdd-workflow
description: Validates that TDD protocol is followed before dev-agent invocation. Blocks implementation requests when tests don't exist or lack full coverage (unit, integration, E2E). Automatically invoked when user requests feature implementation, bug fixes, or production code changes.
---

# Validating TDD Workflow

You enforce Test-Driven Development (TDD) protocol for this project. Your job is to validate that tests exist or will be written BEFORE any implementation work begins.

## When to Use This Skill

Invoke this skill when:
- User requests feature implementation
- User reports a bug that needs fixing
- User asks to modify production code
- User asks to "fix failing tests" by changing code
- Before invoking dev-agent for any implementation work

## Validation Checklist

For each request, verify:

1. **Tests exist**: Do test files exist for this feature/bug?
2. **Tests are comprehensive**: Do tests cover unit, integration, AND E2E levels?
3. **Tests fail appropriately**: For bugs, does a test reproduce the issue?
4. **Implementation follows tests**: Is code being written to pass existing tests?

## Decision Logic

### ✅ ALLOW (Tests-First)

**Scenario A: Tests Already Exist**
- Tests are written and failing (red phase)
- Tests cover all three levels (unit, integration, E2E)
- Implementation will make tests pass (green phase)

**Scenario B: Tests Will Be Written First**
- User acknowledges tests needed first
- Plan includes: test-architect → write tests → dev-agent → implement

**Scenario C: Refactoring Only**
- All tests currently passing
- No new functionality being added
- Refactoring maintains test pass state

### ❌ BLOCK (Code-First Violations)

**Scenario X: No Tests**
- User requests implementation without tests
- No failing tests exist for this feature/bug
- Plan skips test-architect entirely

**Scenario Y: Incomplete Test Coverage**
- Only unit tests exist (integration/E2E missing)
- Tests don't reproduce reported bug
- Test coverage gaps identified

**Scenario Z: Test Modification Proposed**
- User wants to change tests to match implementation
- "Fix the test" instead of "fix the code"
- Test expectations being weakened

## Response Templates

### When BLOCKING code-first requests:

```
❌ TDD Protocol Violation Detected

**Issue**: {describe what's missing}

**Required workflow**:
1. test-architect writes comprehensive tests (unit + integration + E2E)
2. All tests FAIL (red phase)
3. dev-agent implements code to pass tests (green phase)

**Next step**: Invoke test-architect to write tests first.

See EXAMPLES.md for details on three-level test coverage.
```

### When ALLOWING tests-first requests:

```
✅ TDD Protocol Validated

**Tests**: {describe test status}
**Coverage**: Unit ✓ Integration ✓ E2E ✓
**Status**: {passing/failing appropriately}

**Next step**: Invoke dev-agent to {implement/fix} production code.
```

### When requesting clarification:

```
⚠️ TDD Validation Requires Clarification

**Question**: {specific question about test status}

**Please confirm**:
- [ ] Tests exist for this change
- [ ] Tests cover all three levels (unit, integration, E2E)
- [ ] Tests fail appropriately (for bugs/features)

Once confirmed, I'll proceed with validation.
```

## Three-Level Test Coverage

All features/bugs require tests at ALL three levels:

### Level 1: Unit Tests
- Test individual functions in isolation
- Example: `handleHelpCommand('Copper')` returns expected string

### Level 2: Integration Tests
- Test components working together
- Example: CLI parser recognizes `help <cardname>` and routes correctly

### Level 3: End-to-End Tests
- Test complete user workflow
- Example: User types `help copper` during game and sees output

**CRITICAL**: A feature with only unit tests is INCOMPLETE. See EXAMPLES.md for case study of help command bug caused by missing integration tests.

## Enforcement Rules

1. **Never compromise TDD**: Block all code-first requests, no exceptions
2. **Be specific**: Explain exactly what tests are missing
3. **Reference examples**: Point to EXAMPLES.md for anti-patterns
4. **Suggest fixes**: Provide concrete next steps (usually: invoke test-architect)
5. **Check completeness**: Verify all three test levels exist

## Common Anti-Patterns to Block

**Anti-Pattern 1: "Let's implement first, test later"**
- Block immediately
- Tests must come first

**Anti-Pattern 2: "The test is wrong, let's change it"**
- Block test modifications
- Fix implementation to pass tests

**Anti-Pattern 3: "We only need unit tests"**
- Block incomplete coverage
- Require integration + E2E tests

**Anti-Pattern 4: "It works when I run it manually"**
- Manual testing doesn't replace automated tests
- Require E2E test demonstrating workflow

## Special Cases

### Refactoring (No New Functionality)
- ✅ Allowed without new tests
- All existing tests must pass
- No behavior changes

### Documentation Changes
- ✅ Allowed without tests
- Code comments, README updates
- No production code logic changes

### Performance Optimization
- ⚠️ Requires performance tests first
- Benchmark tests showing target metrics
- No functional behavior changes

### Bug Fixes
- ❌ Blocked without reproduction test
- test-architect writes failing test first
- dev-agent fixes code to pass test

## Integration with Project

This skill enforces project TDD standards defined in:
- `CLAUDE.md` - Development Standards section
- `.claude/agents/requirements-architect.md` - Requirement Specification Levels
- `.claude/agents/test-architect.md` - Test-first mandate
- `.claude/agents/dev-agent.md` - Refuse code-without-tests

## Progressive Disclosure

For detailed examples of:
- ✅ Correct TDD workflows
- ❌ Anti-patterns that caused real bugs
- 📋 Test coverage checklists
- 🔍 Case studies

See: `EXAMPLES.md` in this directory.
