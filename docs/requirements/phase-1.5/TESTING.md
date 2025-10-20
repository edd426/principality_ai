# CLI Phase 2 Test Specification

**Status**: COMPLETE ✅
**Created**: 2025-10-05
**Last Updated**: 2025-10-20 (marked complete - all tests implemented and passing)
**Phase**: 1.5
**Purpose**: Test requirements for CLI UX improvements

---

## Test Strategy

### Coverage Targets

- **Unit Tests**: 95%+ coverage of new parser/display logic
- **Integration Tests**: 100% coverage of feature interactions
- **Performance Tests**: All operations < 100ms
- **Regression Tests**: Existing CLI functionality unchanged

### Test Pyramid

```
         /\
        /  \  E2E Tests (5%)
       /    \  - Full game scenarios
      /------\
     /        \ Integration Tests (25%)
    /          \ - Feature combinations
   /------------\
  /              \ Unit Tests (70%)
 /________________\ - Individual functions
```

---

## Feature 1: Auto-Play All Treasures

### Unit Tests

#### Test Suite: `auto-play-treasures.test.ts`

**UT-1.1: Auto-play with multiple treasures**
```typescript
test('should auto-play all treasures when entering buy phase', () => {
  // Arrange
  const hand = ['Copper', 'Copper', 'Silver', 'Estate'];
  const gameState = createGameStateWithHand(hand, 'action');

  // Act
  const result = cli.transitionToBuyPhase(gameState);

  // Assert
  expect(result.coinsPlayed).toBe(4); // 1 + 1 + 2
  expect(result.treasuresPlayed).toEqual(['Copper', 'Copper', 'Silver']);
  expect(result.handRemaining).toEqual(['Estate']);
});
```

**UT-1.2: Auto-play with zero treasures**
```typescript
test('should handle zero treasures gracefully', () => {
  // Arrange
  const hand = ['Estate', 'Estate', 'Village'];
  const gameState = createGameStateWithHand(hand, 'action');

  // Act
  const result = cli.transitionToBuyPhase(gameState);

  // Assert
  expect(result.coinsPlayed).toBe(0);
  expect(result.treasuresPlayed).toEqual([]);
  expect(result.message).toContain('No treasures to play');
});
```

**UT-1.3: Auto-play display format**
```typescript
test('should display auto-play summary correctly', () => {
  // Arrange
  const treasures = ['Copper', 'Silver', 'Gold'];

  // Act
  const display = formatAutoPlayMessage(treasures);

  // Assert
  expect(display).toContain('Copper (+$1)');
  expect(display).toContain('Silver (+$2)');
  expect(display).toContain('Gold (+$3)');
  expect(display).toContain('Total: $6');
});
```

**UT-1.4: Auto-play performance**
```typescript
test('should auto-play 10 treasures in < 100ms', () => {
  // Arrange
  const hand = Array(10).fill('Copper');

  // Act
  const start = performance.now();
  cli.autoPlayTreasures(hand);
  const duration = performance.now() - start;

  // Assert
  expect(duration).toBeLessThan(100);
});
```

---

## Feature 2: Stable Card Numbers

### Unit Tests

#### Test Suite: `stable-numbers.test.ts`

**UT-2.1: Stable number mapping consistency**
```typescript
test('Village should always have stable number 7', () => {
  // Arrange
  const scenarios = [
    ['Village'],
    ['Copper', 'Village'],
    ['Village', 'Smithy', 'Market'],
    ['Estate', 'Estate', 'Village']
  ];

  // Act & Assert
  scenarios.forEach(hand => {
    const stableNum = getStableNumber('Village', hand);
    expect(stableNum).toBe(7);
  });
});
```

**UT-2.2: Stable number lookup table completeness**
```typescript
test('should have stable numbers for all cards', () => {
  // Arrange
  const allCards = [
    'Cellar', 'Council Room', 'Festival', 'Laboratory',
    'Market', 'Smithy', 'Village', 'Woodcutter',
    'Copper', 'Silver', 'Gold'
  ];

  // Act & Assert
  allCards.forEach(card => {
    const stableNum = STABLE_NUMBER_MAP[card];
    expect(stableNum).toBeDefined();
    expect(typeof stableNum).toBe('number');
  });
});
```

**UT-2.3: Reverse lookup (number to card)**
```typescript
test('should reverse lookup stable number to card', () => {
  // Assert
  expect(getCardByStableNumber(7)).toBe('Village');
  expect(getCardByStableNumber(6)).toBe('Smithy');
  expect(getCardByStableNumber(50)).toBe('End Phase');
});
```

