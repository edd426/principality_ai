# Test Quality Audit - GitHub Issue #19
**Status**: ACTIVE
**Created**: 2025-11-16
**Phase**: 4
**Related Issue**: https://github.com/edd426/principality_ai/issues/19

## Executive Summary

Comprehensive analysis of why 5 bugs (#8, #10, #12, #13, #14) shipped to production despite 97.4% test coverage. Found systematic test quality issues:

- ✅ High code coverage (97.4%)
- ❌ Weak assertions (checking length, not correctness)
- ❌ Missing integration tests (unit tests pass, integration fails)
- ❌ No display/validation sync verification
- ❌ No user feedback verification

**Conclusion**: Project has a **test quality problem**, not a test quantity problem.

## Bugs Analyzed

### Summary Table

| Bug | Card | Shipped | Fixed | Root Cause | Test Gap |
|-----|------|---------|-------|------------|----------|
| #8 | Cellar | Nov 8 | Nov 13 | Missing handler + duplicates | Weak assertions, no integration |
| #10 | Bureaucrat | Nov 8 | Nov 8 | Input validation mismatch | No display/validation sync test |
| #12 | Remodel | Nov 8 | Nov 8 | Display/validation mismatch | No sync verification |
| #13 | End Phase | Nov 8 | Nov 13 | Missing log entries | No feedback assertions |
| #14 | Mine | Nov 8 | Nov 16 | Missing effect handler | No handler coverage test |

### Detailed Bug Analysis

#### Bug #8: Cellar (Infinite Loop + Duplicates)
**Fix**: commit 661a92c, PR #46

**Problem 1 - Infinite Loop**:
- `getValidMovesForPendingEffect()` missing case for `'discard_for_cellar'`
- Returned empty array → infinite prompt loop

**Problem 2 - Duplicate Options**:
- `getCombinations()` used position-based bit-masking
- Treated each card instance as unique ([Copper₀, Copper₁])
- Generated permutations instead of combinations

**Why Tests Didn't Catch It**:

```typescript
// Actual test (packages/core/tests/presentation-move-options.test.ts:47)
it('should generate all combinations for 3-card hand', () => {
  const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
  const options = generateCellarOptions(hand);

  // Comment says: "6 UNIQUE combinations (not 8 with duplicates)"
  expect(options).toHaveLength(6);  // ❌ WEAK ASSERTION
});
```

**Test checked LENGTH but not UNIQUENESS**. Would pass with 6 duplicates as long as count was 6.

#### Bug #10: Bureaucrat Input Validation
**Fix**: commit eceeb3e, PR #44

**Problem**:
Validation expected range format "1-0", users entered "1"

**Why Tests Didn't Catch It**:
No test verified "what user sees = what user can select"

#### Bug #12: Remodel Display/Validation Mismatch
**Fix**: commit 08402b3

**Problem**:
- Display: `hand.map()` → 4 options shown
- Validation: `new Set(hand)` → 3 options accepted

**Why Tests Didn't Catch It**:
No integration test executed displayed options

#### Bug #13: End Phase Stale Messages
**Fix**: commit f81e721

**Problem**:
`endPhase()` didn't add gameLog entries

**Why Tests Didn't Catch It**:
Tests checked state transitions, not user feedback

#### Bug #14: Mine "Unknown move"
**Fix**: commit 5a73a74

**Problem**:
Missing `'gain_treasure'` handler in `generateMoveOptions()`

**Why Tests Didn't Catch It**:
No test ensuring all effect types have handlers

## Common Patterns: Root Causes

### Pattern 1: Weak Assertions
**Impact**: 2/5 bugs (40%)

Tests check **existence** not **correctness**:
- Check length, not uniqueness
- Check structure, not values
- Check types, not content

**Example**:
```typescript
expect(options).toHaveLength(6);  // ❌ Weak
expect(new Set(normalized).size).toBe(6);  // ✅ Strong
```

### Pattern 2: Missing Integration Tests
**Impact**: 3/5 bugs (60%)

Unit tests pass, but full workflows fail:
- ✅ `generateCellarOptions()` works
- ✅ `executeMove()` works
- ❌ **MISSING**: play Cellar → getValidMoves → execute

### Pattern 3: No Display/Validation Sync Tests
**Impact**: 2/5 bugs (40%)

Display and validation logic diverge:
- Different functions
- Different assumptions
- No sync verification

### Pattern 4: No Feedback Verification
**Impact**: 1/5 bugs (20%)

Tests check state, not user experience:
- State transitions ✅
- GameLog entries ❌
- UI messages ❌

### Pattern 5: No Handler Coverage Tests
**Impact**: 2/5 bugs (40%)

No systematic verification that:
- All effect types have handlers
- All move types have formatters
- All interactions have options

## Test Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Line Coverage | 97.4% | 95%+ | ✅ Met |
| Branch Coverage | Unknown | 90%+ | ❓ Need to measure |
| **Assertion Strength** | **Weak** | **Strong** | ❌ **Major gap** |
| **Integration Coverage** | **Gaps** | **100% critical paths** | ❌ **Missing** |
| **Handler Coverage** | **Incomplete** | **All handlers** | ❌ **Missing** |
| Mutation Score (est.) | 60-70% | 80%+ | ❌ Below target |

## Recommendations

### Immediate (Can Implement Now)

#### 1. Strengthen Assertions
Add uniqueness checks to all option generation tests:

```typescript
// Before
expect(options).toHaveLength(6);

// After
const normalized = options.map(opt =>
  [...(opt.move.cards || [])].sort().join(',')
);
expect(new Set(normalized).size).toBe(normalized.length);
expect(options).toHaveLength(6);
```

**Files to update**:
- `packages/core/tests/presentation-move-options.test.ts`
- All card-specific option tests

#### 2. Add Integration Tests
Test full workflows for all interactive cards:

```typescript
test('Cellar: full workflow from play to resolution', () => {
  // 1. Play Cellar
  let result = engine.executeMove(state, { type: 'play_action', card: 'Cellar' });
  expect(result.success).toBe(true);

  // 2. Get valid moves (should not be empty!)
  const moves = engine.getValidMoves(result.newState!);
  expect(moves.length).toBeGreaterThan(0);

  // 3. Execute discard
  result = engine.executeMove(result.newState!, moves[0]);
  expect(result.success).toBe(true);

  // 4. Verify pendingEffect cleared (no infinite loop)
  expect(result.newState!.pendingEffect).toBeUndefined();
});
```

**Cards to cover**: Cellar, Chapel, Remodel, Mine, Workshop, Feast, Library, Chancellor, Spy, Bureaucrat, Militia, Thief, Throne Room

#### 3. Add Display/Validation Sync Tests
Verify every displayed option is executable:

```typescript
test('Remodel: all displayed options are valid', () => {
  const state = /* setup with Remodel */;
  const validMoves = engine.getValidMoves(state);
  const displayOptions = generateMoveOptions(state, validMoves);

  // Every displayed option should be executable
  displayOptions.forEach(opt => {
    const result = engine.executeMove(state, opt.move);
    expect(result.success).toBe(true);
  });
});
```

#### 4. Add Effect Handler Coverage Test
Create a registry test that fails if handlers are missing:

```typescript
const ALL_EFFECT_TYPES = [
  'discard_for_cellar',
  'trash_for_chapel',
  'remodel_step1',
  'remodel_step2',
  'mine_step1',
  'mine_step2',
  'gain_card',
  'throne_room_choice',
  'library_choice',
  'chancellor_choice',
  'spy_choice',
  'bureaucrat_choice',
  'reveal_reaction',
  'militia_discard',
  'thief_choice',
] as const;

test.each(ALL_EFFECT_TYPES)(
  'should have handler for effect "%s"',
  (effectType) => {
    const state = createStateWithEffect(effectType);
    const moves = engine.getValidMoves(state);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(m => m.type === effectType)).toBe(true);
  }
);
```

#### 5. Add Feedback Assertions
Verify gameLog entries for all user actions:

```typescript
test('End Phase: displays phase end message', () => {
  const result = engine.executeMove(state, { type: 'end_phase' });
  expect(result.success).toBe(true);
  expect(result.newState!.gameLog).toContainEqual(
    expect.stringContaining('ended buy phase')
  );
});
```

### Medium-Term (Next Sprint)

#### 6. Run Mutation Testing
Install and run Stryker:

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
npx stryker run
```

Target: 80%+ mutation score

#### 7. Add Property-Based Testing
Use fast-check for combinatorial testing:

```typescript
import * as fc from 'fast-check';

test('getCombinations produces unique combinations for any hand', () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom(...ALL_CARD_NAMES)),
      (hand) => {
        const combinations = getCombinations(hand);
        const normalized = combinations.map(c => c.sort().join(','));
        const unique = new Set(normalized);
        expect(unique.size).toBe(normalized.length);
      }
    )
  );
});
```

#### 8. Create Test Architecture Linter
Enforce test patterns via ESLint custom rules:

- Every `executeMove()` test must check `result.success`
- Every option generation test must check uniqueness
- Every integration test must cover error paths

## Test Suite Health (Current Status)

As of 2025-11-16:

```
Test Suites: 3 failed, 2 skipped, 18 passed, 21 of 23 total
Tests:       2 failed, 95 skipped, 592 passed, 689 total
```

**Known Issues**:
1. Tests expect 8 supply cards, now 17 (Phase 4) - needs update
2. TypeScript strict null checks on `pendingEffect.options` - needs assertions
3. 95 skipped tests - need review (may hide bugs)

## Implementation Checklist

- [ ] Add uniqueness assertions to option generation tests
- [ ] Add integration tests for all 13 interactive cards
- [ ] Add display/validation sync tests
- [ ] Add effect handler coverage test
- [ ] Add feedback assertions to phase transition tests
- [ ] Install and run Stryker mutation testing
- [ ] Add property-based tests for combinatorial functions
- [ ] Create test architecture linter
- [ ] Fix 3 failing test suites
- [ ] Review and fix/remove 95 skipped tests
- [ ] Update expectations for Phase 4 (17 cards vs 8)

## References

- **Full Analysis**: `.claude/sessions/2025-11-16/issue-19-test-quality-audit-analysis.md` (session notes)
- **Bug Commits**: 661a92c, eceeb3e, 08402b3, f81e721, 5a73a74
- **Related Issues**: #8, #10, #12, #13, #14, #19
- **Test Files**: `packages/core/tests/presentation-move-options.test.ts`, `packages/core/tests/bug-cellar-issue-8.test.ts`
