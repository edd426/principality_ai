# Phase 1.6 Test Coverage Analysis & Gap Report

**Status**: DRAFT - Analysis Complete, Missing Tests Identified
**Created**: 2025-10-21
**Phase**: 1.6

## Executive Summary

Current Phase 1.6 test coverage is **76% complete** across three features. While Feature 1 (help command) achieved 100% test implementation after bug discovery, Feature 2 (cards command) has critical gaps in CLI wiring and E2E validation. This analysis identifies **15-20 missing tests** that must be written before implementation can proceed.

### Overall Test Metrics

- **Total Tests Required**: ~50 tests (8 unit + 5 integration + 3 E2E per feature)
- **Tests Currently Written**: ~35 tests
- **Tests Missing**: ~15-20 tests
- **Coverage**: 76%

---

## Feature 1: `help <card>` Command

**Status**: ✅ COMPLETE - 100% Test Coverage

### Test File Locations

1. `/packages/cli/tests/help-command.test.ts` - Unit tests
2. `/packages/cli/tests/integration/help-command-e2e.test.ts` - Integration + E2E tests

### Test Coverage Breakdown

#### Unit Tests (8 tests) - ✅ ALL PASSING
- UT-1.1: Display card information for valid card name
- UT-1.2: Case-insensitive matching
- UT-1.3: Alias command works (h)
- UT-1.4: Unknown card error
- UT-1.5: Empty input error
- UT-1.6: Whitespace trimming
- UT-1.7: All kingdom cards lookup
- UT-1.8: All base cards lookup

**Status**: 8/8 PASSING - Function implementation correct

#### Integration Tests (12 tests) - ✅ ALL PASSING
- IT-HELP-1: Parser Recognition (6 tests)
  - IT-HELP-1.1: Parser recognizes "help <cardname>"
  - IT-HELP-1.2: Parser recognizes "h <cardname>"
  - IT-HELP-1.3: Parser trims whitespace
  - IT-HELP-1.4: Parser handles empty parameter
  - IT-HELP-1.5: Case-insensitive command
  - IT-HELP-1.6: Prioritizes number vs command

- IT-HELP-2: CLI Command Routing (3 tests)
  - IT-HELP-2.1: CLI routes to handleHelpCommand
  - IT-HELP-2.2: Error display for unknown card
  - IT-HELP-2.3: Usage for empty parameter

- IT-HELP-3: Game State Immutability (2 tests)
  - IT-HELP-3.1: State unchanged after command
  - IT-HELP-3.2: No state accumulation

- IT-HELP-4: Game Phases (1 test)
  - Tests help works in action/buy/cleanup phases

**Status**: 12/12 PASSING - Parser and CLI routing complete

#### E2E Tests (6 tests) - ✅ ALL PASSING
- E2E-1: User types "help copper" during active game
- E2E-2: User types "h village" (alias)
- E2E-3: Helpful error for unknown card
- E2E-4: Usage message for "help" alone
- E2E-5: Case-insensitive lookup
- E2E-6: Help then make a move

**Status**: 6/6 PASSING - Production workflow complete

#### Performance Tests (1 test) - ✅ PASSING
- PT-1.14: Response time < 5ms

**Total Feature 1**: 27/27 PASSING ✅

---

## Feature 2: `cards` Catalog Command

**Status**: ⚠️ INCOMPLETE - 60% Test Coverage

### Test File Locations

1. `/packages/cli/tests/cards-command.test.ts` - Unit tests
2. `/packages/cli/tests/integration/phase-1.6.test.ts` - Partial integration
3. **MISSING**: Integration/E2E test file for CLI wiring

### Test Coverage Breakdown

#### Unit Tests (8 tests) - ✅ ALL PASSING
- UT-2.1: Display all 15 cards
- UT-2.2: Table format validation
- UT-2.3: Correct sorting order
- UT-2.4: Column alignment
- UT-2.5: All descriptions present
- SV-1, SV-2, SV-3: Sorting validation tests