**UT-2.4: Hybrid mode parsing**
```typescript
test('should accept both sequential and stable numbers', () => {
  // Arrange
  const moves = [
    {display: '[1] (S7) Play Village', inputs: ['1', 'S7', '7']}
  ];

  // Act & Assert
  moves.forEach(({inputs}) => {
    inputs.forEach(input => {
      expect(parser.parseMove(input)).toEqual({
        type: 'play_action',
        card: 'Village'
      });
    });
  });
});
```

**UT-2.5: Gap handling in numbered list**
```typescript
test('should display gaps correctly when some cards unavailable', () => {
  // Arrange
  const availableMoves = [
    {card: 'Village', stableNum: 7},
    {card: 'Market', stableNum: 5},
    {type: 'end_phase', stableNum: 50}
  ];

  // Act
  const display = formatMoveList(availableMoves, {stableNumbers: true});

  // Assert
  expect(display).toContain('[5] Play Market');
  expect(display).toContain('[7] Play Village');
  expect(display).toContain('[50] End Phase');
  expect(display).not.toContain('[6]'); // Gap for missing Smithy
});
```

---

## Feature 3: Multi-Card Chained Submission

### Unit Tests

#### Test Suite: `chained-submission.test.ts`

**UT-3.1: Parse comma-separated chain**
```typescript
test('should parse comma-separated chain correctly', () => {
  // Arrange
  const input = '1, 2, 3';

  // Act
  const moves = parser.parseChain(input);

  // Assert
  expect(moves).toEqual([1, 2, 3]);
});
```

**UT-3.2: Parse space-separated chain**
```typescript
test('should parse space-separated chain correctly', () => {
  // Arrange
  const input = '1 2 3';

  // Act
  const moves = parser.parseChain(input);

  // Assert
  expect(moves).toEqual([1, 2, 3]);
});
```

**UT-3.3: Parse mixed separator chain**
```typescript
test('should parse mixed separators correctly', () => {
  // Arrange
  const input = '1, 2 3,4';

  // Act
  const moves = parser.parseChain(input);

  // Assert
  expect(moves).toEqual([1, 2, 3, 4]);
});
```

**UT-3.4: Execute chain sequentially**
```typescript
test('should execute moves in left-to-right order', () => {
  // Arrange
  const chain = [1, 2, 3]; // Village, Smithy, End
  const executionOrder: string[] = [];

  // Act
  cli.executeChain(chain, (move) => {
    executionOrder.push(move.card || move.type);
  });

  // Assert
  expect(executionOrder).toEqual(['Village', 'Smithy', 'end_phase']);
});
```

**UT-3.5: Stop chain on error**
```typescript
test('should stop execution when move fails', () => {
  // Arrange
  const chain = [1, 99, 3]; // Valid, Invalid, Valid

  // Act
  const result = cli.executeChain(chain);

  // Assert
  expect(result.executedCount).toBe(1);
  expect(result.error).toContain('Invalid move number: 99');
  expect(result.failedAtIndex).toBe(1);
});
```

**UT-3.6: Reject invalid chain syntax**
```typescript
test('should reject non-numeric values in chain', () => {
  // Arrange
  const invalidChains = [
    '1, play, 3',
    '1 help 2',
    '1, quit',
    'abc, def'
  ];

  // Act & Assert
  invalidChains.forEach(chain => {
    expect(() => parser.parseChain(chain)).toThrow(/Invalid chain/);
  });
});
```

**UT-3.7: Chain execution performance**
```typescript
test('should execute chain of 10 moves in < 100ms', () => {
  // Arrange
  const chain = Array(10).fill(1); // 10 valid moves

  // Act
  const start = performance.now();
  cli.executeChain(chain);
  const duration = performance.now() - start;

  // Assert
  expect(duration).toBeLessThan(100);
});
```

---

## Feature 4: Reduced Supply Pile Sizes

### Unit Tests

#### Test Suite: `reduced-piles.test.ts`

**UT-4.1: Quick game flag reduces victory piles**
```typescript
test('should reduce victory piles to 8 with --quick-game', () => {
  // Arrange
  const options = {quickGame: true};

  // Act
  const supply = initializeSupply(options);

  // Assert
  expect(supply.get('Estate')).toBe(8);
  expect(supply.get('Duchy')).toBe(8);
  expect(supply.get('Province')).toBe(8);
});
```

