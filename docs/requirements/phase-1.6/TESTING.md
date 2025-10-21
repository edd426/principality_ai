# Phase 1.6 Testing Specifications: Card Help Lookup System

**Status**: DRAFT
**Created**: 2025-10-20
**Phase**: 1.6

---

## Testing Overview

Phase 1.6 requires comprehensive test coverage to maintain the project's 95%+ test coverage standard established in Phase 1 and 1.5.

**Test Strategy**:
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test CLI commands in full game context
- **Performance Tests**: Verify lookup times meet < 5ms requirement
- **Validation Tests**: Ensure all cards have proper descriptions

**Total Test Cases**: 29 tests across all features

---

## Test Environment Setup

### Prerequisites

**Test Framework**: Jest (already configured)

**Test Files**:
- `packages/core/tests/cards.test.ts` - Card definition validation
- `packages/cli/tests/help-command.test.ts` - Help command tests
- `packages/cli/tests/cards-command.test.ts` - Cards command tests
- `packages/cli/tests/integration/phase-1.6.test.ts` - Integration tests

**Test Data**: Use actual card definitions from `packages/core/src/cards.ts`

### Test Utilities

```typescript
// Helper to capture CLI output
function captureOutput(command: string): string {
  // Mock console.log and capture output
}

// Helper to initialize test game
function initTestGame(): GameState {
  const engine = new GameEngine('test-seed');
  return engine.initializeGame(1);
}

// Helper to verify table formatting
function isValidTableFormat(output: string): boolean {
  // Check for header, separator, aligned columns
}
```

---

## Feature 1 Tests: `help <card>` Command

**Test File**: `packages/cli/tests/help-command.test.ts`

### Unit Tests (8 tests)

#### Test 1.1: Display Card Information - Success Case
```typescript
describe('help command', () => {
  test('displays card information for valid card name', () => {
    const output = handleHelpCommand('Village');

    expect(output).toContain('Village');
    expect(output).toContain('3'); // cost
    expect(output).toContain('Action'); // type
    expect(output).toContain('+1 Card, +2 Actions'); // effect
    expect(output).toMatch(/Village\s*\|\s*3\s*\|\s*Action\s*\|/);
  });
});
```

**Expected Result**: Output matches format "Village | 3 | Action | +1 Card, +2 Actions"

---

#### Test 1.2: Case-Insensitive Matching
```typescript
test('handles case-insensitive card names', () => {
  const lowercase = handleHelpCommand('village');
  const uppercase = handleHelpCommand('VILLAGE');
  const mixedcase = handleHelpCommand('ViLLaGe');

  expect(lowercase).toEqual(uppercase);
  expect(uppercase).toEqual(mixedcase);
  expect(lowercase).toContain('Village'); // Displays proper case
});
```

**Expected Result**: All variations return identical output with proper card name casing

---

#### Test 1.3: Alias Command Works
```typescript
test('h alias works identically to help', () => {
  const helpOutput = handleHelpCommand('Smithy');
  const aliasOutput = handleHAliasCommand('Smithy');

  expect(aliasOutput).toEqual(helpOutput);
});
```

**Expected Result**: `h` alias produces identical output to `help`

---

#### Test 1.4: Unknown Card Error
```typescript
test('returns error for unknown card name', () => {
  const output = handleHelpCommand('FakeCard');

  expect(output).toContain('Unknown card');
  expect(output).toContain('FakeCard');
  expect(output).toContain("Type 'cards' to see all available cards");
  expect(output).not.toContain('|'); // Not a valid card output
});
```

**Expected Result**: Clear error message with suggestion to use `cards` command

---

#### Test 1.5: Empty Input Error
```typescript
test('returns usage message for empty input', () => {
  const output = handleHelpCommand('');

  expect(output).toContain('Usage');
  expect(output).toContain('help <card_name>');
});
```

**Expected Result**: Usage message displayed

---

#### Test 1.6: Whitespace Trimming
```typescript
test('trims whitespace from card name', () => {
  const output = handleHelpCommand('  Market  ');

  expect(output).toContain('Market');
  expect(output).toContain('+1 Card, +1 Action, +1 Buy, +1 Coin');
});
```

**Expected Result**: Whitespace is trimmed, card found successfully

---

