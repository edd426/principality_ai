# E2E Test Remediation - Flaky Tests (Critical Issue #2)

**Issue**: E2E tests in `packages/mcp-server/tests/e2e/` call real Claude API

**Status**: 🔴 **CRITICAL** - Tests are non-deterministic, slow, expensive, flaky

**Files Affected**:
- `packages/mcp-server/tests/e2e/claude-api.test.ts`
- `packages/mcp-server/tests/e2e/haiku-gameplay.test.ts`

---

## Problem Analysis

### Current Implementation
```typescript
// ❌ BAD: These tests call REAL Claude API
test('claude plays optimal move', async () => {
  const response = await callClaudeWithRetry(gameState);
  expect(response.move).toBeDefined();
});
```

### Why This Is Critical

| Aspect | Impact |
|--------|--------|
| **Determinism** | ❌ Claude's response varies - test fails randomly |
| **Speed** | ❌ 3-10 seconds per test (vs 5ms with mock) |
| **Cost** | ❌ ~$0.50 per test run ($250+ per month in dev) |
| **CI/CD Blocking** | ❌ Flaky failures block merges unrelated to code |
| **Network Dependency** | ❌ API timeout → test fails even if code is fine |

### Real-World Failure Scenarios
```
Test Suite Run #1: 8/8 E2E tests pass ✅
Test Suite Run #2: 3/8 E2E tests fail (API timeout) ❌
Test Suite Run #3: 7/8 E2E tests pass ✅ (flaky - not code quality issue)
```

---

## Solution Strategy

### Short Term (Current): Disable in CI
Mark tests as `.skip()` so they:
- ✅ Don't block CI/CD
- ✅ Don't waste money
- ✅ Don't fail due to external factors
- ⚠️ Can still run manually for manual testing

### Long Term: Mock API Responses
Replace with deterministic mocks:
- ✅ Test YOUR code (parser, error handling, game logic)
- ✅ Not Claude's responses
- ✅ Fast (<5ms per test)
- ✅ Free (no API calls)
- ⚠️ Requires fixture responses

---

## Implementation Roadmap

### Option A: Immediate Fix (No Code Changes)

Add environment variable guard:
```typescript
// packages/mcp-server/tests/e2e/haiku-gameplay.test.ts

// Only run E2E tests if explicitly enabled (not in default CI)
const runE2ETests = process.env.RUN_E2E_TESTS === 'true';
const describeE2E = runE2ETests ? describe : describe.skip;

describeE2E('E2E: Haiku Gameplay', () => {
  // All tests here are now skipped by default
  // Run locally with: RUN_E2E_TESTS=true npm test
});
```

**Effort**: 5 minutes
**Impact**: E2E tests won't block CI/CD

### Option B: Future Implementation (Mock API)

1. **Create fixture responses** (4 hours)
   ```typescript
   // packages/mcp-server/tests/fixtures/claude-responses.ts
   export const mockResponses = {
     playVillage: { content: [{ type: 'text', text: 'play 0' }] },
     buyProvince: { content: [{ type: 'text', text: 'buy Province' }] },
     endTurn: { content: [{ type: 'text', text: 'end' }] }
   };
   ```

2. **Mock API calls** (3 hours)
   ```typescript
   jest.spyOn(claudeApi, 'call').mockResolvedValue(mockResponses.playVillage);
   ```

3. **Convert E2E to unit/integration** (2 hours)
   - Same test structure
   - Same assertions
   - Deterministic + fast

**Effort**: 8-9 hours (Phase 3)
**Impact**: Fully deterministic, fast E2E tests

---

## Immediate Action (This Session)

Given token constraints, implementing Option B is too large. Instead:

### Step 1: Document Reason for Skipping

Add comment to test files explaining why:
```typescript
/**
 * E2E tests that call Claude API are SKIPPED by default
 *
 * Reason: Real API calls are non-deterministic, slow, expensive
 * - Test success depends on Claude's response (varies each run)
 * - Each test costs $0.001+ (expensive in CI/CD)
 * - Failures blocked by network/API availability, not code quality
 * - Tests run 3-10 seconds (vs 5ms with mocks)
 *
 * To run manually:
 *   RUN_E2E_TESTS=true npm test -- e2e/haiku-gameplay.test.ts
 *
 * TODO (Phase 3): Replace with mocked responses for CI/CD reliability
 * See: .claude/audits/tests/E2E_TEST_REMEDIATION.md
 */
```

### Step 2: Mark as Skipped

```typescript
const runE2ETests = process.env.RUN_E2E_TESTS === 'true';
const describe E2E = runE2ETests ? describe : describe.skip;
```

### Step 3: Add to Remediation Plan

- Filed in: `.claude/audits/tests/E2E_TEST_REMEDIATION.md`
- Blocked on: Phase 3 (mock implementation)
- Manual testing: Run with `RUN_E2E_TESTS=true`

---

## Testing the Fix

### Verify Tests Don't Block CI
```bash
npm test
# Should pass/skip E2E tests, not fail
```

### Verify Manual Testing Still Works
```bash
RUN_E2E_TESTS=true npm test -- e2e/haiku-gameplay.test.ts
# Tests run against real API
```

---

## Future Work (Phase 3)

When ready to mock Claude API responses:

1. Study current E2E tests
2. Identify all Claude response scenarios
3. Create fixture responses
4. Mock API in beforeEach
5. Convert to unit tests that run in CI/CD
6. Keep one optional E2E suite for manual testing

**Estimated Effort**: 8-10 hours
**Benefit**: Full CI/CD coverage with zero flakiness

---

## Success Criteria

### Immediate (This Session)
- [ ] E2E tests skipped by default
- [ ] E2E tests don't fail in CI/CD
- [ ] Manual testing still possible with env var
- [ ] Documented in code + audit log

### Future (Phase 3)
- [ ] All E2E tests have mocked Claude responses
- [ ] E2E tests run in <5ms per test
- [ ] CI/CD cost reduced to $0 (no API calls)
- [ ] 100% deterministic test results

---

## References

- **Problem**: `.claude/audits/tests/2025-10-23-test-audit.md` (Critical Issue #2)
- **Remediation Guide**: `.claude/audits/tests/REMEDIATION_GUIDE.md` (Issue 2 solution)
- **Best Practices**: `.claude/audits/best-practices/google-unit-testing-principles.md` (Determinism)
- **Anti-patterns**: `.claude/audits/best-practices/software-testing-antipatterns.md` (Flaky tests)

---

**Created**: 2025-10-23
**Status**: Ready for Phase 3 implementation
**Next Step**: Option A (immediate) or Option B (Phase 3, full implementation)
