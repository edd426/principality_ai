# Test Quality Remediation Guide

**Purpose**: Actionable guide for fixing the 2 critical issues and 8 major issues identified in the 2025-10-23 test audit

**Deadline**: Complete Priority 1 & 2 by 2025-11-06 (2 weeks)

---

## Week 1: Critical Issues (Priority 1)

### Issue 1: Dummy Tests in MCP Server

**Files Affected**:
- `packages/mcp-server/tests/unit/game-execute.test.ts` (44 tests, ~40 are placeholders)
- `packages/mcp-server/tests/unit/game-observe.test.ts` (TBD)
- Other MCP unit test files

**Current State**:
```typescript
// ❌ BAD: Tests that verify nothing
test('should execute valid move successfully', () => {
  expect(true).toBe(true); // Placeholder
});
```

**Solution Options**:

#### Option A: Convert to Real Tests (Recommended for critical paths)
```typescript
// ✅ GOOD: Verifies actual behavior
test('should return error when no game active', async () => {
  const tool = new GameExecuteTool(mockEngine, () => null, () => {});
  const response = await tool.execute({ move: 'play Village' });

  expect(response.success).toBe(false);
  expect(response.error?.message).toContain('No active game');
});
```

#### Option B: Mark as Pending (Recommended for future features)
```typescript
// ✅ ACCEPTABLE: Clearly marks as pending
test.skip('should execute deterministic games with seed', () => {
  // TODO: Implement after game session feature complete
  expect(true).toBe(true);
});
```

#### Option C: Remove Entirely (Recommended for unclear requirements)
```typescript
// Delete test if requirements are not yet defined
// Add TODO comment linking to requirements when available
```

**Action Items**:
- [ ] Categorize each placeholder test (convert / skip / delete)
- [ ] Implement real tests for: error handling, state validation, game initialization
- [ ] Mark feature tests as `.skip()` with TODO comments
- [ ] Verify test suite runs without errors
- [ ] Update audit report with new test count

**Estimated Effort**: 4-6 hours

---

### Issue 2: Flaky E2E Tests (Claude API Calls)

**Files Affected**:
- `packages/mcp-server/tests/e2e/claude-api.test.ts`
- `packages/mcp-server/tests/e2e/haiku-gameplay.test.ts`

**Problem**:
```typescript
// ❌ BAD: Calls real Claude API
test('claude plays a valid move', async () => {
  const response = await callClaudeHaikuAPI(gameState);
  // API timeout → Test fails even if code is fine
  // API rate limit → Test fails
  // Network issue → Test fails
  expect(response.move).toBeDefined();
});
```

**Solution: Mock API Responses**

#### Step 1: Create Mock Response Fixtures

```typescript
// packages/mcp-server/tests/fixtures/claude-responses.ts
export const mockClaudeResponses = {
  playVillage: {
    content: [{
      type: 'text',
      text: 'play 0' // First card in hand
    }]
  },
  buyProvince: {
    content: [{
      type: 'text',
      text: 'buy Province'
    }]
  },
  endTurn: {
    content: [{
      type: 'text',
      text: 'end'
    }]
  }
};
```

#### Step 2: Mock the API Call

```typescript
// packages/mcp-server/tests/e2e/claude-api.test.ts
import { mockClaudeResponses } from '../fixtures/claude-responses';

test('claude plays a valid move', async () => {
  // Mock the API call
  jest.spyOn(claudeApi, 'call').mockResolvedValue(
    mockClaudeResponses.playVillage
  );

  const response = await claudeGameplay.getMove(gameState);

  expect(response).toBe('play 0');
  // This test is now:
  // ✅ Deterministic (same response every time)
  // ✅ Fast (<5ms instead of 3+ seconds)
  // ✅ Free (no API calls)
  // ✅ Tests YOUR parsing code (not Claude's behavior)
});
```

#### Step 3: Optional - Keep Real API Test as Manual