#### Test 1.7: All Kingdom Cards Lookup
```typescript
test('successfully looks up all kingdom cards', () => {
  const kingdomCards = ['Village', 'Smithy', 'Laboratory', 'Festival',
                        'Market', 'Woodcutter', 'Council Room', 'Cellar'];

  kingdomCards.forEach(card => {
    const output = handleHelpCommand(card);
    expect(output).toContain(card);
    expect(output).toMatch(/\|\s*\d+\s*\|/); // Contains cost
    expect(output).toContain('Action');
  });
});
```

**Expected Result**: All 8 kingdom cards return valid information

---

#### Test 1.8: All Base Cards Lookup
```typescript
test('successfully looks up all base cards', () => {
  const baseCards = {
    'Copper': 'Treasure',
    'Silver': 'Treasure',
    'Gold': 'Treasure',
    'Estate': 'Victory',
    'Duchy': 'Victory',
    'Province': 'Victory',
    'Curse': 'Curse'
  };

  Object.entries(baseCards).forEach(([card, expectedType]) => {
    const output = handleHelpCommand(card);
    expect(output).toContain(card);
    expect(output).toContain(expectedType);
  });
});
```

**Expected Result**: All 7 base cards return valid information

---

### Integration Tests (5 tests)

**Test File**: `packages/cli/tests/integration/phase-1.6.test.ts`

#### Test 1.9: Help During Action Phase
```typescript
test('help command works during action phase', () => {
  const game = initTestGame();
  expect(game.phase).toBe('action');

  const output = executeCommand(game, 'help Village');

  expect(output).toContain('Village');
  expect(game.phase).toBe('action'); // State unchanged
  expect(game.turnNumber).toBe(1); // Turn unchanged
});
```

**Expected Result**: Help displayed, game state unchanged

---

#### Test 1.10: Help During Buy Phase
```typescript
test('help command works during buy phase', () => {
  const game = initTestGame();
  // Progress to buy phase
  const result = engine.executeMove(game, { type: 'end_phase' });
  const buyGame = result.gameState;
  expect(buyGame.phase).toBe('buy');

  const output = executeCommand(buyGame, 'help Province');

  expect(output).toContain('Province');
  expect(buyGame.phase).toBe('buy'); // State unchanged
});
```

**Expected Result**: Help displayed during buy phase, state unchanged

---

#### Test 1.11: Help Between Turns
```typescript
test('help command works between turns', () => {
  const game = initTestGame();
  // Complete a full turn (action -> buy -> cleanup)
  // ... advance to next player's turn

  const output = executeCommand(game, 'help Smithy');

  expect(output).toContain('Smithy');
  // Verify state unchanged
});
```

**Expected Result**: Help available at any point in game

---

#### Test 1.12: Help Doesn't Interrupt Game Flow
```typescript
test('help command does not interrupt gameplay', () => {
  const game = initTestGame();
  const initialHand = [...game.players[0].hand];

  executeCommand(game, 'help Village');
  executeCommand(game, 'help Copper');
  executeCommand(game, 'help Province');

  expect(game.players[0].hand).toEqual(initialHand);
  expect(game.phase).toBe('action');
  expect(game.turnNumber).toBe(1);
});
```

**Expected Result**: Multiple help commands don't affect game

---

#### Test 1.13: Help After Error Still Works
```typescript
test('help works after encountering unknown card error', () => {
  const game = initTestGame();

  const error = executeCommand(game, 'help FakeCard');
  expect(error).toContain('Unknown card');

  const success = executeCommand(game, 'help Village');
  expect(success).toContain('Village');
  expect(success).toContain('+1 Card, +2 Actions');
});
```

**Expected Result**: Errors don't break subsequent help commands

---

### Performance Tests (1 test)

#### Test 1.14: Lookup Performance
```typescript
test('help command response time < 5ms', () => {
  const iterations = 100;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    handleHelpCommand('Market');
    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b) / times.length;
  const maxTime = Math.max(...times);

  expect(avgTime).toBeLessThan(5);
  expect(maxTime).toBeLessThan(10); // Max allowed spike
});
```

**Expected Result**: Average < 5ms, max < 10ms

---

## Feature 2 Tests: `cards` Command

**Test File**: `packages/cli/tests/cards-command.test.ts`

### Unit Tests (5 tests)