**UT-4.2: Quick game flag reduces kingdom piles**
```typescript
test('should reduce kingdom piles to 8 with --quick-game', () => {
  // Arrange
  const options = {quickGame: true};

  // Act
  const supply = initializeSupply(options);

  // Assert
  expect(supply.get('Village')).toBe(8);
  expect(supply.get('Smithy')).toBe(8);
  expect(supply.get('Market')).toBe(8);
  // ... test all 8 kingdom cards
});
```

**UT-4.3: Treasure piles unchanged in quick game**
```typescript
test('should NOT reduce treasure piles', () => {
  // Arrange
  const options = {quickGame: true};

  // Act
  const supply = initializeSupply(options);

  // Assert
  expect(supply.get('Copper')).toBe(60);
  expect(supply.get('Silver')).toBe(40);
  expect(supply.get('Gold')).toBe(30);
});
```

**UT-4.4: Standard game unchanged**
```typescript
test('should use standard sizes without flag', () => {
  // Arrange
  const options = {quickGame: false};

  // Act
  const supply = initializeSupply(options);

  // Assert
  expect(supply.get('Province')).toBe(12);
  expect(supply.get('Village')).toBe(10);
});
```

**UT-4.5: Configurable pile size (if Option B)**
```typescript
test('should accept custom pile size', () => {
  // Arrange
  const options = {pileSize: 5};

  // Act
  const supply = initializeSupply(options);

  // Assert
  expect(supply.get('Province')).toBe(5);
  expect(supply.get('Village')).toBe(5);
});
```

**UT-4.6: Validate pile size bounds**
```typescript
test('should reject invalid pile sizes', () => {
  // Assert
  expect(() => initializeSupply({pileSize: 0})).toThrow(/at least 1/);
  expect(() => initializeSupply({pileSize: -5})).toThrow(/at least 1/);
  expect(() => initializeSupply({pileSize: 101})).toThrow(/maximum 100/);
});
```

---

## Feature 5: Victory Points Display

### Unit Tests

#### Test Suite: `victory-points.test.ts`

**UT-5.1: Calculate VP from entire deck**
```typescript
test('should calculate VP from all deck zones', () => {
  // Arrange
  const player = {
    hand: ['Estate', 'Copper'],
    drawPile: ['Estate', 'Duchy'],
    discardPile: ['Province', 'Estate'],
    inPlay: ['Copper', 'Silver']
  };

  // Act
  const vp = calculateVictoryPoints(player);

  // Assert
  expect(vp).toBe(13); // 3 Estates (3) + 1 Duchy (3) + 1 Province (6) = 12
});
```

**UT-5.2: VP calculation performance**
```typescript
test('should calculate VP in < 5ms', () => {
  // Arrange
  const player = createLargeDeck(100); // 100 cards

  // Act
  const start = performance.now();
  calculateVictoryPoints(player);
  const duration = performance.now() - start;

  // Assert
  expect(duration).toBeLessThan(5);
});
```

**UT-5.3: VP display formatting**
```typescript
test('should format VP display correctly', () => {
  // Arrange
  const player = {
    deck: ['Estate', 'Estate', 'Duchy', 'Province']
  };

  // Act
  const display = formatVPDisplay(player);

  // Assert
  expect(display).toMatch(/11 VP \(2E, 1D, 1P\)/);
});
```

**UT-5.4: VP updates after buying victory card**
```typescript
test('should update VP after buying Duchy', () => {
  // Arrange
  let gameState = createGameState();
  const initialVP = calculateVictoryPoints(gameState.players[0]);

  // Act
  const result = engine.executeMove(gameState, {type: 'buy', card: 'Duchy'});
  gameState = result.gameState;
  const newVP = calculateVictoryPoints(gameState.players[0]);

  // Assert
  expect(newVP).toBe(initialVP + 3);
});
```

---

## Feature 6: Auto-Skip Cleanup Phase

### Unit Tests

#### Test Suite: `auto-skip-cleanup.test.ts`

**UT-6.1: Detect auto-skip condition**
```typescript
test('should detect cleanup phase has no choices', () => {
  // Arrange
  const gameState = createGameStateInCleanup();

  // Act
  const shouldSkip = shouldAutoSkipCleanup(gameState);

  // Assert
  expect(shouldSkip).toBe(true);
});
```