```typescript
// Mark real API tests to run manually, not in CI
describe.skip('Real Claude API Integration (manual testing only)', () => {
  test('claude api is available and responding', async () => {
    // This test calls real API
    // Run manually before releases
    // DO NOT run in CI/CD
    const response = await callClaudeHaikuAPI(gameState);
    expect(response.content).toBeDefined();
  });
});
```

**Action Items**:
- [ ] Create `packages/mcp-server/tests/fixtures/claude-responses.ts`
- [ ] List common game scenarios (play card, buy, end turn, error states)
- [ ] Create mock responses for each scenario
- [ ] Update E2E tests to use mocks instead of real API
- [ ] Verify tests run in <5ms
- [ ] Optional: Keep real API tests marked as `.skip()` or in separate file

**Estimated Effort**: 3-4 hours

---

## Week 2: Major Issues (Priority 2)

### Issue 3: Add Integration Test Coverage to CLI Package

**Files Affected**:
- New files: `packages/cli/tests/integration/full-game-turn.test.ts`
- Existing: `packages/cli/tests/integration.test.ts`

**What's Missing**:
Current tests verify components in isolation:
- Parser tests: Verify parsing works
- Display tests: Verify formatting works
- But: Full workflow (input → parse → execute → display) untested!

**Solution: Add Full Workflow Tests**

```typescript
// packages/cli/tests/integration/full-game-turn.test.ts
describe('Full Game Turn Workflow', () => {
  test('user input flows through CLI correctly', () => {
    // 1. Setup initial game state
    const cli = new PrincipalityCLI('test-seed');

    // 2. User types command
    const userInput = 'play 0';

    // 3. Parser processes it
    const parsed = parser.parseInput(userInput, cli.gameState.players[0].hand);

    // 4. Engine executes
    const result = cli.executeMove(parsed);

    // 5. Display formats response
    const output = display.formatGameState(result.newState);

    // Assert: Full workflow completed
    expect(result.success).toBe(true);
    expect(output).toContain('Copper'); // Hand displayed
  });
});
```

**Action Items**:
- [ ] Create `packages/cli/tests/integration/full-game-turn.test.ts`
- [ ] Add 3-5 integration tests covering:
  1. Full turn (input → execute → display)
  2. Multi-card chains
  3. Phase transitions with display
  4. Auto-play treasures full flow
  5. Help command with game state
- [ ] Ensure tests use real game engine (not mocks)
- [ ] Verify tests exercise both parser AND engine

**Estimated Effort**: 5-6 hours

---

### Issue 4: Decouple MCP Server Tests from Implementation

**Files Affected**:
- `packages/mcp-server/tests/unit/game-execute.test.ts`
- `packages/mcp-server/tests/integration/complete-turn.test.ts`

**Problem**:
```typescript
// ❌ BAD: Tests implementation details (response structure)
test('should return success response', () => {
  const result = execute(move);
  expect(result.success).toBe(true); // ← Implementation detail
  expect(result.message).toBeDefined(); // ← Response format detail
  expect(result.phaseChanged).toBeDefined(); // ← Response structure
});
```

When you refactor the response structure, these tests break even if behavior is correct!

**Solution: Test Behavior Only**

```typescript
// ✅ GOOD: Tests actual game effects
test('should apply move effects correctly', () => {
  const initialState = engine.getCurrentState();
  const initialCoins = initialState.players[0].coins;

  execute({ move: 'play_treasure Copper' });

  const newState = engine.getCurrentState();
  expect(newState.players[0].coins).toBe(initialCoins + 1); // ← Behavior
});
```

**Refactoring Checklist**:
- [ ] For each test, identify what it's testing:
  - Behavior: "Move effects applied correctly" → KEEP and improve
  - Implementation: "Response has success field" → CHANGE to behavior test
  - Format: "Message format is X" → REMOVE or move to formatting tests
