# Phase 4.2 Testing Specification: MCP Interactive Card Decisions

**Status**: DRAFT
**Created**: 2025-11-05
**Last-Updated**: 2025-11-05
**Owner**: requirements-architect
**Phase**: 4.2

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Coverage Requirements](#test-coverage-requirements)
3. [Unit Tests - Shared Presentation Layer](#unit-tests---shared-presentation-layer)
4. [Integration Tests - CLI](#integration-tests---cli)
5. [Integration Tests - MCP](#integration-tests---mcp)
6. [End-to-End Tests](#end-to-end-tests)
7. [Performance Tests](#performance-tests)
8. [Regression Tests](#regression-tests)
9. [Test Data and Fixtures](#test-data-and-fixtures)

---

## Testing Philosophy

### TDD Mandate

**All code changes follow Test-Driven Development (TDD)**:
1. Write tests FIRST (before implementation)
2. Tests define the contract (what "done" means)
3. All tests FAIL initially (red phase)
4. Implementation makes tests PASS (green phase)
5. Refactor if needed (tests still pass)

### Three-Level Testing (Per Requirements Document)

All requirements MUST have tests at ALL three levels:

**Level 1: Unit Tests** (isolated functions)
- Test each generator function in isolation
- Test helper functions
- Test data structure creation

**Level 2: Integration Tests** (components working together)
- Test CLI using shared layer
- Test MCP using shared layer
- Test game engine with pending effects

**Level 3: End-to-End Tests** (complete workflows)
- Test full card workflow via CLI
- Test full card workflow via MCP
- Test multi-step and iterative cards

### Coverage Requirements

- **Unit test coverage**: ≥ 95%
- **Integration test coverage**: ≥ 95%
- **E2E test coverage**: All 11 interactive cards
- **Edge case coverage**: All documented edge cases

---

## Test Coverage Requirements

### Traceability Matrix

Every functional requirement from FEATURES.md must map to specific tests:

| Requirement ID | Test Level | Test IDs |
|----------------|------------|----------|
| FR-SHARED-1 | Unit | UT-SHARED-1, UT-SHARED-2 |
| FR-SHARED-2 | Unit | UT-CELLAR-1 through UT-BUREAUCRAT-1 |
| FR-SHARED-3 | Unit | UT-DISPATCH-1, UT-DISPATCH-2 |
| FR-SHARED-4 | Unit | UT-DET-1, UT-DET-2 |
| FR-SHARED-5 | Unit | UT-COV-1 |
| FR-MCP-1 | Integration | IT-MCP-DETECT-1, IT-MCP-DETECT-2 |
| FR-MCP-2 | Integration | IT-MCP-RESPONSE-1 through IT-MCP-RESPONSE-11 |
| FR-MCP-3 | Integration | IT-MCP-CMD-1 |
| FR-MCP-4 | Integration | IT-MCP-SELECT-1, IT-MCP-SELECT-2 |
| FR-MCP-5 | Integration | IT-MCP-MULTI-1, IT-MCP-MULTI-2 |
| FR-MCP-6 | Integration | IT-MCP-ITER-1 through IT-MCP-ITER-3 |
| FR-MCP-7 | Integration | IT-MCP-ERROR-1 through IT-MCP-ERROR-5 |
| FR-MCP-8 | Integration | IT-MCP-LIMIT-1 |
| FR-CLI-1 | Integration | IT-CLI-SHARED-1 |
| FR-CLI-2 | Integration | IT-CLI-REGRESS-1 (all Phase 4.1 tests) |
| FR-CLI-3 | Integration | IT-CLI-CONSISTENT-1 |

### Test Completion Criteria

Phase 4.2 testing is **COMPLETE** when:
- [ ] All unit tests written and passing (≥ 95% coverage)
- [ ] All integration tests written and passing (≥ 95% coverage)
- [ ] All E2E tests written and passing (11 cards)
- [ ] All edge case tests written and passing
- [ ] All performance tests passing (< 50ms targets)
- [ ] All Phase 4.1 regression tests passing (100%)
- [ ] Test documentation complete

---

## Unit Tests - Shared Presentation Layer

### File: `packages/core/tests/presentation/move-options.test.ts`

### Helper Function Tests

#### UT-HELPER-1: getCombinations - Empty Array
```typescript
describe('getCombinations', () => {
  it('should return empty combination for empty array', () => {
    const result = getCombinations([], 5);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([]);
  });
});
```

#### UT-HELPER-2: getCombinations - Single Element
```typescript
it('should return 2 combinations for single element array', () => {
  const result = getCombinations(['A'], 5);

  expect(result).toHaveLength(2);
  expect(result).toContainEqual([]);
  expect(result).toContainEqual(['A']);
});
```

#### UT-HELPER-3: getCombinations - Multiple Elements
```typescript
it('should return 8 combinations for 3-element array', () => {
  const result = getCombinations(['A', 'B', 'C'], 3);

  // 2^3 = 8 combinations
  expect(result).toHaveLength(8);
  expect(result).toContainEqual([]);
  expect(result).toContainEqual(['A']);
  expect(result).toContainEqual(['B']);
  expect(result).toContainEqual(['C']);
  expect(result).toContainEqual(['A', 'B']);
  expect(result).toContainEqual(['A', 'C']);
  expect(result).toContainEqual(['B', 'C']);
  expect(result).toContainEqual(['A', 'B', 'C']);
});
```

#### UT-HELPER-4: getCombinations - MaxSize Limit
```typescript
it('should respect maxSize limit', () => {
  const result = getCombinations(['A', 'B', 'C', 'D'], 2);

  // Should only return combinations with ≤ 2 elements
  expect(result.every(combo => combo.length <= 2)).toBe(true);
  expect(result).not.toContainEqual(['A', 'B', 'C']);
  expect(result).not.toContainEqual(['A', 'B', 'C', 'D']);
});
```

#### UT-HELPER-5: formatMoveCommand - All Move Types
```typescript
describe('formatMoveCommand', () => {
  it('should format discard_for_cellar move', () => {
    const move: Move = { type: 'discard_for_cellar', cards: ['Copper', 'Copper'] };
    const command = formatMoveCommand(move);

    expect(command).toBe('discard_for_cellar Copper,Copper');
  });

  it('should format discard_for_cellar with no cards', () => {
    const move: Move = { type: 'discard_for_cellar', cards: [] };
    const command = formatMoveCommand(move);

    expect(command).toBe('discard_for_cellar');
  });

  it('should format trash_cards move', () => {
    const move: Move = { type: 'trash_cards', cards: ['Copper', 'Estate'] };
    const command = formatMoveCommand(move);

    expect(command).toBe('trash_cards Copper,Estate');
  });

  it('should format gain_card move', () => {
    const move: Move = { type: 'gain_card', card: 'Smithy' };
    const command = formatMoveCommand(move);

    expect(command).toBe('gain_card Smithy');
  });

  // ... (test all move types)
});
```

### Cellar Tests

#### UT-CELLAR-1: Normal 3-Card Hand
```typescript
describe('generateCellarOptions', () => {
  it('should generate all combinations for 3-card hand', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
    const options = generateCellarOptions(hand);

    // 2^3 = 8 combinations
    expect(options).toHaveLength(8);

    // Verify structure of each option
    options.forEach(opt => {
      expect(opt.index).toBeGreaterThan(0);
      expect(opt.move.type).toBe('discard_for_cellar');
      expect(opt.description).toBeTruthy();
      expect(opt.details?.drawCount).toBeDefined();
    });

    // Verify first option is most discard (all 3)
    expect(options[0].move.cards).toHaveLength(3);
    expect(options[0].details.drawCount).toBe(3);

    // Verify last option is no discard
    expect(options[7].move.cards).toHaveLength(0);
    expect(options[7].details.drawCount).toBe(0);
  });
});
```

#### UT-CELLAR-2: Empty Hand
```typescript
it('should handle empty hand gracefully', () => {
  const hand: CardName[] = [];
  const options = generateCellarOptions(hand);

  expect(options).toHaveLength(1);
  expect(options[0].move.cards).toEqual([]);
  expect(options[0].description).toContain('nothing');
});
```

#### UT-CELLAR-3: Single Card Hand
```typescript
it('should generate 2 options for single card', () => {
  const hand: CardName[] = ['Copper'];
  const options = generateCellarOptions(hand);

  expect(options).toHaveLength(2);
  expect(options[0].move.cards).toEqual(['Copper']);
  expect(options[1].move.cards).toEqual([]);
});
```

#### UT-CELLAR-4: Sorting by Card Count
```typescript
it('should sort options by card count descending', () => {
  const hand: CardName[] = ['Copper', 'Estate'];
  const options = generateCellarOptions(hand);

  // Check descending order
  for (let i = 0; i < options.length - 1; i++) {
    const currentCount = options[i].move.cards?.length || 0;
    const nextCount = options[i + 1].move.cards?.length || 0;
    expect(currentCount).toBeGreaterThanOrEqual(nextCount);
  }
});
```

#### UT-CELLAR-5: Index Sequential from 1
```typescript
it('should have sequential indices starting from 1', () => {
  const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
  const options = generateCellarOptions(hand);

  options.forEach((opt, idx) => {
    expect(opt.index).toBe(idx + 1);
  });
});
```

### Chapel Tests

#### UT-CHAPEL-1: Normal Hand with MaxTrash 4
```typescript
describe('generateChapelOptions', () => {
  it('should generate combinations up to maxTrash limit', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate', 'Curse', 'Silver'];
    const options = generateChapelOptions(hand, 4);

    // Should not include combinations with > 4 cards
    expect(options.every(opt => (opt.move.cards?.length || 0) <= 4)).toBe(true);

    // Should include "trash nothing" option
    expect(options.some(opt => (opt.move.cards?.length || 0) === 0)).toBe(true);
  });
});
```

#### UT-CHAPEL-2: Hand Smaller Than MaxTrash
```typescript
it('should generate all combinations when hand < maxTrash', () => {
  const hand: CardName[] = ['Copper', 'Estate'];
  const options = generateChapelOptions(hand, 4);

  // 2^2 = 4 combinations (hand only has 2 cards)
  expect(options).toHaveLength(4);
});
```

#### UT-CHAPEL-3: Empty Hand
```typescript
it('should handle empty hand', () => {
  const hand: CardName[] = [];
  const options = generateChapelOptions(hand, 4);

  expect(options).toHaveLength(1);
  expect(options[0].description).toContain('nothing');
});
```

### Remodel Tests

#### UT-REMODEL-1: Step 1 - Normal Hand
```typescript
describe('generateRemodelStep1Options', () => {
  it('should generate trash options for each card in hand', () => {
    const hand: CardName[] = ['Estate', 'Copper', 'Silver'];
    const options = generateRemodelStep1Options(hand);

    expect(options).toHaveLength(3);

    // Verify each card has correct gain cost calculation
    const estateOption = options.find(opt => opt.cardNames?.[0] === 'Estate');
    expect(estateOption?.details.trashCost).toBe(2);
    expect(estateOption?.details.maxGainCost).toBe(4); // 2 + 2

    const copperOption = options.find(opt => opt.cardNames?.[0] === 'Copper');
    expect(copperOption?.details.trashCost).toBe(0);
    expect(copperOption?.details.maxGainCost).toBe(2); // 0 + 2
  });
});
```

#### UT-REMODEL-2: Step 1 - Empty Hand
```typescript
it('should handle empty hand gracefully', () => {
  const hand: CardName[] = [];
  const options = generateRemodelStep1Options(hand);

  expect(options).toHaveLength(1);
  expect(options[0].description).toContain('No cards');
});
```

#### UT-REMODEL-3: Step 2 - Normal Supply
```typescript
describe('generateRemodelStep2Options', () => {
  it('should generate gain options up to maxCost', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 46],
      ['Silver', 40],
      ['Village', 10],
      ['Smithy', 10],
      ['Gold', 30],
      ['Province', 12]
    ]);
    const options = generateRemodelStep2Options(4, supply);

    // Should include Smithy ($4), Village ($3), Silver ($3), Copper ($0)
    // Should NOT include Gold ($6), Province ($8)
    expect(options.every(opt => {
      const cardCost = getCard(opt.cardNames![0]).cost;
      return cardCost <= 4;
    })).toBe(true);

    expect(options.some(opt => opt.cardNames?.[0] === 'Smithy')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Gold')).toBe(false);
  });
});
```

#### UT-REMODEL-4: Step 2 - Empty Supply
```typescript
it('should handle empty supply gracefully', () => {
  const supply = new Map<CardName, number>();
  const options = generateRemodelStep2Options(4, supply);

  expect(options).toHaveLength(1);
  expect(options[0].description).toContain('No cards available');
});
```

#### UT-REMODEL-5: Step 2 - Sort by Cost Descending
```typescript
it('should sort options by cost descending', () => {
  const supply = new Map<CardName, number>([
    ['Copper', 46],      // $0
    ['Silver', 40],      // $3
    ['Smithy', 10]       // $4
  ]);
  const options = generateRemodelStep2Options(4, supply);

  // Check descending cost order
  for (let i = 0; i < options.length - 1; i++) {
    const currentCost = getCard(options[i].cardNames![0]).cost;
    const nextCost = getCard(options[i + 1].cardNames![0]).cost;
    expect(currentCost).toBeGreaterThanOrEqual(nextCost);
  }
});
```

### Mine Tests

#### UT-MINE-1: Step 1 - Hand with Treasures
```typescript
describe('generateMineStep1Options', () => {
  it('should generate options only for treasures', () => {
    const hand: CardName[] = ['Copper', 'Silver', 'Estate', 'Village'];
    const options = generateMineStep1Options(hand);

    expect(options).toHaveLength(2); // Only Copper and Silver
    expect(options.every(opt => isTreasureCard(opt.cardNames![0]))).toBe(true);
  });
});
```

#### UT-MINE-2: Step 1 - No Treasures
```typescript
it('should handle no treasures gracefully', () => {
  const hand: CardName[] = ['Estate', 'Village'];
  const options = generateMineStep1Options(hand);

  expect(options).toHaveLength(1);
  expect(options[0].description).toContain('No treasures');
});
```

#### UT-MINE-3: Step 2 - Only Treasures Available
```typescript
describe('generateMineStep2Options', () => {
  it('should only include treasures', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 46],
      ['Silver', 40],
      ['Gold', 30],
      ['Village', 10] // Not a treasure
    ]);
    const options = generateMineStep2Options(6, supply);

    // Should include Copper, Silver, Gold
    // Should NOT include Village
    expect(options.every(opt => isTreasureCard(opt.cardNames![0]))).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Village')).toBe(false);
  });
});
```

### Workshop Tests

#### UT-WORKSHOP-1: Normal Supply
```typescript
describe('generateWorkshopOptions', () => {
  it('should generate options for cards up to $4', () => {
    const supply = new Map<CardName, number>([
      ['Copper', 46],     // $0
      ['Estate', 8],      // $2
      ['Silver', 40],     // $3
      ['Smithy', 10],     // $4
      ['Laboratory', 10], // $5
      ['Gold', 30]        // $6
    ]);
    const options = generateWorkshopOptions(supply, 4);

    expect(options.some(opt => opt.cardNames?.[0] === 'Smithy')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Laboratory')).toBe(false);
  });
});
```

### Feast Tests

#### UT-FEAST-1: Normal Supply
```typescript
describe('generateFeastOptions', () => {
  it('should generate options for cards up to $5', () => {
    const supply = new Map<CardName, number>([
      ['Smithy', 10],     // $4
      ['Laboratory', 10], // $5
      ['Gold', 30]        // $6
    ]);
    const options = generateFeastOptions(supply, 5);

    expect(options.some(opt => opt.cardNames?.[0] === 'Laboratory')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Gold')).toBe(false);
  });
});
```

### Library Tests

#### UT-LIBRARY-1: Binary Choice
```typescript
describe('generateLibraryOptions', () => {
  it('should generate 2 options for action card', () => {
    const options = generateLibraryOptions('Village');

    expect(options).toHaveLength(2);
    expect(options[0].details.action).toBe('set_aside');
    expect(options[1].details.action).toBe('keep');
  });
});
```

### Throne Room Tests

#### UT-THRONE-1: Hand with Actions
```typescript
describe('generateThroneRoomOptions', () => {
  it('should generate options for action cards + skip', () => {
    const hand: CardName[] = ['Village', 'Smithy', 'Copper', 'Estate'];
    const options = generateThroneRoomOptions(hand);

    // Should have Village, Smithy, and Skip options
    expect(options).toHaveLength(3);
    expect(options.some(opt => opt.cardNames?.[0] === 'Village')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Smithy')).toBe(true);
    expect(options.some(opt => opt.details.action === 'skip')).toBe(true);
  });
});
```

#### UT-THRONE-2: No Actions in Hand
```typescript
it('should handle no actions gracefully', () => {
  const hand: CardName[] = ['Copper', 'Estate'];
  const options = generateThroneRoomOptions(hand);

  expect(options).toHaveLength(1);
  expect(options[0].description).toContain('no action');
});
```

### Chancellor Tests

#### UT-CHANCELLOR-1: Binary Choice
```typescript
describe('generateChancellorOptions', () => {
  it('should generate 2 options for deck decision', () => {
    const options = generateChancellorOptions(5);

    expect(options).toHaveLength(2);
    expect(options[0].details.action).toBe('move_to_discard');
    expect(options[1].details.action).toBe('keep_deck');
  });
});
```

### Spy Tests

#### UT-SPY-1: Binary Choice per Player
```typescript
describe('generateSpyOptions', () => {
  it('should generate 2 options for revealed card', () => {
    const options = generateSpyOptions('Copper', 1);

    expect(options).toHaveLength(2);
    expect(options[0].details.action).toBe('discard');
    expect(options[1].details.action).toBe('keep');
    expect(options[0].details.player).toBe(1);
  });
});
```

### Bureaucrat Tests

#### UT-BUREAUCRAT-1: Victory Cards in Hand
```typescript
describe('generateBureaucratOptions', () => {
  it('should generate options for victory cards', () => {
    const hand: CardName[] = ['Estate', 'Duchy', 'Copper'];
    const options = generateBureaucratOptions(hand);

    // Should have Estate, Duchy options
    expect(options).toHaveLength(2);
    expect(options.some(opt => opt.cardNames?.[0] === 'Estate')).toBe(true);
    expect(options.some(opt => opt.cardNames?.[0] === 'Duchy')).toBe(true);
  });
});
```

#### UT-BUREAUCRAT-2: No Victory Cards
```typescript
it('should handle no victory cards gracefully', () => {
  const hand: CardName[] = ['Copper', 'Village'];
  const options = generateBureaucratOptions(hand);

  expect(options).toHaveLength(1);
  expect(options[0].description).toContain('Reveal hand');
});
```

### Main Dispatcher Tests

#### UT-DISPATCH-1: Routes to Correct Generator
```typescript
describe('generateMoveOptions', () => {
  it('should route to correct generator for each effect type', () => {
    const cellarState = createStateWithPendingEffect('Cellar', 'discard_for_cellar');
    const cellarOptions = generateMoveOptions(cellarState, []);
    expect(cellarOptions.length).toBeGreaterThan(0);

    const chapelState = createStateWithPendingEffect('Chapel', 'trash_cards');
    const chapelOptions = generateMoveOptions(chapelState, []);
    expect(chapelOptions.length).toBeGreaterThan(0);

    // ... (test all 11 cards)
  });
});
```

#### UT-DISPATCH-2: Handles No Pending Effect
```typescript
it('should return empty array when no pendingEffect', () => {
  const state = createStateWithoutPendingEffect();
  const options = generateMoveOptions(state, []);

  expect(options).toEqual([]);
});
```

---

## Integration Tests - CLI

### File: `packages/cli/tests/display-pending-effect.test.ts`

#### IT-CLI-SHARED-1: Uses Shared Layer
```typescript
describe('CLI displayPendingEffectPrompt', () => {
  it('should call generateMoveOptions from shared layer', () => {
    const spy = jest.spyOn(moveOptions, 'generateMoveOptions');

    const state = createStateWithCellarPending();
    const validMoves = engine.getValidMoves(state);

    display.displayPendingEffectPrompt(state, validMoves);

    expect(spy).toHaveBeenCalledWith(state, validMoves);
  });
});
```

#### IT-CLI-CONSISTENT-1: Consistent Numbering
```typescript
it('should display same option numbers as shared layer', () => {
  const state = createStateWithCellarPending();
  const validMoves = engine.getValidMoves(state);

  const sharedOptions = generateMoveOptions(state, validMoves);

  // Capture CLI output
  const consoleSpy = jest.spyOn(console, 'log');
  display.displayPendingEffectPrompt(state, validMoves);

  // Verify CLI displays same indices
  sharedOptions.forEach(opt => {
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`[${opt.index}]`)
    );
  });
});
```

#### IT-CLI-REGRESS-1: All Phase 4.1 Tests Pass
```typescript
describe('Phase 4.1 Regression', () => {
  // Import all Phase 4.1 Feature 2 CLI tests
  // Run them against Phase 4.2 code
  // Verify 100% pass rate

  it('should pass all Phase 4.1 Cellar tests', () => {
    // ... (existing Phase 4.1 tests)
  });

  it('should pass all Phase 4.1 Chapel tests', () => {
    // ... (existing Phase 4.1 tests)
  });

  // ... (all 11 cards)
});
```

---

## Integration Tests - MCP

### File: `packages/mcp-server/tests/tools/game-execute-pending-effect.test.ts`

#### IT-MCP-DETECT-1: Detects Pending Effect
```typescript
describe('MCP game_execute - Pending Effect Detection', () => {
  it('should detect pendingEffect after Cellar is played', async () => {
    const server = createTestServer();
    const state = createStateWithCellarInHand();
    server.setState(state);

    const response = await server.execute({ move: 'play_action Cellar' });

    expect(response.success).toBe(true);
    expect(response.pendingEffect).toBeDefined();
    expect(response.pendingEffect.card).toBe('Cellar');
  });
});
```

#### IT-MCP-DETECT-2: No Pending Effect for Normal Moves
```typescript
it('should NOT include pendingEffect for normal moves', async () => {
  const server = createTestServer();
  const state = createNormalActionPhase();
  server.setState(state);

  const response = await server.execute({ move: 'play_action Village' });

  expect(response.success).toBe(true);
  expect(response.pendingEffect).toBeUndefined();
});
```

#### IT-MCP-RESPONSE-1: Cellar Structured Response
```typescript
describe('MCP Structured Responses', () => {
  it('should return structured options for Cellar', async () => {
    const server = createTestServer();
    const state = createStateWithCellarInHand();
    server.setState(state);

    const response = await server.execute({ move: 'play_action Cellar' });

    expect(response.pendingEffect).toMatchObject({
      card: 'Cellar',
      effect: 'discard_for_cellar',
      step: null,
      options: expect.arrayContaining([
        expect.objectContaining({
          index: expect.any(Number),
          description: expect.any(String),
          command: expect.any(String)
        })
      ])
    });
  });
});
```

#### IT-MCP-RESPONSE-2 through IT-MCP-RESPONSE-11: All Cards
```typescript
// Similar tests for:
// - Chapel
// - Remodel (with step numbers)
// - Mine (with step numbers)
// - Workshop
// - Feast
// - Library
// - Throne Room
// - Chancellor
// - Spy
// - Bureaucrat
```

#### IT-MCP-CMD-1: Move Command Execution
```typescript
describe('MCP Move Command Execution', () => {
  it('should execute move command successfully', async () => {
    const server = createTestServer();

    // Step 1: Play Cellar
    const response1 = await server.execute({ move: 'play_action Cellar' });
    const command = response1.pendingEffect.options[0].command;

    // Step 2: Execute command
    const response2 = await server.execute({ move: command });

    expect(response2.success).toBe(true);
    expect(response2.pendingEffect).toBeUndefined(); // Cleared
  });
});
```

#### IT-MCP-SELECT-1: Numeric Selection Valid
```typescript
describe('MCP Numeric Selection', () => {
  it('should accept numeric selection', async () => {
    const server = createTestServer();

    // Play Cellar
    const response1 = await server.execute({ move: 'play_action Cellar' });

    // Select option 2
    const response2 = await server.execute({ move: 'select 2' });

    expect(response2.success).toBe(true);
  });
});
```

#### IT-MCP-SELECT-2: Numeric Selection Out of Range
```typescript
it('should reject out-of-range selection', async () => {
  const server = createTestServer();

  // Play Cellar (3 options)
  await server.execute({ move: 'play_action Cellar' });

  // Select invalid option
  const response = await server.execute({ move: 'select 99' });

  expect(response.success).toBe(false);
  expect(response.error.message).toContain('Invalid selection');
});
```

#### IT-MCP-MULTI-1: Remodel 2-Step Workflow
```typescript
describe('MCP Multi-Step Cards', () => {
  it('should complete Remodel 2-step process', async () => {
    const server = createTestServer();
    const state = createStateWithRemodelInHand();
    server.setState(state);

    // Step 1: Play Remodel
    const step1 = await server.execute({ move: 'play_action Remodel' });
    expect(step1.pendingEffect.step).toBe(1);

    // Step 2: Trash card
    const trashCmd = step1.pendingEffect.options[0].command;
    const step2 = await server.execute({ move: trashCmd });
    expect(step2.pendingEffect.step).toBe(2);

    // Step 3: Gain card
    const gainCmd = step2.pendingEffect.options[0].command;
    const final = await server.execute({ move: gainCmd });
    expect(final.success).toBe(true);
    expect(final.pendingEffect).toBeUndefined();
  });
});
```

#### IT-MCP-MULTI-2: Mine 2-Step Workflow
```typescript
it('should complete Mine 2-step process', async () => {
  // Similar to Remodel test
});
```

#### IT-MCP-ITER-1: Library Iterative Workflow
```typescript
describe('MCP Iterative Cards', () => {
  it('should handle Library iterative choices', async () => {
    const server = createTestServer();
    const state = createStateWithLibraryAndActionCards();
    server.setState(state);

    // Play Library
    await server.execute({ move: 'play_action Library' });

    // Should prompt for first action card
    let iteration = 1;
    while (state.pendingEffect) {
      const response = await server.execute({ move: 'select 1' }); // Set aside
      if (response.pendingEffect) {
        iteration++;
      } else {
        break;
      }
    }

    expect(iteration).toBeGreaterThan(0);
  });
});
```

#### IT-MCP-ITER-2: Spy Iterative Workflow
```typescript
it('should handle Spy iterative choices (multiple players)', async () => {
  // Test Spy with 2 players
  // Verify prompts for each player's revealed card
});
```

#### IT-MCP-ITER-3: Bureaucrat Iterative Workflow
```typescript
it('should handle Bureaucrat iterative choices (multiple players)', async () => {
  // Test Bureaucrat with 2 players
  // Verify prompts for each opponent
});
```

#### IT-MCP-ERROR-1 through IT-MCP-ERROR-5: Error Handling
```typescript
describe('MCP Error Handling', () => {
  it('should handle invalid move during pending effect', async () => {
    // ...
  });

  it('should handle wrong pending effect type', async () => {
    // ...
  });

  it('should preserve state on error', async () => {
    // ...
  });

  it('should provide helpful error messages', async () => {
    // ...
  });

  it('should handle empty supply gracefully', async () => {
    // ...
  });
});
```

#### IT-MCP-LIMIT-1: Option Limit Handling
```typescript
describe('MCP Option Limits', () => {
  it('should limit displayed options to 50', async () => {
    const server = createTestServer();
    const state = createStateWithLargeHand(10); // Would generate >50 combos
    server.setState(state);

    const response = await server.execute({ move: 'play_action Cellar' });

    expect(response.pendingEffect.options.length).toBeLessThanOrEqual(50);
    expect(response.message).toContain('Showing first 50');
  });
});
```

---

## End-to-End Tests

### File: `packages/mcp-server/tests/e2e/interactive-cards.e2e.test.ts`

#### E2E-MCP-CELLAR-1: Complete Cellar Workflow
```typescript
describe('E2E: Interactive Cards via MCP', () => {
  it('should complete full Cellar workflow', async () => {
    const server = new MCPGameServer();
    await server.start();

    // Start game
    await server.call('game_session', { command: 'new', seed: 'e2e-cellar' });

    // Play turns until Cellar can be played
    // ... (setup moves)

    // Play Cellar
    const cellarResponse = await server.call('game_execute', { move: 'play_action Cellar' });
    expect(cellarResponse.pendingEffect).toBeDefined();

    // Choose discard option
    const discardCmd = cellarResponse.pendingEffect.options[1].command;
    const finalResponse = await server.call('game_execute', { move: discardCmd });
    expect(finalResponse.success).toBe(true);
    expect(finalResponse.pendingEffect).toBeUndefined();

    await server.stop();
  });
});
```

#### E2E-MCP-CHAPEL-1 through E2E-MCP-BUREAUCRAT-1: All Cards
```typescript
// Similar E2E tests for:
// - Chapel
// - Remodel (2-step)
// - Mine (2-step)
// - Workshop
// - Feast
// - Library (iterative)
// - Throne Room
// - Chancellor
// - Spy (iterative, 2-player)
// - Bureaucrat (iterative, 2-player)
```

---

## Performance Tests

### File: `packages/core/tests/performance/move-options.perf.test.ts`

#### PERF-1: Cellar Generation Performance
```typescript
describe('Performance: Move Option Generation', () => {
  it('should generate Cellar options in < 50ms (5-card hand)', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate', 'Silver', 'Gold'];

    const startTime = performance.now();
    const options = generateCellarOptions(hand);
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(50);
    expect(options.length).toBe(32); // 2^5
  });
});
```

#### PERF-2: Remodel Step 2 Performance
```typescript
it('should generate Remodel Step 2 options in < 10ms', () => {
  const supply = createLargeSupply(30); // 30 cards

  const startTime = performance.now();
  const options = generateRemodelStep2Options(5, supply);
  const endTime = performance.now();

  const duration = endTime - startTime;
  expect(duration).toBeLessThan(10);
});
```

#### PERF-3: MCP Response Time
```typescript
it('should generate full MCP response in < 100ms', async () => {
  const server = createTestServer();
  const state = createStateWithCellarInHand();
  server.setState(state);

  const startTime = performance.now();
  const response = await server.execute({ move: 'play_action Cellar' });
  const endTime = performance.now();

  const duration = endTime - startTime;
  expect(duration).toBeLessThan(100);
});
```

---

## Regression Tests

### File: `packages/cli/tests/regression/phase-4.1-regression.test.ts`

#### REGRESS-1: All Phase 4.1 Feature 2 Tests Pass
```typescript
describe('Phase 4.1 Feature 2 Regression', () => {
  // Import and run ALL Phase 4.1 Feature 2 tests
  // Verify 100% pass rate with Phase 4.2 code

  it('should pass all Cellar CLI tests', () => {
    // ... (Phase 4.1 tests)
  });

  it('should pass all Chapel CLI tests', () => {
    // ... (Phase 4.1 tests)
  });

  // ... (all 11 cards)
});
```

---

## Test Data and Fixtures

### Test State Builders

```typescript
// packages/core/tests/fixtures/game-states.ts

export function createStateWithCellarPending(): GameState {
  return {
    // ... game state with Cellar played and pendingEffect set
  };
}

export function createStateWithCellarInHand(): GameState {
  return {
    // ... game state with Cellar in player 1's hand
  };
}

export function createStateWithRemodelInHand(): GameState {
  return {
    // ... game state with Remodel in player 1's hand
  };
}

// ... (fixtures for all 11 cards)
```

### Assertion Helpers

```typescript
// packages/core/tests/helpers/assertions.ts

export function expectValidMoveOption(opt: MoveOption): void {
  expect(opt.index).toBeGreaterThan(0);
  expect(opt.move).toBeDefined();
  expect(opt.description).toBeTruthy();
}

export function expectValidMCPResponse(response: GameExecuteResponse): void {
  expect(response.success).toBe(true);
  expect(response.gameState).toBeDefined();
  expect(response.validMoves).toBeDefined();
}

export function expectPendingEffectResponse(
  response: GameExecuteResponse,
  card: CardName,
  optionCount?: number
): void {
  expect(response.pendingEffect).toBeDefined();
  expect(response.pendingEffect.card).toBe(card);
  if (optionCount) {
    expect(response.pendingEffect.options).toHaveLength(optionCount);
  }
}
```

---

## Test Execution Order

**Recommended Test Execution Order**:

1. **Unit Tests** (run first, fastest feedback)
   - Helper functions
   - Individual card generators
   - Main dispatcher

2. **Integration Tests - Shared Layer** (verify shared logic works)
   - CLI integration
   - MCP integration

3. **Integration Tests - Full Workflows** (verify end-to-end flows)
   - Multi-step cards
   - Iterative cards

4. **End-to-End Tests** (comprehensive system tests)
   - All 11 cards via MCP
   - All 11 cards via CLI

5. **Performance Tests** (verify non-functional requirements)
   - Generation speed
   - Response time

6. **Regression Tests** (verify no breaking changes)
   - Phase 4.1 tests
   - Phase 1-4 tests

---

## Test Coverage Report

**Target Coverage**:
- **Unit Tests**: ≥ 95%
- **Integration Tests**: ≥ 95%
- **E2E Tests**: 11/11 cards (100%)
- **Edge Cases**: 100% documented cases

**Coverage Measurement**:
```bash
npm run test -- --coverage
npm run test:unit -- --coverage
npm run test:integration -- --coverage
npm run test:e2e -- --coverage
```

**Coverage Report Format**:
```
File                                  | Stmts | Branch | Funcs | Lines |
--------------------------------------|-------|--------|-------|-------|
presentation/move-options.ts          | 97.5% | 95.2%  | 100%  | 97.8% |
cli/src/display.ts                    | 96.1% | 94.3%  | 100%  | 96.5% |
mcp-server/src/tools/game-execute.ts  | 95.8% | 93.7%  | 100%  | 96.2% |
--------------------------------------|-------|--------|-------|-------|
TOTAL                                 | 96.5% | 94.4%  | 100%  | 96.8% |
```

---

**Document Status**: DRAFT - Ready for test-architect to write tests

**Next Steps**:
1. Review and approve testing specifications
2. test-architect implements all tests (TDD: tests first!)
3. All tests initially FAIL (red phase)
4. dev-agent implements code to make tests PASS (green phase)
5. Refactor if needed (tests still pass)
6. Verify ≥ 95% coverage achieved