#### Test 2.1: Display All Cards
```typescript
describe('cards command', () => {
  test('displays all 15 cards', () => {
    const output = handleCardsCommand();

    // Check for all kingdom cards
    expect(output).toContain('Village');
    expect(output).toContain('Smithy');
    expect(output).toContain('Laboratory');
    expect(output).toContain('Festival');
    expect(output).toContain('Market');
    expect(output).toContain('Woodcutter');
    expect(output).toContain('Council Room');
    expect(output).toContain('Cellar');

    // Check for all base cards
    expect(output).toContain('Copper');
    expect(output).toContain('Silver');
    expect(output).toContain('Gold');
    expect(output).toContain('Estate');
    expect(output).toContain('Duchy');
    expect(output).toContain('Province');
    expect(output).toContain('Curse');
  });
});
```

**Expected Result**: All 15 cards present in output

---

#### Test 2.2: Table Format Validation
```typescript
test('output is properly formatted table', () => {
  const output = handleCardsCommand();
  const lines = output.split('\n');

  // Check header
  expect(lines[0]).toContain('AVAILABLE CARDS');
  expect(lines[2]).toContain('Name');
  expect(lines[2]).toContain('Cost');
  expect(lines[2]).toContain('Type');
  expect(lines[2]).toContain('Effect');

  // Check separator line
  expect(lines[3]).toMatch(/^-+\|/);

  // Check data rows have pipe separators
  lines.slice(4).forEach(line => {
    if (line.trim()) {
      expect(line).toMatch(/\|/);
    }
  });
});
```

**Expected Result**: Valid table with header, separator, and data rows

---

#### Test 2.3: Correct Sorting Order
```typescript
test('cards are sorted by type then cost', () => {
  const output = handleCardsCommand();
  const lines = output.split('\n').filter(l => l.includes('|') && !l.includes('Name'));

  const cardTypes = lines.map(line => {
    const parts = line.split('|');
    return parts[2].trim(); // Type column
  }).filter(t => t !== '---');

  // Check Actions come first
  const firstAction = cardTypes.findIndex(t => t === 'Action');
  const firstTreasure = cardTypes.findIndex(t => t === 'Treasure');
  const firstVictory = cardTypes.findIndex(t => t === 'Victory');

  expect(firstAction).toBeLessThan(firstTreasure);
  expect(firstTreasure).toBeLessThan(firstVictory);

  // Verify actions are grouped
  const actionTypes = cardTypes.slice(firstAction, firstTreasure);
  actionTypes.forEach(type => expect(type).toBe('Action'));
});
```

**Expected Result**: Actions → Treasures → Victory → Curse

---

#### Test 2.4: Column Alignment
```typescript
test('columns are properly aligned', () => {
  const output = handleCardsCommand();
  const lines = output.split('\n').filter(l => l.includes('|'));

  // All lines should have same number of | separators
  const separatorCounts = lines.map(l => (l.match(/\|/g) || []).length);
  const expectedCount = separatorCounts[0];

  separatorCounts.forEach(count => {
    expect(count).toBe(expectedCount);
  });

  // Check that pipe positions align vertically
  const pipePositions = lines.map(l =>
    [...l].map((c, i) => c === '|' ? i : -1).filter(i => i >= 0)
  );

  // First pipe should be at same position in all rows
  const firstPipePos = pipePositions[0][0];
  pipePositions.forEach(positions => {
    expect(positions[0]).toBe(firstPipePos);
  });
});
```

**Expected Result**: Pipes align vertically across all rows

---

#### Test 2.5: All Descriptions Present
```typescript
test('all cards have effect descriptions', () => {
  const output = handleCardsCommand();
  const lines = output.split('\n').filter(l =>
    l.includes('|') && !l.includes('Name') && !l.includes('---')
  );

  lines.forEach(line => {
    const parts = line.split('|');
    const effect = parts[3]?.trim();

    expect(effect).toBeTruthy();
    expect(effect).not.toBe('');
    expect(effect.length).toBeGreaterThan(5); // Not just empty space
  });
});
```

**Expected Result**: Every card has a non-empty effect description

---

### Integration Tests (3 tests)

#### Test 2.6: Cards Command During Gameplay
```typescript
test('cards command works during active game', () => {
  const game = initTestGame();
  const initialState = JSON.stringify(game);

  const output = executeCommand(game, 'cards');

  expect(output).toContain('Village');
  expect(output).toContain('AVAILABLE CARDS');
  expect(JSON.stringify(game)).toBe(initialState); // State unchanged
});
```

**Expected Result**: Catalog displayed, game state unchanged

---

