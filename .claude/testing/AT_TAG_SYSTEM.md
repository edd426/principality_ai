# @ Tag System for Test Requirement Traceability

**Status**: ACTIVE
**Created**: 2025-10-26
**Purpose**: Document inline requirement-test linking using minimal-token @ tag format

---

## Overview

The @ tag system provides inline documentation of test-requirement relationships using minimal tokens and git-tracked format.

**Benefits:**
- ✅ Direct test-to-requirement linking (machine-readable)
- ✅ Minimal token overhead (~10 words per test)
- ✅ Embedded in artifacts (zero extra I/O cost)
- ✅ Survives crashes (git-tracked)
- ✅ Easily searchable with grep

---

## Tag Types and Usage

### @req: Core Requirement

**Purpose**: Document which requirement(s) this test validates

**Format**:
```typescript
// @req: Rphase-seq - Description of requirement
```

**Location**: At start of test file or test describe block

**Examples:**

```typescript
// @req: R1.5-01 - Auto-play treasures with single command
// @req: R1.6-01 - help <card> displays "Name | Cost | Type | Effect"
// @req: R2.0-05 - game_observe returns current game state
// @req: R2.1-03 - Strategy skill provides buying guidance
```

**Multiple Requirements**:
If a single test validates multiple requirements, use multiple @req tags:

```typescript
// @req: R2.0-08 - Execute move validates game rules
// @req: R2.0-09 - Execute move returns new game state
describe('game_execute tool', () => {
  it('should execute valid move and return new state', () => {
    // test validates both R2.0-08 and R2.0-09
  });
});
```

**Verification**:
```bash
# Find all tests for requirement R1.5-01
grep -r "@req: R1.5-01" packages/*/tests/

# Count total requirements covered
grep -r "@req:" packages/*/tests/ | wc -l
```

---

### @edge: Edge Cases and Error Conditions

**Purpose**: Document edge cases, error conditions, and boundary cases being tested

**Format**:
```typescript
// @edge: Condition that triggers edge case behavior
```

**Location**: Comment above the test or in test describe block

**Examples:**

```typescript
// @edge: Unknown card name → helpful error message
// @edge: Empty deck → game ends gracefully
// @edge: Invalid move during wrong phase → rejected with reason
// @edge: Chain with first move invalid → full rollback, no partial updates
// @edge: Case-insensitive card matching
```

**Use Cases:**

Edge cases to document:
- Error conditions (invalid input, missing data, wrong phase)
- Boundary conditions (empty, full, zero, max value)
- Special cases (null, undefined, whitespace)
- Constraints (performance, ordering, atomicity)

**Example Test with @edge**:

```typescript
// @req: R1.6-01 - help <card> displays card information
// @edge: Unknown card → helpful error; case-insensitive; whitespace trimmed
describe('help command', () => {
  it('should display card info for valid card', () => { ... });
  it('should show error for unknown card', () => { ... });
  it('should be case-insensitive', () => { ... });
  it('should trim whitespace from input', () => { ... });
});
```

**Verification**:
```bash
# Find all edge case tests
grep -r "@edge:" packages/*/tests/ | head -20

# Count edge case coverage
grep -r "@edge:" packages/*/tests/ | wc -l
```

---

### @why: Rationale for Non-Obvious Behavior

**Purpose**: Explain why non-obvious requirements or test patterns exist

**Format**:
```typescript
// @why: Reason this behavior is important or necessary
```

**Location**: Comment above complex or non-obvious tests

**Examples:**

```typescript
// @why: Atomic chain operations prevent corruption if any move fails
// @why: Seed-based randomness required for AI agent reproducibility
// @why: Fast response (<5ms) critical for CLI interactive experience
// @why: Immutable state prevents subtle state-sharing bugs
// @why: Full rollback required even if first move succeeds but second fails
```

**When to Use @why**:

Use for tests where the "why" might not be obvious:
- Performance requirements (why is <100ms important?)
- Atomic/transactional behavior (why full rollback?)
- Immutability constraints (why not mutate state?)
- Design decisions (why this specific format?)
- Business logic (why this rule exists in game)

**Example Test with @why**:

```typescript
// @req: R1.5-03 - Multi-card chaining allows sequence of moves
// @edge: Invalid move in middle of chain → full rollback to original state
// @why: Atomic operations prevent game state corruption; user expects all-or-nothing behavior
describe('chained move submission', () => {
  it('should execute all valid moves in sequence', () => { ... });
  it('should rollback entire chain if any move fails', () => {
    // This is non-obvious - @why tag explains the design decision
  });
});
```

---

## Placement Guidelines

### Rule 1: @req at Start of Test Suite

Place @req tags at the beginning of the describe block or test file:

✅ **GOOD**:
```typescript
/**
 * Test Suite: Phase 1.6 - Card Help Commands
 */

// @req: R1.6-01 - help <card> displays card information
// @req: R1.6-02 - cards command shows all available cards
describe('Card help system', () => {
  describe('help command', () => {
    it('should display card info', () => { ... });
  });
});
```

❌ **BAD** (buried in individual test):
```typescript
describe('Card help system', () => {
  it('should display card info', () => {
    // @req: R1.6-01 - ← Too late, hard to scan
  });
});
```

---

### Rule 2: @edge with Related Tests

Place @edge tags close to tests they describe:

✅ **GOOD**:
```typescript
describe('help command', () => {
  // @edge: Unknown card → helpful error
  it('should show error for unknown card', () => { ... });

  // @edge: Case-insensitive matching
  it('should match card names case-insensitively', () => { ... });

  // @edge: Whitespace trimming
  it('should trim whitespace from input', () => { ... });
});
```

---

### Rule 3: @why for Complex Logic

Place @why tags above complex or non-obvious test logic:

✅ **GOOD**:
```typescript
it('should rollback entire chain if any move fails', () => {
  // @why: Atomic operations prevent state corruption
  // User expects all-or-nothing: either all moves succeed or none do

  // test code
});
```

---

## Tag Format Reference

### Requirement ID Format

Requirement IDs follow pattern: **Rphase-sequence**

Examples:
- `R1.5-01` - Phase 1.5, Feature 1, Requirement 1
- `R1.6-03` - Phase 1.6, Feature 3, Requirement 3
- `R2.0-12` - Phase 2.0, Feature 3, Requirement 12
- `R2.1-07` - Phase 2.1, Feature 4, Requirement 7

### Tag Line Format

```typescript
// @tag_type: Content describing the tag
```

Rules:
- Single space after `//`
- Tag type in lowercase: `@req`, `@edge`, `@why`
- Colon after tag type
- Single space before content
- Content is descriptive and specific

---

## Examples by Phase

### Phase 1.5 Example: Auto-play Treasures

```typescript
/**
 * Test Suite: Phase 1.5 Feature 1 - Auto-play Treasures
 */

// @req: R1.5-01 - Play all treasures with single command
// @edge: Empty hand → auto-play finds nothing to play
// @edge: Mixed treasures and actions → play only treasures
// @why: Command-based approach maintains player control over gameplay

describe('Auto-play treasures command', () => {
  it('should play all treasure cards in hand', () => { ... });
  it('should ignore action cards when auto-playing', () => { ... });
  it('should handle empty treasure hand gracefully', () => { ... });
});
```

### Phase 1.6 Example: Help Command

```typescript
// @req: R1.6-01 - help <card> displays card information
// @edge: Unknown card → helpful error message
// @edge: Case-insensitive matching
// @edge: Whitespace trimmed from input
// @why: Players need quick reference without leaving game interface

describe('help <card> command', () => {
  it('should display card information for valid card', () => { ... });
  it('should show error for unknown card', () => { ... });
  it('should be case-insensitive', () => { ... });
});
```

### Phase 2.0 Example: Game Execute

```typescript
// @req: R2.0-08 - Execute move validates and returns new state
// @req: R2.0-09 - Invalid moves rejected with error message
// @edge: Invalid move during wrong phase → rejected
// @edge: Move requiring >5 actions available → rejected
// @why: Atomic move execution prevents state corruption
// @why: Validation prevents invalid game states from being reached

describe('game_execute tool', () => {
  it('should execute valid move and return new state', () => { ... });
  it('should reject invalid move', () => { ... });
  it('should validate action phase requirements', () => { ... });
});
```

### Phase 2.0-NEW Example: Game End Detection and Move Blocking

**Context**: Critical bug fix for Oct 27 game session where AI continued playing after game should end.
- Root cause: `gameOver` flag only in "full" detail level; AI used "standard" detail
- Solution: gameOver in ALL detail levels + move blocking
- Tests: 18 tests (UT-GE.1 through UT-GE.6, IT-GE.1 through IT-GE.2, plus UT2.16-UT2.19)