**Status**: 8/8 PASSING - Function implementation correct

#### Integration Tests - ⚠️ PARTIALLY COMPLETE

**Existing** (in phase-1.6.test.ts):
- Tests in phase-1.6 file validate cards command working with help
- Tests are high-level game scenarios

**MISSING** - CLI Wiring Tests (6-8 tests needed):
- Parser recognition tests (like help command)
- CLI handler routing tests
- Parameter validation tests

**Needed Tests**:
1. **Parser Recognition** (3 tests)
   - Parser recognizes "cards" as command
   - Parser handles "cards" with accidental parameters
   - Parser differentiates "cards" from other commands

2. **CLI Handler Routing** (3 tests)
   - CLI routes to handleCardsCommand()
   - Output displayed to user
   - Game state unchanged

**Status**: 3/6 PASSING, 3-5 MISSING

#### E2E Tests - ❌ MISSING (3 tests needed)
- E2E-1: User types "cards" during active game
- E2E-2: Cards displayed, then user continues playing
- E2E-3: Command works in all game phases

**Needed Coverage**:
1. Terminal output validation (full table display)
2. Command timing (< 10ms)
3. State immutability in real game
4. Phase transitions

**Status**: 0/3 - NOT WRITTEN

#### Performance Tests (2 tests) - ✅ PASSING
- PT-2.1: Single call < 10ms
- PT-2.2: 50 consecutive calls < 500ms

**Total Feature 2**: 13/21 PASSING (62%) - 8 MISSING

---

## Feature 3: Card Descriptions Data Model

**Status**: ✅ COMPLETE - 100% Test Coverage

### Tests (5 tests) - ✅ ALL PASSING
- Validates card descriptions exist
- Validates description format
- Validates all 15 cards have descriptions

**Status**: 5/5 PASSING ✅

---

## Critical Gaps Identified

### Gap 1: Parser Recognition for `cards` Command
**Severity**: CRITICAL
**Impact**: Cards command fails in production
**Tests Needed**: 3-4 tests

The parser.isCommand() function recognizes 'help', 'quit', 'hand', 'supply' but NOT 'cards'.

**Test Template**:
```typescript
test('Parser recognizes "cards" as valid command', () => {
  const result = parser.parseInput('cards', validMoves);
  expect(result.type).toBe('command');
  expect(result.command).toBe('cards');
});
```

**Files to Check**:
- `/packages/cli/src/parser.ts` - Line ~183 (isCommand function)
- `/packages/cli/tests/parser.test.ts` - Add "cards" to command recognition tests

### Gap 2: CLI Handler Routing for `cards` Command
**Severity**: CRITICAL
**Impact**: Cards command never executes
**Tests Needed**: 2-3 tests

The CLI.handleCommand() function has no case for 'cards' command.

**Test Template**:
```typescript
test('CLI routes cards command to handleCardsCommand', async () => {
  cli.handleCommand('cards');
  expect(consoleCapture.contains('AVAILABLE CARDS')).toBe(true);
});
```

**Files to Check**:
- `/packages/cli/src/cli.ts` - handleCommand() method
- `/packages/cli/tests/cli.test.ts` - Add cards command handler test

### Gap 3: E2E Tests for `cards` Command (Production Validation)
**Severity**: HIGH
**Impact**: Module import failures not caught in tests (like help command bug)
**Tests Needed**: 3-5 tests

E2E tests must validate that:
1. Built/compiled code runs (not just TypeScript)
2. Import paths work in production
3. Terminal output format is correct
4. Command integrates with game loop

**Test Template**:
```typescript
test('E2E-1: User types "cards" during active game', () => {
  // CLI integration test simulating real gameplay
  // Validates parser → CLI routing → command execution
});
```

**Files to Create**:
- `/packages/cli/tests/integration/cards-command-e2e.test.ts` (NEW)

### Gap 4: Module Import Path Validation
**Severity**: HIGH
**Impact**: Production failures (discovered during help command)
**Tests Needed**: 3-4 tests