#### Test 2.7: Cards Command at Game Start
```typescript
test('cards command works before first turn', () => {
  const game = initTestGame();
  expect(game.turnNumber).toBe(1);

  const output = executeCommand(game, 'cards');

  expect(output).toContain('AVAILABLE CARDS');
  expect(output.split('\n').length).toBeGreaterThan(15); // Header + 15 cards
});
```

**Expected Result**: Players can browse cards before playing

---

#### Test 2.8: Cards Command Non-Intrusive
```typescript
test('cards command does not pause or interrupt game', () => {
  const game = initTestGame();
  const initialPhase = game.phase;

  executeCommand(game, 'cards');
  executeCommand(game, 'cards'); // Multiple calls

  expect(game.phase).toBe(initialPhase);
  expect(game.turnNumber).toBe(1);
});
```

**Expected Result**: Command is non-intrusive

---

### Visual/Manual Tests (2 tests)

These require manual verification during development:

#### Test 2.9: Table Readability (Manual)
```
Action: Run `cards` command in actual terminal
Verify:
- [ ] Table fits within 80-character terminal
- [ ] Columns are visually aligned
- [ ] Text is easy to read
- [ ] No line wrapping or overflow
```

#### Test 2.10: Long Effects Formatting (Manual)
```
Action: Check cards with longest effect descriptions
Verify:
- [ ] Council Room effect displays correctly
- [ ] Cellar effect displays correctly
- [ ] No text truncation
- [ ] Effect column doesn't break alignment
```

---

## Feature 3 Tests: Card Data Model

**Test File**: `packages/core/tests/cards.test.ts`

### Unit Tests (3 tests)

#### Test 3.1: Interface Enforcement
```typescript
describe('Card definitions', () => {
  test('CardDefinition interface requires description field', () => {
    // This is a compile-time test
    // If description is missing, TypeScript will error

    const validCard: CardDefinition = {
      name: 'Test Card',
      cost: 3,
      type: CardType.Action,
      description: '+1 Card', // REQUIRED
      effect: (state) => state
    };

    expect(validCard.description).toBeDefined();
  });
});
```

**Expected Result**: TypeScript enforces description field

---

#### Test 3.2: All Cards Have Descriptions
```typescript
test('all cards in ALL_CARDS have non-empty descriptions', () => {
  ALL_CARDS.forEach(card => {
    expect(card.description).toBeDefined();
    expect(card.description).not.toBe('');
    expect(card.description.trim()).not.toBe('');
    expect(card.description.length).toBeGreaterThan(3);
  });
});
```

**Expected Result**: Every card has a meaningful description

---

#### Test 3.3: Description Format Consistency
```typescript
test('card descriptions follow consistent format', () => {
  const actionCards = ALL_CARDS.filter(c => c.type === CardType.Action);
  const treasureCards = ALL_CARDS.filter(c => c.type === CardType.Treasure);
  const victoryCards = ALL_CARDS.filter(c => c.type === CardType.Victory);

  // Treasure cards should contain "coin" or "Worth"
  treasureCards.forEach(card => {
    expect(card.description.toLowerCase()).toMatch(/coin|worth/);
  });

  // Victory cards should contain "VP" or "Victory"
  victoryCards.forEach(card => {
    expect(card.description).toMatch(/VP|Victory/);
  });

  // Action cards should describe effects
  actionCards.forEach(card => {
    expect(card.description.length).toBeGreaterThan(5);
  });
});
```

**Expected Result**: Descriptions follow format conventions

---

### Validation Tests (2 tests)

#### Test 3.4: No Duplicate Card Names
```typescript
test('no duplicate card names in ALL_CARDS', () => {
  const names = ALL_CARDS.map(c => c.name);
  const uniqueNames = new Set(names);

  expect(uniqueNames.size).toBe(names.length);
});
```

**Expected Result**: All card names are unique

---

#### Test 3.5: Description Matches Effect (Manual Review)
```typescript
test('card descriptions accurately describe effects', () => {
  // This is a manual review test
  // For each card, verify description matches actual effect implementation

  const villageCard = ALL_CARDS.find(c => c.name === 'Village');
  expect(villageCard?.description).toContain('+1 Card');
  expect(villageCard?.description).toContain('+2 Actions');

  // If effect gives +1 card and +2 actions, description should match
  // This test serves as a template for manual verification
});
```

**Expected Result**: Descriptions are accurate

---

## Test Coverage Requirements

### Coverage Targets

**Overall Phase 1.6 Coverage**: 95%+ (maintain existing standard)