- [ ] Remove assertions on response structure
- [ ] Add assertions on game state changes
- [ ] Verify test would catch actual bugs

**Estimated Effort**: 3-4 hours

---

### Issue 5: Document TDD Compliance Gaps

**New File**: `.claude/audits/tests/TDD_COMPLIANCE_GAPS.md`

**Content**: List features with implementation but no tests

```markdown
# TDD Compliance Gaps

## Features Implemented Without Tests

### Package: @principality/core
- [ ] Basic card implementation (DONE - has tests)
- [ ] Game state immutability (DONE - has tests)

### Package: @principality/cli
- [ ] Auto-play treasures (DONE - has tests)
- [ ] Stable card numbers (DONE - has tests)

### Package: @principality/mcp-server
- [ ] Game session management (PARTIALLY - needs more tests)
- [ ] Response formatting (PARTIALLY - needs tests)

## Action Items
1. [ ] Write missing integration tests for game session
2. [ ] Write tests for response formatting
3. [ ] Verify 100% behavior coverage before release

## Prevention
- Require tests BEFORE implementation
- Use TDD: write tests → implement → verify
```

**Estimated Effort**: 2 hours

---

## Week 3: Consolidation & Optimization

### Issue 6: Expand Edge Case Coverage

Add edge case tests for:
- [ ] Empty supply pile handling
- [ ] Phase transition edge cases
- [ ] Invalid move recovery
- [ ] Determinism validation

**Estimated Effort**: 4-5 hours

### Issue 7: Improve Performance Test Thresholds

Make performance tests fail on regression:
```typescript
// ❌ Before: Advisory only
console.log(`Move execution took ${elapsed}ms`);

// ✅ After: Enforces threshold
expect(elapsed).toBeLessThan(10); // Fails if > 10ms
```

**Estimated Effort**: 2-3 hours

### Issue 8: Create Test Pattern Documentation

**New File**: `docs/testing/TEST_PATTERNS.md`

Content:
- Common test patterns (with examples)
- Best practices from Google + anti-patterns to avoid
- Before/after examples
- Team guidelines

**Estimated Effort**: 2-3 hours

---

## Testing the Fixes

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- packages/mcp-server/tests/unit/game-execute.test.ts
```

### Check Test Coverage
```bash
npm test -- --coverage
```

### Measure Impact
```bash
# Before fixes
npm test 2>&1 | grep "passed\|failed"

# After fixes
npm test 2>&1 | grep "passed\|failed"
# Should show: fewer failures, fewer flaky tests
```

---

## Success Criteria

### Quality Score
- [ ] Increase from 72% to 85%+
- [ ] Zero placeholder tests running
- [ ] Zero flaky E2E tests

### Test Count
- [ ] Unit tests: ~380 (stable or more)
- [ ] Integration tests: ~100+ (should increase)
- [ ] E2E tests: ~24 (stable, now deterministic)

### Developer Experience
- [ ] Test suite runs in <30 seconds
- [ ] No flaky test failures
- [ ] Clear error messages on failures
- [ ] CI/CD passes reliably

---

## Commit Strategy

For each issue fixed, commit with:
```
Fix: Placeholder tests in game-execute.test.ts

Converted 6 dummy tests to real assertions, marked
39 feature tests as .skip() with TODO comments.

Tests now verify actual behavior instead of just
checking expect(true).toBe(true).

Quality impact: Reduces false confidence, clarifies
which features are implemented vs pending.
```

---

## Questions?

Refer to:
- Test Audit Checklist: `.claude/audits/tests/TEST_AUDIT_CHECKLIST.md`
- Google Principles: `.claude/audits/best-practices/google-unit-testing-principles.md`
- Anti-patterns: `.claude/audits/best-practices/software-testing-antipatterns.md`

---

**Created**: 2025-10-23
**Deadline**: 2025-11-06 (2 weeks)
**Estimated Total Effort**: 24-32 hours