**UT-6.2: Respect manual cleanup flag**
```typescript
test('should NOT auto-skip when manual flag is set', () => {
  // Arrange
  const gameState = createGameStateInCleanup();
  const options = {manualCleanup: true};

  // Act
  const shouldSkip = shouldAutoSkipCleanup(gameState, options);

  // Assert
  expect(shouldSkip).toBe(false);
});
```

**UT-6.3: Generate cleanup summary**
```typescript
test('should generate correct cleanup summary', () => {
  // Arrange
  const gameState = {
    players: [{
      hand: ['Copper', 'Copper', 'Estate'],
      inPlay: ['Village', 'Smithy']
    }]
  };

  // Act
  const summary = generateCleanupSummary(gameState);

  // Assert
  expect(summary).toContain('Discarded 5 cards');
  expect(summary).toContain('drew 5 new cards');
});
```

**UT-6.4: Cleanup auto-advance performance**
```typescript
test('should auto-skip cleanup in < 100ms', () => {
  // Arrange
  const gameState = createGameStateInCleanup();

  // Act
  const start = performance.now();
  cli.executeCleanupPhase(gameState);
  const duration = performance.now() - start;

  // Assert
  expect(duration).toBeLessThan(100);
});
```

**UT-6.5: Future-proof: Detect interactive cleanup**
```typescript
test('should NOT auto-skip when cleanup has choices', () => {
  // Arrange
  const gameState = createGameStateWithInteractiveCleanup();
  // Mock future card that requires cleanup decisions
  const validMoves = [
    {type: 'cleanup_discard', card: 'Cellar'},
    {type: 'end_phase'}
  ];

  // Act
  const shouldSkip = shouldAutoSkipCleanup(gameState);

  // Assert
  expect(shouldSkip).toBe(false); // Multiple moves = interactive
});
```

### Integration Tests

**INT-6.1: Cleanup auto-skip in full turn**
```typescript
test('should auto-skip cleanup during complete turn', () => {
  // Arrange
  const cli = new PrincipalityCLI();
  let gameState = cli.gameState;

  // Act: Complete action and buy phases
  gameState = cli.executeMove(gameState, {type: 'end_phase'}); // End action
  gameState = cli.executeMove(gameState, {type: 'end_phase'}); // End buy

  // Cleanup should auto-execute here

  // Assert
  expect(gameState.phase).toBe('action'); // Next turn started
  expect(gameState.turnNumber).toBe(2);
});
```

**INT-6.2: Manual cleanup flag workflow**
```typescript
test('should require manual input when flag set', () => {
  // Arrange
  const cli = new PrincipalityCLI({manualCleanup: true});
  let gameState = cli.gameState;

  // Act: Complete action and buy phases
  gameState = cli.executeMove(gameState, {type: 'end_phase'}); // End action
  gameState = cli.executeMove(gameState, {type: 'end_phase'}); // End buy

  // Assert: Still in cleanup, waiting for manual input
  expect(gameState.phase).toBe('cleanup');
  expect(cli.awaitingInput).toBe(true);
});
```

**INT-6.3: Cleanup summary display**
```typescript
test('should display cleanup summary correctly', () => {
  // Arrange
  const cli = new PrincipalityCLI();
  const outputCapture: string[] = [];
  cli.onOutput = (msg) => outputCapture.push(msg);

  // Act: Complete turn through cleanup
  cli.handleInput('end'); // End action
  cli.handleInput('end'); // End buy
  // Cleanup auto-executes

  // Assert
  const cleanupMessage = outputCapture.find(msg => msg.includes('Cleanup'));
  expect(cleanupMessage).toContain('Discarded');
  expect(cleanupMessage).toContain('drew');
});
```

**INT-6.4: Multiplayer cleanup sequence**
```typescript
test('should auto-skip cleanup for each player in turn', () => {
  // Arrange
  const cli = new PrincipalityCLI({players: 2});
  let gameState = cli.gameState;

  // Act: Player 1 completes turn
  gameState = cli.executeMove(gameState, {type: 'end_phase'}); // Action
  gameState = cli.executeMove(gameState, {type: 'end_phase'}); // Buy
  // Cleanup auto-executes

  // Assert: Player 2's turn started
  expect(gameState.currentPlayer).toBe(1);
  expect(gameState.phase).toBe('action');
});
```

---

## Integration Tests

### INT-1: Auto-Play + Chained Submission