**Per-Feature Coverage**:
- Feature 1 (`help` command): 100% (simple, must be fully covered)
- Feature 2 (`cards` command): 100% (simple, must be fully covered)
- Feature 3 (data model): 100% (validation only)

### Coverage Report

```bash
npm run test -- --coverage
```

**Expected Output**:
```
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
cards.ts              |  100.00 |   100.00 |  100.00 |  100.00 |
cli/help-command.ts   |  100.00 |   100.00 |  100.00 |  100.00 |
cli/cards-command.ts  |  100.00 |   100.00 |  100.00 |  100.00 |
```

---

## Test Execution Plan

### Development Phase Testing

**Step 1: Feature 3 (Data Model)**
1. Add description field to interface
2. Run `npm test -- cards.test.ts`
3. Verify all tests pass
4. Check coverage: 100%

**Step 2: Feature 1 (Help Command)**
1. Implement help command parser
2. Run unit tests: `npm test -- help-command.test.ts`
3. Fix any failures
4. Run integration tests
5. Check coverage: 100%

**Step 3: Feature 2 (Cards Command)**
1. Implement cards catalog command
2. Run unit tests: `npm test -- cards-command.test.ts`
3. Fix any failures
4. Manual visual testing (table formatting)
5. Check coverage: 100%

**Step 4: Full Suite**
1. Run all tests: `npm test`
2. Verify 95%+ overall coverage maintained
3. Run performance tests
4. Manual acceptance testing

### Continuous Integration

**On Every Commit**:
- Run full test suite
- Generate coverage report
- Fail if coverage < 95%
- Fail if any test fails

---

## Test Data

### Sample Cards for Testing

```typescript
const TEST_CARDS = {
  action: {
    name: 'Village',
    cost: 3,
    type: CardType.Action,
    description: '+1 Card, +2 Actions'
  },
  treasure: {
    name: 'Silver',
    cost: 3,
    type: CardType.Treasure,
    description: 'Worth 2 coins'
  },
  victory: {
    name: 'Estate',
    cost: 2,
    type: CardType.Victory,
    description: 'Worth 1 VP'
  },
  curse: {
    name: 'Curse',
    cost: 0,
    type: CardType.Curse,
    description: 'Worth -1 VP'
  }
};
```

### Edge Case Test Inputs

```typescript
const EDGE_CASES = {
  empty: '',
  whitespace: '   ',
  unknown: 'FakeCard',
  lowercaseValid: 'village',
  uppercaseValid: 'VILLAGE',
  mixedcaseValid: 'ViLLaGe',
  withSpaces: '  Market  ',
  veryLong: 'a'.repeat(1000),
  specialChars: '!@#$%',
  numbers: '12345'
};
```

---

## Test Utilities Reference

```typescript
// Capture CLI output
function captureOutput(fn: () => void): string {
  const originalLog = console.log;
  let output = '';
  console.log = (msg) => { output += msg + '\n'; };
  fn();
  console.log = originalLog;
  return output;
}

// Execute CLI command
function executeCommand(game: GameState, command: string): string {
  return captureOutput(() => {
    processCommand(game, command);
  });
}

// Initialize test game
function initTestGame(): GameState {
  const engine = new GameEngine('test-seed');
  return engine.initializeGame(1);
}

// Validate table format
function isValidTable(output: string): boolean {
  const lines = output.split('\n');
  const hasHeader = lines.some(l => l.includes('Name') && l.includes('Cost'));
  const hasSeparator = lines.some(l => /^-+\|/.test(l));
  const hasData = lines.some(l => l.includes('Village') || l.includes('Copper'));
  return hasHeader && hasSeparator && hasData;
}
```

---

## Acceptance Criteria Summary

Phase 1.6 testing is complete when:

- [ ] All 29 test cases pass
- [ ] Test coverage ≥ 95% overall
- [ ] Feature 1, 2, 3 coverage = 100%
- [ ] Performance tests show < 5ms lookup time
- [ ] No regressions in existing Phase 1/1.5 tests
- [ ] Manual visual tests pass (table formatting)
- [ ] CI pipeline passes all checks

---

## Conclusion

Phase 1.6 testing specifications ensure comprehensive validation of the card help lookup system. With 29 automated tests and manual verification checklist, we maintain the high quality standards established in previous phases while adding essential MVP functionality.

**Next Steps**: Proceed to [UX_GUIDE.md](./UX_GUIDE.md) for user experience specifications.