```typescript
// @req: R2.0-NEW - Game end detection and move blocking
// @edge: Province pile = 0 → game ends
// @edge: 3+ supply piles = 0 → game ends
// @edge: 2 supply piles = 0, Province > 0 → game continues (boundary)
// @edge: Game-over check happens BEFORE move parsing
// @why: AI must detect game end to avoid stuck loops
// @why: Consistency across detail levels critical; AI switches mid-game
// @why: gameOver calculated once per call (efficiency)

describe('Feature R2.0-NEW: Game End Detection and Move Blocking', () => {
  describe('UT-GE.1: Move Blocking - All Move Types', () => {
    // @edge: play_action blocked after game ends
    it('should block play_action moves after game ends', () => { ... });

    // @edge: play_treasure blocked after game ends
    it('should block play_treasure moves after game ends', () => { ... });

    // @edge: buy blocked after game ends (was the bug in Oct 27 session)
    it('should block buy moves after game ends', () => { ... });

    // @edge: end_phase blocked after game ends
    it('should block end_phase moves after game ends', () => { ... });
  });

  describe('UT-GE.2: Error Messages - Clarity and Guidance', () => {
    // @why: Users need to know WHY moves are rejected and HOW to proceed
    it('should provide clear error message when game is over', () => { ... });

    // @why: Without suggestion, AI might loop forever trying invalid moves
    it('should include suggestion to restart via game_session', () => { ... });

    it('should include reason why game ended in error details', () => { ... });

    // @edge: Different reasons require different messages
    it('should distinguish Province-empty from pile-depletion endings', () => { ... });
  });

  describe('UT-GE.3: Game Over Detection - Province Depletion', () => {
    // @edge: Exactly Province = 0, not Province < 0 or Province = 1
    it('should detect game over when Province quantity = 0', () => { ... });

    // @edge: Boundary: Province = 1 should NOT trigger game over
    it('should not detect game over when Province quantity = 1', () => { ... });

    // @why: Province is unique; its depletion signals game end regardless
    it('should be the primary game-end condition', () => { ... });
  });

  describe('UT-GE.4: Game Over Detection - Pile Depletion', () => {
    // @edge: Exactly 3 piles empty, not 2 or 4
    it('should detect game over when exactly 3 piles are empty', () => { ... });

    // @edge: 4+ piles also means game over (>= 3, not exact)
    it('should detect game over when 4+ piles are empty', () => { ... });

    // @edge: Boundary: 2 empty piles is NOT game-ending
    it('should NOT detect game over when only 2 piles are empty', () => { ... });
  });

  describe('UT-GE.5: Move Parsing Happens After Game-Over Check', () => {
    // @why: Game-over is first check; parsing happens only if game active
    it('should reject move before parsing if game is over', () => { ... });

    // @edge: Malformed + game over → error is "game over", not "parse error"
    it('should return game-over error consistently', () => { ... });
  });

  describe('UT-GE.6: Only game_session Allowed After Game Ends', () => {
    // @why: Prevents AI from being stuck in move-execution loop
    it('should reject any move-based command after game ends', () => { ... });

    // @why: Only way to continue after game ends
    it('game_session(command="new") should work post-game', () => { ... });

    // @edge: Observing state should still work (needed for error understanding)
    it('game_observe should still work after game ends', () => { ... });
  });

  describe('IT-GE.1: Integration - Full Game-End Sequence', () => {
    // @why: Reproduces exact Oct 27 bug scenario
    // @req: R2.0-NEW - Complete flow from active game to blocked state
    it('should follow complete game-end sequence', () => {
      // 1. game_observe() → gameOver: false
      // 2. game_execute("buy Province") → succeeds, Province = 0
      // 3. game_observe() → gameOver: true
      // 4. game_execute("play Copper") → blocked with error
      // 5. game_session(command="new") → restart
    });
  });

  describe('IT-GE.2: Integration - Multi-Turn Game Ending', () => {
    // @why: Verify detection works mid-game, not just early
    // @edge: Oct 27 session lasted 43 turns; game should end at turn 23
    it('should correctly identify game-end across multiple turns', () => { ... });
  });

  describe('UT2.16-UT2.19: Observe Detail Levels with gameOver', () => {
    // @req: R2.0-NEW - gameOver in ALL detail levels
    // @edge: Minimal detail (60 tokens) includes gameOver
    // @edge: Standard detail (270 tokens) includes gameOver
    // @edge: Full detail (1050 tokens) includes gameOver
    // @why: AI may use different detail levels mid-game; consistency required

    describe('UT2.16: Game Over Detection - Minimal Detail', () => {
      // @req: R2.0-NEW - gameOver available in minimal detail
      it('should include gameOver flag in minimal detail level', () => { ... });

      // @edge: Minimal still fits token budget with gameOver
      it('minimal detail gameOver should be token-efficient', () => { ... });
    });

    describe('UT2.17: Game Over Detection - Standard Detail', () => {
      // @req: R2.0-NEW - gameOver available in standard detail
      // @why: Fixes Oct 27 bug where standard detail lacked gameOver
      it('should include gameOver flag in standard detail level', () => { ... });

      // @edge: Standard still fits token budget (200-300 tokens)
      it('standard detail should keep response under 300 tokens', () => { ... });
    });

    describe('UT2.18: Game Over Detection - Full Detail', () => {
      // @req: R2.0-NEW - gameOver available in full detail
      // @edge: Backward compatibility with existing full detail
      it('should include gameOver flag in full detail level', () => { ... });

      // @edge: Full still fits token budget (< 1200 tokens)
      it('full detail should keep response under 1200 tokens', () => { ... });
    });

    describe('UT2.19: Game Over Detection Logic', () => {
      // @req: R2.0-NEW - Consistent detection across all detail levels
      // @why: Single source of truth for game-over status
      it('game over detection should be consistent across all detail levels', () => { ... });

      // @edge: Boundary: exactly 3 piles (not 2, not 4)
      it('should NOT detect game over with 2 empty piles', () => { ... });

      // @edge: Both conditions must be checked (OR relationship)
      it('should NOT detect game over if Province > 0 and < 3 piles empty', () => { ... });
    });
  });
});
```