**Test**: Phase transition in chain auto-plays treasures
```typescript
test('should auto-play treasures mid-chain when transitioning', () => {
  // Arrange
  const gameState = {
    phase: 'action',
    hand: ['Village', 'Smithy', 'Copper', 'Copper']
  };

  // Act: Chain that transitions to buy phase
  const result = cli.executeChain([1, 2, 3]); // Village, Smithy, End Phase

  // Assert
  expect(result.phase).toBe('buy');
  expect(result.coins).toBe(2); // Auto-played 2 Copper
  expect(result.messages).toContain('Auto-playing treasures');
});
```

### INT-2: Stable Numbers + Chained Submission

**Test**: Chain with stable numbers
```typescript
test('should execute chain using stable numbers', () => {
  // Arrange
  const options = {stableNumbers: true};
  const chain = 'S7, S6, S50'; // Village, Smithy, End

  // Act
  const result = cli.executeChain(parser.parseChain(chain), options);

  // Assert
  expect(result.moves).toEqual(['Village', 'Smithy', 'end_phase']);
});
```

### INT-3: All Features Combined

**Test**: Full turn with all features enabled
```typescript
test('should complete full turn with all features', () => {
  // Arrange
  const options = {
    quickGame: true,
    stableNumbers: true,
    autoPlayTreasures: true
  };
  const cli = new PrincipalityCLI(options);

  // Act: Chained input with stable numbers
  cli.handleInput('S7, S6, S50'); // Action phase chain
  cli.handleInput('S22');          // Buy Silver (stable #22)
  cli.handleInput('S50');          // End turn

  // Assert
  expect(cli.gameState.turnNumber).toBe(2);
  expect(cli.gameState.supply.get('Silver')).toBe(39); // 40 - 1
});
```

### INT-4: Performance with All Features

**Test**: All features maintain performance target
```typescript
test('should complete turn in < 200ms with all features', () => {
  // Arrange
  const options = {
    quickGame: true,
    stableNumbers: true,
    autoPlayTreasures: true
  };
  const cli = new PrincipalityCLI(options);

  // Act
  const start = performance.now();
  cli.handleInput('S7, S6, S50'); // Chain with stable numbers
  // Auto-play happens
  cli.handleInput('S22');          // Buy
  const duration = performance.now() - start;

  // Assert
  expect(duration).toBeLessThan(200);
});
```

---

## Regression Tests

### REG-1: Existing CLI Functionality Unchanged

**Test**: Basic game loop still works
```typescript
test('should still support sequential single-move input', () => {
  // Arrange
  const cli = new PrincipalityCLI(); // No new features

  // Act & Assert: Old-style input still works
  expect(() => cli.handleInput('1')).not.toThrow();
  expect(() => cli.handleInput('help')).not.toThrow();
  expect(() => cli.handleInput('quit')).not.toThrow();
});
```

**Test**: Display format compatible
```typescript
test('should display moves in backward-compatible format', () => {
  // Arrange
  const cli = new PrincipalityCLI({stableNumbers: false});

  // Act
  const display = cli.getAvailableMoves();

  // Assert
  expect(display).toMatch(/\[1\] Play/); // Sequential numbering
  expect(display).not.toMatch(/\(S\d+\)/); // No stable numbers
});
```

---

## End-to-End Tests

### E2E-1: Complete Quick Game

**Test**: Play full game with all features to completion
```typescript
test('should complete full game in < 5 minutes', async () => {
  // Arrange
  const cli = new PrincipalityCLI({
    quickGame: true,
    stableNumbers: true,
    seed: 'e2e-test-123'
  });

  // Act
  const start = Date.now();
  await playFullGameAutomated(cli);
  const duration = Date.now() - start;

  // Assert
  expect(cli.gameState.isGameOver).toBe(true);
  expect(duration).toBeLessThan(5 * 60 * 1000); // 5 minutes
  expect(cli.gameState.turnNumber).toBeLessThan(20); // Quick game
});
```

### E2E-2: Error Recovery

**Test**: Gracefully handle user errors
```typescript
test('should recover from invalid input mid-game', () => {
  // Arrange
  const cli = new PrincipalityCLI();

  // Act: Mix of valid and invalid inputs
  cli.handleInput('1');      // Valid
  cli.handleInput('xyz');    // Invalid
  cli.handleInput('999');    // Invalid number
  cli.handleInput('2');      // Valid

  // Assert
  expect(cli.gameState.isRunning).toBe(true);
  expect(cli.errorCount).toBe(2);
});
```

---

## Performance Benchmarks