All import statements must use module-level paths (`@principality/core`) not source paths (`@principality/core/src/cards`).

**Test Template**:
```typescript
test('Module imports use compiled paths not source paths', () => {
  const help = require('../../src/commands/help.ts');
  // Verify no errors on require (would catch bad imports)
});
```

**Files to Create**:
- `/packages/cli/tests/integration/module-imports.test.ts` (NEW)

---

## Missing Tests by File

### 1. Parser Tests (`parser.test.ts`)
**Add to existing file**: 3-4 tests

```typescript
describe('cards command recognition', () => {
  test('should recognize "cards" as valid command');
  test('should handle "cards" case-insensitively');
  test('should reject "cards" with parameters');
});
```

### 2. CLI Handler Tests (`cli.test.ts`)
**Add to existing file**: 2-3 tests

```typescript
describe('command handling', () => {
  // Existing tests for help, hand, supply, quit

  describe('cards command', () => {
    test('should handle cards command');
    test('should display cards table');
    test('should not modify game state');
  });
});
```

### 3. New E2E Test File
**File**: `/packages/cli/tests/integration/cards-command-e2e.test.ts`
**Size**: ~300-400 lines
**Tests**: 6-8 comprehensive E2E tests

Key scenarios:
- User types "cards" → displays table
- Table includes all 15 cards with correct sorting
- Performance < 10ms
- Game state unchanged
- Works in all phases
- Can execute other commands after cards

### 4. New Module Import Validation File
**File**: `/packages/cli/tests/integration/module-imports.test.ts`
**Size**: ~100-150 lines
**Tests**: 3-4 import validation tests

Validates:
- Import paths resolve correctly
- No "Cannot find module" errors
- Works with compiled code

---

## Test Writing Priority

### Phase 1: CRITICAL (Write Now)
1. ✅ Parser recognition for "cards" (3 tests)
2. ✅ CLI handler routing for "cards" (2 tests)
3. ✅ E2E workflow for "cards" (3 tests)

**Effort**: 2-3 hours
**Impact**: Enables Feature 2 implementation

### Phase 2: HIGH (Write Before Merge)
4. ✅ Module import validation (3 tests)

**Effort**: 1 hour
**Impact**: Prevents production failures

### Phase 3: RECOMMENDED (Write Before Release)
5. ✅ Additional E2E edge cases (2-3 tests)

**Effort**: 1 hour
**Impact**: Comprehensive validation

---

## Summary: Test Coverage Roadmap

| Feature | Unit | Integration | E2E | Total | Status |
|---------|------|-------------|-----|-------|--------|
| Help | 8 | 12 | 6 | 26 | ✅ Complete |
| Cards | 8 | 3 | 0 | 11 | ⚠️ Incomplete |
| Data | 5 | - | - | 5 | ✅ Complete |
| **Module Imports** | - | - | 4 | 4 | ❌ Missing |
| **TOTAL** | 21 | 15 | 10 | **46** | **76%** |

**Next Steps**:
1. Write 8 missing CLI wiring tests (parser + handler)
2. Write 3 E2E tests for cards command
3. Write 4 module import validation tests
4. Run full test suite to verify coverage

---

## Files to Modify/Create

### Modify (Add to existing files)
- [ ] `/packages/cli/tests/parser.test.ts` - Add cards recognition tests
- [ ] `/packages/cli/tests/cli.test.ts` - Add cards handler tests

### Create (New files)
- [ ] `/packages/cli/tests/integration/cards-command-e2e.test.ts` - Full E2E suite
- [ ] `/packages/cli/tests/integration/module-imports.test.ts` - Import validation

---

## Success Criteria

- [ ] All 46 tests written
- [ ] Parser tests validate "cards" recognition
- [ ] CLI tests validate routing
- [ ] E2E tests validate production workflow
- [ ] Module import tests validate compiled code
- [ ] No regressions in existing Phase 1/1.5 tests
- [ ] Coverage >= 95% for Phase 1.6