**Key Insights from @ Tags**:
1. `@req: R2.0-NEW` - Single source of truth requirement ID
2. `@edge` tags document boundary conditions: Province = 0, exactly 3 piles, sequence of events
3. `@why` tags explain non-obvious: "Why consistency?", "Why game-over before parsing?", "Why this bug?"
4. Tags enable finding all tests for a requirement: `grep -r "R2.0-NEW" packages/*/tests/`

---

## Validation

### Manual Validation

**Checklist**:
- [ ] Every test file has at least one @req tag
- [ ] @req tags reference real requirements (check TRACEABILITY_MATRIX.md)
- [ ] @edge tags describe actual edge cases in tests
- [ ] @why tags explain non-obvious design decisions
- [ ] All tags use correct format (// @tag_type: content)
- [ ] No typos in requirement IDs

**Quick Check**:
```bash
# List all @ tags
grep -r "@req:\|@edge:\|@why:" packages/*/tests/

# Check for specific requirement coverage
grep -r "@req: R1.5-01" packages/*/tests/

# Validate tag format
grep -r "@[a-z]*:" packages/*/tests/ | grep -v "// @"  # Should find nothing
```

### Automated Validation (Future)

Script to validate:
- All @req IDs exist in TRACEABILITY_MATRIX.md
- All test files have @req tags
- All @req tags are unique and mapped correctly
- No orphaned @edge tags

See `scripts/check-traceability.ts` (in development)

---

## Best Practices

### DO ✅

- ✅ Use precise requirement IDs from TRACEABILITY_MATRIX.md
- ✅ Document edge cases that tests verify
- ✅ Explain "why" for non-obvious requirements
- ✅ Update @ tags when requirements change
- ✅ Group related tests under single @req block
- ✅ Keep tags concise and specific

### DON'T ❌

- ❌ Make up requirement IDs
- ❌ Write vague tag descriptions
- ❌ Forget to update tags when tests change
- ❌ Put @req inside test function (put at describe block)
- ❌ Document obvious behavior in @why (only non-obvious)
- ❌ Write requirements in @ tags (use TRACEABILITY_MATRIX.md)

---

## Integration with Development Workflow

### When Creating New Tests

1. **Identify requirement(s)** being tested
2. **Find Req ID** in TRACEABILITY_MATRIX.md
3. **Add @req tag** at start of describe block
4. **Document edge cases** with @edge tags
5. **Explain non-obvious logic** with @why tags
6. **Write test code**
7. **Verify tags** before committing

### When Updating Tests

1. **Check @ tags** still accurate
2. **Add new tags** if testing additional requirements
3. **Remove tags** if no longer relevant
4. **Update TRACEABILITY_MATRIX.md** if requirements changed
5. **Commit tags** with test changes (same commit)

### Code Review Checklist

- [ ] @req tags present and reference real requirements
- [ ] @edge tags describe actual edge cases being tested
- [ ] @why tags explain non-obvious design decisions
- [ ] Tags accurate and well-formatted
- [ ] Tags match new/modified test logic

---

## Grep Recipes

### Find all tests for a requirement
```bash
grep -r "@req: R1.5-01" packages/*/tests/
```

### List all requirements tested
```bash
grep -h "@req:" packages/*/tests/*.ts | sort | uniq
```

### Find tests with edge cases
```bash
grep -r "@edge:" packages/*/tests/ | head -20
```

### Count total tests with @ tags
```bash
grep -r "@req:" packages/*/tests/ | wc -l
```

### Validate @ tag format
```bash
# Should find nothing (all @ tags should be in comments)
grep -r "@[a-z]*:" packages/*/tests/ | grep -v "// @"
```

---

## Related Documentation

- **Traceability Matrix**: `docs/requirements/TRACEABILITY_MATRIX.md`
- **Spec Framework**: `.claude/audits/spec-traceability/SPEC_TRACEABILITY_BEST_PRACTICES.md`
- **Audit Checklist**: `.claude/audits/spec-traceability/AUDIT_CHECKLIST.md`

---

**Version**: 1.0
**Owner**: Requirements Architect
**Last Updated**: 2025-10-26
**Next Review**: When adding @ tags to test files begins