### Benchmark Suite: `performance.test.ts`

**PERF-1: Auto-play various treasure counts**
```typescript
const treasureCounts = [0, 1, 5, 10, 20];
treasureCounts.forEach(count => {
  test(`auto-play ${count} treasures in < 100ms`, () => {
    const hand = Array(count).fill('Copper');
    const start = performance.now();
    autoPlayTreasures(hand);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
```

**PERF-2: Chain execution scalability**
```typescript
const chainLengths = [1, 5, 10, 20, 50];
chainLengths.forEach(length => {
  test(`execute chain of ${length} moves in < 200ms`, () => {
    const chain = Array(length).fill(1);
    const start = performance.now();
    executeChain(chain);
    expect(performance.now() - start).toBeLessThan(200);
  });
});
```

---

## Test Data Fixtures

### Fixture: Standard Hands
```typescript
export const FIXTURE_HANDS = {
  startingHand: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'],

  allTreasures: ['Copper', 'Copper', 'Silver', 'Gold'],

  noTreasures: ['Estate', 'Estate', 'Village', 'Smithy'],

  mixedHand: ['Village', 'Smithy', 'Copper', 'Estate', 'Silver'],

  actionHeavy: ['Village', 'Smithy', 'Market', 'Laboratory', 'Festival']
};
```

### Fixture: Game States
```typescript
export const FIXTURE_STATES = {
  earlyGame: {
    turnNumber: 1,
    phase: 'action',
    supply: standardSupply(),
    players: [standardStartingPlayer()]
  },

  midGame: {
    turnNumber: 10,
    phase: 'buy',
    supply: depletedSupply(['Village', 'Smithy']),
    players: [expandedDeckPlayer()]
  },

  lateGame: {
    turnNumber: 20,
    phase: 'action',
    supply: nearEmptySupply(),
    players: [victoryCardHeavyPlayer()]
  }
};
```

---

## Coverage Requirements

### Code Coverage Targets

| Component | Line Coverage | Branch Coverage | Function Coverage |
|-----------|--------------|----------------|------------------|
| `parser.ts` | 95%+ | 90%+ | 100% |
| `display.ts` | 90%+ | 85%+ | 95%+ |
| `cli.ts` | 85%+ | 80%+ | 90%+ |
| **Overall** | **90%+** | **85%+** | **95%+** |

### Untestable Code

Acceptable exclusions from coverage:
- Console I/O (mocked in tests)
- Process exit handlers
- Readline interface initialization

---

## Test Execution

### Run All Tests
```bash
npm run test:cli
```

### Run Specific Suite
```bash
npm run test:cli -- auto-play-treasures.test.ts
```

### Run with Coverage
```bash
npm run test:cli -- --coverage
```

### Run Performance Tests
```bash
npm run test:perf:cli
```

### Continuous Integration
```yaml
# .github/workflows/cli-tests.yml
- name: Run CLI Tests
  run: npm run test:cli -- --coverage

- name: Check Coverage
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 90" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 90%"
      exit 1
    fi
```

---

## Test Documentation

Each test should include:
- **Description**: What is being tested
- **Arrange-Act-Assert**: Clear test structure
- **Expected Behavior**: What should happen
- **Edge Cases**: What could go wrong

**Example**:
```typescript
/**
 * Test: Auto-play treasures with mixed hand
 *
 * Scenario: Hand contains 2 Copper, 1 Silver, 1 Estate
 * Expected: Only treasures are played (3 coins total)
 * Edge Case: Estate remains in hand
 */
test('should only auto-play treasures, not victory cards', () => {
  // ...
});
```

---

## Next Steps for Test-Architect

1. Review this specification
2. Create test files in `packages/cli/tests/`
3. Implement unit tests first (70% of effort)
4. Add integration tests (25% of effort)
5. Add E2E tests (5% of effort)
6. Verify coverage meets targets
7. Report any gaps in requirements

---

## References

- [CLI_PHASE2_REQUIREMENTS.md](/Users/eddelord/Documents/Projects/principality_ai/CLI_PHASE2_REQUIREMENTS.md) - Full requirements
- [STABLE_NUMBER_REFERENCE.md](/Users/eddelord/Documents/Projects/principality_ai/STABLE_NUMBER_REFERENCE.md) - Number mappings
- [PERFORMANCE_REQUIREMENTS.md](/Users/eddelord/Documents/Projects/principality_ai/PERFORMANCE_REQUIREMENTS.md) - Performance targets
