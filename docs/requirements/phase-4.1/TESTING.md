# Phase 4.1 Testing Strategy

**Status**: DRAFT
**Created**: 2025-11-03
**Last-Updated**: 2025-11-03
**Owner**: requirements-architect
**Phase**: 4.1

---

## Testing Philosophy

Phase 4.1 follows strict Test-Driven Development (TDD):

1. **Tests Written FIRST** - Before any implementation code
2. **RED Phase** - All tests fail initially (validates tests are meaningful)
3. **GREEN Phase** - Implementation makes tests pass
4. **REFACTOR** - Improve code while tests continue passing
5. **Regression** - All previous phase tests must pass (100%)

### Three Test Levels

Every feature MUST have tests at all three levels:

1. **Unit Tests** - Isolated function behavior, input/output validation
2. **Integration Tests** - Component interactions, data flow between modules
3. **End-to-End Tests** - Complete user workflows, full feature validation

---

## Coverage Targets

| Metric | Target | Validation |
|--------|--------|------------|
| Unit test coverage | ≥ 95% | Jest coverage report |
| Integration test coverage | All feature interactions | Manual verification |
| E2E test coverage | All user workflows | Manual verification |
| Regression | 100% existing tests pass | CI pipeline |
| Performance | No degradation | Benchmark comparison |

---

## Test Organization

### File Structure

```
packages/core/tests/
  ├── phase-4.1/
  │   ├── random-kingdom.test.ts          (Feature 1 unit tests)
  │   ├── random-kingdom-integration.test.ts  (Feature 1 integration)
  │   └── card-sorting.test.ts            (Feature 3 unit tests)

packages/cli/tests/
  ├── phase-4.1/
  │   ├── interactive-prompts.test.ts     (Feature 2 unit tests)
  │   ├── interactive-prompts-cellar.test.ts
  │   ├── interactive-prompts-chapel.test.ts
  │   ├── interactive-prompts-remodel.test.ts
  │   ├── interactive-prompts-mine.test.ts
  │   ├── interactive-prompts-workshop.test.ts
  │   ├── interactive-prompts-feast.test.ts
  │   ├── interactive-prompts-library.test.ts
  │   ├── interactive-prompts-throne-room.test.ts
  │   ├── interactive-prompts-chancellor.test.ts
  │   ├── interactive-prompts-spy.test.ts
  │   ├── interactive-prompts-bureaucrat.test.ts
  │   ├── interactive-prompts-integration.test.ts
  │   └── card-sorting-display.test.ts    (Feature 3 integration)

packages/cli/tests/e2e/
  └── phase-4.1-full-game.test.ts         (E2E tests for all features)
```

---

## Feature 1: Random Kingdom Card Selection

### Unit Tests

#### UT-RKS-1: Should select exactly 10 kingdom cards

**Purpose**: Validate core selection logic returns correct count

**Setup**:
```typescript
const engine = new GameEngine();
const seed = 'test-seed-001';
const state = engine.initializeGame(1, seed);
```

**Execute**:
```typescript
const kingdomCards = Array.from(state.supply.keys())
  .filter(card => !isBasicCard(card) && card !== 'Curse');
```

**Assert**:
```typescript
expect(kingdomCards).toHaveLength(10);
expect(state.supply.size).toBe(17); // 10 kingdom + 6 basic + 1 Curse
```

**Coverage**: FR-RKS-1, AC-RKS-1

---

#### UT-RKS-2: Should use seed for reproducibility

**Purpose**: Validate same seed produces identical kingdom selection

**Setup**:
```typescript
const engine1 = new GameEngine();
const engine2 = new GameEngine();
const seed = 'reproducible-seed';
```

**Execute**:
```typescript
const state1 = engine1.initializeGame(1, seed);
const state2 = engine2.initializeGame(1, seed);

const kingdom1 = extractKingdomCards(state1);
const kingdom2 = extractKingdomCards(state2);
```

**Assert**:
```typescript
expect(kingdom1).toEqual(kingdom2);
expect(kingdom1.sort()).toEqual(kingdom2.sort());
```

**Coverage**: FR-RKS-2, AC-RKS-2

---

#### UT-RKS-3: Should produce different kingdoms with different seeds

**Purpose**: Validate randomization works (different seeds → different results)

**Setup**:
```typescript
const engine = new GameEngine();
const seed1 = 'seed-alpha';
const seed2 = 'seed-beta';
```

**Execute**:
```typescript
const state1 = engine.initializeGame(1, seed1);
const state2 = engine.initializeGame(1, seed2);

const kingdom1 = extractKingdomCards(state1);
const kingdom2 = extractKingdomCards(state2);
```

**Assert**:
```typescript
expect(kingdom1).not.toEqual(kingdom2);
// At least one card should differ
const differences = kingdom1.filter(card => !kingdom2.includes(card));
expect(differences.length).toBeGreaterThan(0);
```

**Coverage**: FR-RKS-2, AC-RKS-3

---

#### UT-RKS-4: Should respect explicit kingdomCards option

**Purpose**: Validate backward compatibility with explicit card specification

**Setup**:
```typescript
const engine = new GameEngine();
const explicitCards = ['Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
                       'Council Room', 'Cellar', 'Chapel', 'Remodel', 'Mine'];
const options = { kingdomCards: explicitCards };
```

**Execute**:
```typescript
const state = engine.initializeGame(1, 'any-seed', options);
const kingdomCards = extractKingdomCards(state);
```

**Assert**:
```typescript
expect(kingdomCards.sort()).toEqual(explicitCards.sort());
expect(kingdomCards).toHaveLength(10);
```

**Coverage**: FR-RKS-5, AC-RKS-4

---

#### UT-RKS-5: Should include all basic cards always

**Purpose**: Validate basic cards (Copper, Silver, Gold, Estate, Duchy, Province, Curse) are always present

**Setup**:
```typescript
const engine = new GameEngine();
const state = engine.initializeGame(1, 'test-seed');
```

**Execute**:
```typescript
const basicCards = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];
```

**Assert**:
```typescript
basicCards.forEach(card => {
  expect(state.supply.has(card)).toBe(true);
  expect(state.supply.get(card)).toBeGreaterThan(0);
});
```

**Coverage**: FR-RKS-1

---

#### UT-RKS-6: Should include all 25 cards across multiple games (statistical)

**Purpose**: Validate unbiased selection (all cards have non-zero probability)

**Setup**:
```typescript
const engine = new GameEngine();
const iterations = 100;
const allKingdomCards = getAllKingdomCards(); // Returns array of all 25 cards
const cardAppearances = new Map<CardName, number>();
```

**Execute**:
```typescript
for (let i = 0; i < iterations; i++) {
  const state = engine.initializeGame(1, `seed-${i}`);
  const kingdom = extractKingdomCards(state);
  kingdom.forEach(card => {
    cardAppearances.set(card, (cardAppearances.get(card) || 0) + 1);
  });
}
```

**Assert**:
```typescript
// Every card should appear at least once in 100 games
allKingdomCards.forEach(card => {
  expect(cardAppearances.get(card)).toBeGreaterThan(0);
});

// Statistical validation: each card should appear roughly 40 times (10/25 * 100)
// Allow variance: between 20 and 60 appearances
allKingdomCards.forEach(card => {
  const appearances = cardAppearances.get(card) || 0;
  expect(appearances).toBeGreaterThanOrEqual(20);
  expect(appearances).toBeLessThanOrEqual(60);
});
```

**Coverage**: FR-RKS-3, AC-RKS-6

---

#### UT-RKS-7: Should throw error for invalid explicit kingdom (too few cards)

**Purpose**: Validate error handling for invalid input

**Setup**:
```typescript
const engine = new GameEngine();
const invalidCards = ['Village', 'Smithy']; // Only 2 cards, need 10
const options = { kingdomCards: invalidCards };
```

**Execute & Assert**:
```typescript
expect(() => {
  engine.initializeGame(1, 'seed', options);
}).toThrow('kingdomCards must contain exactly 10 cards');
```

**Coverage**: EC-RKS-1

---

#### UT-RKS-8: Should complete selection in < 10ms

**Purpose**: Validate performance requirement

**Setup**:
```typescript
const engine = new GameEngine();
const seed = 'performance-test';
```

**Execute**:
```typescript
const startTime = performance.now();
const state = engine.initializeGame(1, seed);
const endTime = performance.now();
const duration = endTime - startTime;
```

**Assert**:
```typescript
expect(duration).toBeLessThan(10); // milliseconds
```

**Coverage**: NFR-RKS-1, AC-RKS-8

---

### Integration Tests

#### IT-RKS-1: Full game with random kingdom

**Purpose**: Validate complete game flow with random kingdom selection

**Setup**:
```typescript
const engine = new GameEngine();
const seed = 'integration-test-001';
let state = engine.initializeGame(2, seed);
```

**Execute**:
```typescript
// Play several turns
state = playTurn(state); // Turn 1
state = playTurn(state); // Turn 2
state = playTurn(state); // Turn 3

// Try to buy a kingdom card that was selected
const selectedKingdom = extractKingdomCards(state);
const cardToBuy = selectedKingdom[0];

state = executeBuy(state, cardToBuy);
```

**Assert**:
```typescript
// Should successfully buy selected kingdom card
expect(state.players[0].discardPile).toContain(cardToBuy);

// Should NOT be able to buy non-selected kingdom card
const allKingdom = getAllKingdomCards();
const notSelected = allKingdom.find(card => !selectedKingdom.includes(card));
expect(state.supply.has(notSelected)).toBe(false);
```

**Coverage**: FR-RKS-1, AC-RKS-1, E2E workflow

---

#### IT-RKS-2: CLI displays kingdom at game start

**Purpose**: Validate CLI integration with kingdom selection

**Setup**:
```typescript
const engine = new GameEngine();
const seed = 'cli-display-test';
const state = engine.initializeGame(1, seed);
const outputCapture = new OutputCapture();
```

**Execute**:
```typescript
displayGameStart(state, outputCapture);
const output = outputCapture.getOutput();
```

**Assert**:
```typescript
expect(output).toContain('Kingdom Cards:');
const selectedKingdom = extractKingdomCards(state);
selectedKingdom.forEach(card => {
  expect(output).toContain(card);
});

// Should display before Turn 1
const kingdomIndex = output.indexOf('Kingdom Cards:');
const turn1Index = output.indexOf('Turn 1');
expect(kingdomIndex).toBeLessThan(turn1Index);
```

**Coverage**: FR-RKS-4, AC-RKS-5

---

#### IT-RKS-3: Explicit kingdom overrides random selection

**Purpose**: Validate option precedence (explicit > random)

**Setup**:
```typescript
const engine = new GameEngine();
const seed = 'override-test';
const explicitCards = ['Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
                       'Woodcutter', 'Cellar', 'Chapel', 'Remodel', 'Mine'];
const options = { kingdomCards: explicitCards };
```

**Execute**:
```typescript
const state = engine.initializeGame(1, seed, options);
const kingdom = extractKingdomCards(state);
```

**Assert**:
```typescript
expect(kingdom.sort()).toEqual(explicitCards.sort());

// Verify seed doesn't affect outcome
const state2 = engine.initializeGame(1, 'different-seed', options);
const kingdom2 = extractKingdomCards(state2);
expect(kingdom2.sort()).toEqual(explicitCards.sort());
```

**Coverage**: FR-RKS-5, AC-RKS-4

---

### End-to-End Tests

#### E2E-RKS-1: Complete game with random kingdom

**Purpose**: Validate full user experience from game start to completion

**Setup**:
```typescript
const engine = new GameEngine();
const seed = 'e2e-full-game';
let state = engine.initializeGame(1, seed);
```

**Execute**:
```typescript
// Capture kingdom cards displayed at start
const selectedKingdom = extractKingdomCards(state);
console.log('Kingdom:', selectedKingdom);

// Play full game to completion
while (!checkVictory(state).isGameOver) {
  state = playAITurn(state); // AI plays optimally
}

const victory = checkVictory(state);
```

**Assert**:
```typescript
expect(victory.isGameOver).toBe(true);
expect(selectedKingdom).toHaveLength(10);

// Verify only selected kingdom cards were available
const player = state.players[0];
const allPlayerCards = [
  ...player.drawPile,
  ...player.hand,
  ...player.discardPile,
  ...player.inPlay
];

const kingdomCardsInDeck = allPlayerCards.filter(card =>
  !isBasicCard(card) && card !== 'Curse'
);

kingdomCardsInDeck.forEach(card => {
  expect(selectedKingdom).toContain(card);
});
```

**Coverage**: All FR-RKS-*, AC-RKS-1 through AC-RKS-8

---

## Feature 2: CLI Interactive Prompts

### Unit Tests: Cellar

#### UT-CLI-CELLAR-1: Should show discard options after playing Cellar

**Purpose**: Validate prompt displays all discard combinations

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Cellar', 'Copper', 'Copper', 'Estate', 'Silver'],
  phase: 'action'
});
const result = executeMove(state, { type: 'play_action', card: 'Cellar' });
```

**Execute**:
```typescript
const options = generateDiscardOptions(result.newState);
```

**Assert**:
```typescript
expect(result.newState.pendingEffect).toBeDefined();
expect(result.newState.pendingEffect?.effect).toBe('discard_for_cellar');
expect(options.length).toBeGreaterThan(0);

// Should include "discard nothing" option
const discardNothingOption = options.find(opt => opt.cards?.length === 0);
expect(discardNothingOption).toBeDefined();

// Should include discard all 4 cards option
const discardAllOption = options.find(opt => opt.cards?.length === 4);
expect(discardAllOption).toBeDefined();
```

**Coverage**: FR-CLI-1, FR-CLI-2, AC-CLI-1

---

#### UT-CLI-CELLAR-2: Should execute selected discard

**Purpose**: Validate move execution from user selection

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Copper', 'Copper', 'Copper', 'Estate'],
  pendingEffect: { card: 'Cellar', effect: 'discard_for_cellar' }
});
```

**Execute**:
```typescript
const move = { type: 'discard_for_cellar', cards: ['Copper', 'Copper', 'Copper'] };
const result = executeMove(state, move);
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.players[0].discardPile).toContain('Copper');
expect(result.newState.players[0].hand).toHaveLength(4); // 1 Estate + 3 drawn
expect(result.newState.pendingEffect).toBeUndefined(); // Cleared after execution
```

**Coverage**: FR-CLI-5, AC-CLI-1

---

#### UT-CLI-CELLAR-3: Should format options correctly

**Purpose**: Validate display formatting for Cellar options

**Setup**:
```typescript
const move = { type: 'discard_for_cellar', cards: ['Copper', 'Copper', 'Estate'] };
```

**Execute**:
```typescript
const formatted = formatMoveOption(move, 1);
```

**Assert**:
```typescript
expect(formatted).toContain('[1]');
expect(formatted).toContain('Discard');
expect(formatted).toContain('Copper, Copper, Estate');
expect(formatted).toContain('draw 3');
```

**Coverage**: FR-CLI-3, AC-CLI-9

---

### Unit Tests: Chapel

#### UT-CLI-CHAPEL-1: Should show trash options after playing Chapel

**Purpose**: Validate Chapel prompts show trash combinations

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Chapel', 'Copper', 'Copper', 'Estate', 'Curse'],
  phase: 'action'
});
const result = executeMove(state, { type: 'play_action', card: 'Chapel' });
```

**Execute**:
```typescript
const options = generateTrashOptions(result.newState);
```

**Assert**:
```typescript
expect(result.newState.pendingEffect?.effect).toBe('trash_cards');
expect(result.newState.pendingEffect?.maxTrash).toBe(4);
expect(options.length).toBeGreaterThan(0);

// Should include "trash nothing" option
const trashNothingOption = options.find(opt => opt.cards?.length === 0);
expect(trashNothingOption).toBeDefined();

// Should allow trashing up to 4 cards
const maxTrash = Math.max(...options.map(opt => opt.cards?.length || 0));
expect(maxTrash).toBeLessThanOrEqual(4);
```

**Coverage**: FR-CLI-2, FR-CLI-6

---

#### UT-CLI-CHAPEL-2: Should execute trash and update trash pile

**Purpose**: Validate cards move to trash pile correctly

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Copper', 'Estate', 'Curse'],
  trash: [],
  pendingEffect: { card: 'Chapel', effect: 'trash_cards', maxTrash: 4 }
});
```

**Execute**:
```typescript
const move = { type: 'trash_cards', cards: ['Copper', 'Curse'] };
const result = executeMove(state, move);
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.trash).toContain('Copper');
expect(result.newState.trash).toContain('Curse');
expect(result.newState.players[0].hand).toEqual(['Estate']);
expect(result.newState.pendingEffect).toBeUndefined();
```

**Coverage**: FR-CLI-5

---

### Unit Tests: Remodel (2-Step)

#### UT-CLI-REMODEL-1: Should show 2-step interaction

**Purpose**: Validate multi-step card flow

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Remodel', 'Estate', 'Copper', 'Silver'],
  phase: 'action'
});
```

**Execute**:
```typescript
// Step 1: Play Remodel
let result = executeMove(state, { type: 'play_action', card: 'Remodel' });
```

**Assert Step 1**:
```typescript
expect(result.newState.pendingEffect?.effect).toBe('trash_for_remodel');
const trashOptions = generateRemodelTrashOptions(result.newState);
expect(trashOptions.length).toBe(3); // Estate, Copper, Silver
```

**Execute Step 2**:
```typescript
// Trash Estate (cost $2)
result = executeMove(result.newState, { type: 'trash_cards', cards: ['Estate'] });
```

**Assert Step 2**:
```typescript
expect(result.newState.pendingEffect?.effect).toBe('gain_card');
expect(result.newState.pendingEffect?.maxGainCost).toBe(4); // $2 + $2
expect(result.newState.pendingEffect?.card).toBe('Remodel');
```

**Coverage**: FR-CLI-5, AC-CLI-5

---

#### UT-CLI-REMODEL-2: Should complete 2-step gain

**Purpose**: Validate full Remodel execution

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Estate'],
  trash: [],
  supply: createSupplyWithCards(['Smithy', 'Silver', 'Village']),
  pendingEffect: {
    card: 'Remodel',
    effect: 'gain_card',
    maxGainCost: 4,
    trashedCard: 'Estate'
  }
});
```

**Execute**:
```typescript
const move = { type: 'gain_card', card: 'Smithy' };
const result = executeMove(state, move);
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.trash).toContain('Estate');
expect(result.newState.players[0].discardPile).toContain('Smithy');
expect(result.newState.pendingEffect).toBeUndefined(); // Fully resolved
```

**Coverage**: FR-CLI-5, AC-CLI-5

---

### Unit Tests: Mine (2-Step, Treasure-Specific)

#### UT-CLI-MINE-1: Should show only treasures in Step 1

**Purpose**: Validate Mine restricts options to treasures

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Mine', 'Copper', 'Silver', 'Estate', 'Village'],
  phase: 'action'
});
const result = executeMove(state, { type: 'play_action', card: 'Mine' });
```

**Execute**:
```typescript
const options = generateMineTrashOptions(result.newState);
```

**Assert**:
```typescript
expect(result.newState.pendingEffect?.effect).toBe('select_treasure_to_trash');
expect(options.length).toBe(2); // Only Copper and Silver
expect(options.every(opt => isTreasure(opt.cards[0]))).toBe(true);
```

**Coverage**: FR-CLI-2, FR-CLI-6

---

#### UT-CLI-MINE-2: Should gain treasure to hand (not discard)

**Purpose**: Validate Mine's unique "to hand" behavior

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Copper'],
  trash: ['Silver'],
  supply: createSupplyWithCards(['Gold', 'Silver', 'Copper']),
  pendingEffect: {
    card: 'Mine',
    effect: 'gain_card',
    maxGainCost: 6,
    destination: 'hand'
  }
});
```

**Execute**:
```typescript
const move = { type: 'gain_card', card: 'Gold', destination: 'hand' };
const result = executeMove(state, move);
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.players[0].hand).toContain('Gold'); // To hand, not discard
expect(result.newState.players[0].discardPile).not.toContain('Gold');
expect(result.newState.pendingEffect).toBeUndefined();
```

**Coverage**: FR-CLI-5, AC-CLI-6

---

### Unit Tests: Workshop & Feast

#### UT-CLI-WORKSHOP-1: Should show cards up to $4

**Purpose**: Validate Workshop gain options filtered by cost

**Setup**:
```typescript
const state = createMockGameState({
  phase: 'action',
  supply: createSupplyWithCards(['Province', 'Duchy', 'Smithy', 'Silver', 'Estate']),
  pendingEffect: { card: 'Workshop', effect: 'gain_card', maxGainCost: 4 }
});
```

**Execute**:
```typescript
const options = generateGainOptions(state);
```

**Assert**:
```typescript
// Should include Smithy ($4), Silver ($3), Estate ($2)
expect(options.some(opt => opt.card === 'Smithy')).toBe(true);
expect(options.some(opt => opt.card === 'Silver')).toBe(true);
expect(options.some(opt => opt.card === 'Estate')).toBe(true);

// Should NOT include Province ($8) or Duchy ($5)
expect(options.some(opt => opt.card === 'Province')).toBe(false);
expect(options.some(opt => opt.card === 'Duchy')).toBe(false);
```

**Coverage**: FR-CLI-2

---

#### UT-CLI-FEAST-1: Should trash Feast and show cards up to $5

**Purpose**: Validate Feast's automatic trash + gain

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Feast', 'Copper'],
  inPlay: [],
  trash: [],
  phase: 'action'
});
```

**Execute**:
```typescript
const result = executeMove(state, { type: 'play_action', card: 'Feast' });
```

**Assert**:
```typescript
expect(result.newState.trash).toContain('Feast'); // Automatically trashed
expect(result.newState.pendingEffect?.effect).toBe('gain_card');
expect(result.newState.pendingEffect?.maxGainCost).toBe(5);
```

**Coverage**: FR-CLI-6

---

### Unit Tests: Library (Iterative)

#### UT-CLI-LIBRARY-1: Should prompt for each action card drawn

**Purpose**: Validate Library's per-card decision loop

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Library', 'Copper'], // 2 cards
  drawPile: ['Village', 'Silver', 'Smithy', 'Estate', 'Gold'],
  phase: 'action'
});
```

**Execute**:
```typescript
let result = executeMove(state, { type: 'play_action', card: 'Library' });
```

**Assert**:
```typescript
// First action card (Village) triggers prompt
expect(result.newState.pendingEffect?.effect).toBe('library_set_aside');
// Hand should have: Copper, Silver (drew 2: Silver non-action auto-kept, Village pending)
```

**Execute Decision 1**:
```typescript
result = executeMove(result.newState, {
  type: 'library_set_aside',
  cards: ['Village'],
  choice: true // Set aside
});
```

**Assert**:
```typescript
// Village set aside, continue drawing
// Next action card (Smithy) triggers prompt
expect(result.newState.pendingEffect?.effect).toBe('library_set_aside');
```

**Coverage**: FR-CLI-5, AC-CLI-7

---

### Unit Tests: Throne Room

#### UT-CLI-THRONE-1: Should list action cards to double

**Purpose**: Validate Throne Room action selection

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Throne Room', 'Village', 'Smithy', 'Copper', 'Estate'],
  phase: 'action',
  actions: 1
});
const result = executeMove(state, { type: 'play_action', card: 'Throne Room' });
```

**Execute**:
```typescript
const options = generateThroneRoomOptions(result.newState);
```

**Assert**:
```typescript
expect(result.newState.pendingEffect?.effect).toBe('select_action_for_throne');
expect(options.length).toBe(2); // Village and Smithy only (no Copper, Estate, or Throne Room itself)
expect(options.some(opt => opt.card === 'Village')).toBe(true);
expect(options.some(opt => opt.card === 'Smithy')).toBe(true);
expect(options.some(opt => opt.card === 'Throne Room')).toBe(false); // Can't throne a throne
```

**Coverage**: FR-CLI-2, FR-CLI-6

---

#### UT-CLI-THRONE-2: Should play selected action twice

**Purpose**: Validate Throne Room doubles card effect

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Village', 'Copper'],
  inPlay: ['Throne Room'],
  actions: 0,
  pendingEffect: { card: 'Throne Room', effect: 'select_action_for_throne' }
});
```

**Execute**:
```typescript
const move = { type: 'select_action_for_throne', card: 'Village' };
const result = executeMove(state, move);
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.players[0].hand.length).toBe(3); // Drew 2 cards (1 per Village)
expect(result.newState.players[0].actions).toBe(4); // +2 actions twice = +4 total
expect(result.newState.pendingEffect).toBeUndefined();
```

**Coverage**: FR-CLI-5

---

### Unit Tests: Chancellor

#### UT-CLI-CHANCELLOR-1: Should offer binary choice

**Purpose**: Validate Chancellor's yes/no decision

**Setup**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Chancellor', 'Copper'],
  drawPile: ['Estate', 'Copper', 'Silver'],
  discardPile: ['Duchy'],
  coins: 0,
  phase: 'action'
});
const result = executeMove(state, { type: 'play_action', card: 'Chancellor' });
```

**Execute**:
```typescript
const options = generateChancellorOptions(result.newState);
```

**Assert**:
```typescript
expect(result.newState.coins).toBe(2); // +$2 applied immediately
expect(result.newState.pendingEffect?.effect).toBe('chancellor_decision');
expect(options.length).toBe(2); // Yes and No
expect(options[0].choice).toBe(true); // Yes option
expect(options[1].choice).toBe(false); // No option
```

**Coverage**: FR-CLI-2, FR-CLI-6

---

#### UT-CLI-CHANCELLOR-2: Should move deck to discard on Yes

**Purpose**: Validate Chancellor's deck-to-discard effect

**Setup**:
```typescript
const state = createMockGameState({
  drawPile: ['Estate', 'Copper', 'Silver'],
  discardPile: ['Duchy'],
  pendingEffect: { card: 'Chancellor', effect: 'chancellor_decision' }
});
```

**Execute**:
```typescript
const move = { type: 'chancellor_decision', choice: true };
const result = executeMove(state, move);
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.players[0].drawPile).toHaveLength(0); // Empty
expect(result.newState.players[0].discardPile).toHaveLength(4); // Duchy + 3 from deck
expect(result.newState.pendingEffect).toBeUndefined();
```

**Coverage**: FR-CLI-5

---

### Unit Tests: Spy (Multi-Player)

#### UT-CLI-SPY-1: Should prompt for each player's top card

**Purpose**: Validate Spy's per-player decision loop

**Setup**:
```typescript
const state = createMockGameState({
  playerCount: 2,
  currentPlayer: 0,
  player0Hand: ['Spy', 'Copper'],
  player0DrawPile: ['Estate'],
  player1DrawPile: ['Silver'],
  phase: 'action'
});
```

**Execute**:
```typescript
let result = executeMove(state, { type: 'play_action', card: 'Spy' });
```

**Assert Step 1**:
```typescript
// +1 Card, +1 Action applied
expect(result.newState.players[0].actions).toBe(1);
// First decision: current player (Player 0)
expect(result.newState.pendingEffect?.effect).toBe('spy_decision');
expect(result.newState.pendingEffect?.targetPlayer).toBe(0);
```

**Execute Decision 1**:
```typescript
result = executeMove(result.newState, {
  type: 'spy_decision',
  playerIndex: 0,
  choice: false // Discard
});
```

**Assert Step 2**:
```typescript
// Player 0's Estate discarded, now Player 1's turn
expect(result.newState.players[0].discardPile).toContain('Estate');
expect(result.newState.pendingEffect?.targetPlayer).toBe(1);
```

**Coverage**: FR-CLI-5, AC-CLI-8

---

### Unit Tests: Bureaucrat

#### UT-CLI-BUREAUCRAT-1: Should prompt opponent to topdeck victory card

**Purpose**: Validate Bureaucrat's attack decision for opponent

**Setup**:
```typescript
const state = createMockGameState({
  playerCount: 2,
  currentPlayer: 0,
  player0Hand: ['Bureaucrat', 'Copper'],
  player1Hand: ['Estate', 'Duchy', 'Copper'],
  phase: 'action'
});
```

**Execute**:
```typescript
const result = executeMove(state, { type: 'play_action', card: 'Bureaucrat' });
```

**Assert**:
```typescript
// Player 0 gains Silver to deck
expect(result.newState.players[0].drawPile[0]).toBe('Silver'); // Top of deck

// Player 1 must choose victory card to topdeck
expect(result.newState.pendingEffect?.effect).toBe('reveal_and_topdeck');
expect(result.newState.pendingEffect?.targetPlayer).toBe(1);

const options = generateBureaucratOptions(result.newState, 1);
expect(options.length).toBe(2); // Estate and Duchy
```

**Coverage**: FR-CLI-2, FR-CLI-6

---

### Unit Tests: Input Parsing & Error Handling

#### UT-CLI-INPUT-1: Should parse valid numeric input

**Purpose**: Validate numeric selection parsing

**Setup**:
```typescript
const options = [
  { type: 'discard_for_cellar', cards: ['Copper', 'Copper'] },
  { type: 'discard_for_cellar', cards: ['Copper'] },
  { type: 'discard_for_cellar', cards: [] }
];
```

**Execute**:
```typescript
const selection1 = parseUserSelection('1', options);
const selection2 = parseUserSelection('2', options);
const selection3 = parseUserSelection('3', options);
```

**Assert**:
```typescript
expect(selection1).toBe(0); // Index 0
expect(selection2).toBe(1); // Index 1
expect(selection3).toBe(2); // Index 2
```

**Coverage**: FR-CLI-4

---

#### UT-CLI-INPUT-2: Should reject invalid input

**Purpose**: Validate error handling for bad input

**Setup**:
```typescript
const options = [
  { type: 'gain_card', card: 'Smithy' },
  { type: 'gain_card', card: 'Silver' }
];
```

**Execute & Assert**:
```typescript
expect(parseUserSelection('abc', options)).toBeNull();
expect(parseUserSelection('0', options)).toBeNull(); // Out of range (1-indexed display)
expect(parseUserSelection('99', options)).toBeNull(); // Out of range
expect(parseUserSelection('-1', options)).toBeNull(); // Negative
expect(parseUserSelection('', options)).toBeNull(); // Empty
```

**Coverage**: FR-CLI-4, AC-CLI-4

---

### Integration Tests

#### IT-CLI-1: Full Cellar interaction flow

**Purpose**: Validate complete user workflow for Cellar

**Setup**:
```typescript
const engine = new GameEngine();
let state = engine.initializeGame(1, 'cellar-test');
// Set up game state with Cellar in hand
state = setupGameWithCard(state, 'Cellar');
```

**Execute**:
```typescript
// Play Cellar
let result = engine.executeMove(state, { type: 'play_action', card: 'Cellar' });
expect(result.newState.pendingEffect).toBeDefined();

// Generate options
const options = generateDiscardOptions(result.newState);

// User selects option 2 (discard 3 cards)
const selectedMove = options[1];
result = engine.executeMove(result.newState, selectedMove);
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.pendingEffect).toBeUndefined(); // Cleared
expect(result.newState.players[0].discardPile.length).toBe(3); // 3 cards discarded
expect(result.newState.players[0].hand.length).toBeGreaterThanOrEqual(3); // Drew 3
```

**Coverage**: AC-CLI-1, full workflow

---

#### IT-CLI-2: Remodel 2-step full flow

**Purpose**: Validate multi-step card completion

**Setup**:
```typescript
const engine = new GameEngine();
let state = setupGameWithCards(['Remodel', 'Estate', 'Copper']);
```

**Execute**:
```typescript
// Step 1: Play Remodel
let result = engine.executeMove(state, { type: 'play_action', card: 'Remodel' });
const trashOptions = generateRemodelTrashOptions(result.newState);

// User trashes Estate
result = engine.executeMove(result.newState, trashOptions[0]); // Trash Estate

// Step 2: Gain card
expect(result.newState.pendingEffect?.effect).toBe('gain_card');
const gainOptions = generateGainOptions(result.newState);

// User gains Smithy
const smithyOption = gainOptions.find(opt => opt.card === 'Smithy');
result = engine.executeMove(result.newState, smithyOption);
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.trash).toContain('Estate');
expect(result.newState.players[0].discardPile).toContain('Smithy');
expect(result.newState.pendingEffect).toBeUndefined(); // Fully resolved
```

**Coverage**: AC-CLI-5, multi-step workflow

---

#### IT-CLI-3: Multi-player Spy decisions

**Purpose**: Validate Spy works correctly with multiple players

**Setup**:
```typescript
const engine = new GameEngine();
let state = engine.initializeGame(2, 'spy-test');
state = setupGameWithCard(state, 'Spy');
```

**Execute**:
```typescript
// Play Spy
let result = engine.executeMove(state, { type: 'play_action', card: 'Spy' });

// Decision for Player 0
expect(result.newState.pendingEffect?.targetPlayer).toBe(0);
result = engine.executeMove(result.newState, {
  type: 'spy_decision',
  playerIndex: 0,
  choice: false
});

// Decision for Player 1
expect(result.newState.pendingEffect?.targetPlayer).toBe(1);
result = engine.executeMove(result.newState, {
  type: 'spy_decision',
  playerIndex: 1,
  choice: true
});
```

**Assert**:
```typescript
expect(result.success).toBe(true);
expect(result.newState.pendingEffect).toBeUndefined(); // All players resolved
expect(result.newState.players[0].discardPile.length).toBeGreaterThan(0); // P0 discarded
expect(result.newState.players[1].drawPile[0]).toBeDefined(); // P1 kept on top
```

**Coverage**: AC-CLI-8, multi-player interaction

---

#### IT-CLI-ERROR-1: Invalid selection shows error and re-prompts

**Purpose**: Validate error recovery UX

**Setup**:
```typescript
const state = createMockGameState({
  pendingEffect: { card: 'Workshop', effect: 'gain_card', maxGainCost: 4 }
});
const options = generateGainOptions(state);
```

**Execute**:
```typescript
const errorResult1 = parseUserSelection('99', options);
const errorResult2 = parseUserSelection('abc', options);
```

**Assert**:
```typescript
expect(errorResult1).toBeNull();
expect(errorResult2).toBeNull();

// In CLI, these would trigger re-prompt without state change
// (Tested in E2E with actual CLI interaction)
```

**Coverage**: AC-CLI-4, error handling

---

### End-to-End Tests

#### E2E-CLI-1: Full game using all 11 interactive cards

**Purpose**: Validate all interactive cards work in real game

**Setup**:
```typescript
const engine = new GameEngine();
const kingdomCards = [
  'Cellar', 'Chapel', 'Remodel', 'Mine', 'Workshop', 'Feast',
  'Library', 'Throne Room', 'Chancellor', 'Spy', 'Bureaucrat'
];
let state = engine.initializeGame(2, 'e2e-all-cards', { kingdomCards });
```

**Execute**:
```typescript
// Play through game, ensuring each interactive card is played at least once
const cardsPlayed = new Set<CardName>();

while (!checkVictory(state).isGameOver && cardsPlayed.size < 11) {
  // Acquire and play each interactive card
  for (const card of kingdomCards) {
    if (!cardsPlayed.has(card)) {
      state = acquireAndPlayCard(state, card);
      cardsPlayed.add(card);
    }
  }
}
```

**Assert**:
```typescript
expect(cardsPlayed.size).toBe(11); // All 11 cards played
kingdomCards.forEach(card => {
  expect(cardsPlayed).toContain(card);
});

// Verify no pendingEffect left unresolved
expect(state.pendingEffect).toBeUndefined();
```

**Coverage**: AC-CLI-2, AC-CLI-10, comprehensive validation

---

## Feature 3: Card Sorting Display

### Unit Tests

#### UT-SORT-1: Should sort by cost ascending

**Purpose**: Validate primary sort by cost

**Setup**:
```typescript
const cards = ['Province', 'Copper', 'Silver', 'Village', 'Gold', 'Estate'];
```

**Execute**:
```typescript
const sorted = sortCardsByCostAndName(cards);
```

**Assert**:
```typescript
expect(sorted).toEqual([
  'Copper',   // $0
  'Estate',   // $2
  'Village',  // $3
  'Silver',   // $3
  'Gold',     // $6
  'Province'  // $8
]);
```

**Coverage**: FR-SORT-1, AC-SORT-1

---

#### UT-SORT-2: Should sort alphabetically within cost tier

**Purpose**: Validate secondary sort by name

**Setup**:
```typescript
// All $4 cards
const cards = ['Smithy', 'Militia', 'Remodel', 'Bureaucrat', 'Feast'];
```

**Execute**:
```typescript
const sorted = sortCardsByCostAndName(cards);
```

**Assert**:
```typescript
expect(sorted).toEqual([
  'Bureaucrat',
  'Feast',
  'Militia',
  'Remodel',
  'Smithy'
]);
```

**Coverage**: FR-SORT-2, AC-SORT-1

---

#### UT-SORT-3: Should handle empty array

**Purpose**: Validate edge case

**Setup**:
```typescript
const cards: CardName[] = [];
```

**Execute**:
```typescript
const sorted = sortCardsByCostAndName(cards);
```

**Assert**:
```typescript
expect(sorted).toEqual([]);
```

**Coverage**: Edge case

---

#### UT-SORT-4: Should handle single card

**Purpose**: Validate edge case

**Setup**:
```typescript
const cards = ['Village'];
```

**Execute**:
```typescript
const sorted = sortCardsByCostAndName(cards);
```

**Assert**:
```typescript
expect(sorted).toEqual(['Village']);
```

**Coverage**: EC-SORT-4

---

#### UT-SORT-5: Should not mutate original array

**Purpose**: Validate functional programming practice

**Setup**:
```typescript
const cards = ['Province', 'Copper', 'Silver'];
const original = [...cards];
```

**Execute**:
```typescript
const sorted = sortCardsByCostAndName(cards);
```

**Assert**:
```typescript
expect(cards).toEqual(original); // Original unchanged
expect(sorted).not.toBe(cards); // New array
```

**Coverage**: Implementation quality

---

#### UT-SORT-6: Should complete in < 5ms

**Purpose**: Validate performance requirement

**Setup**:
```typescript
const allCards = getAllCards(); // ~32 cards
```

**Execute**:
```typescript
const startTime = performance.now();
const sorted = sortCardsByCostAndName(allCards);
const endTime = performance.now();
const duration = endTime - startTime;
```

**Assert**:
```typescript
expect(duration).toBeLessThan(5); // milliseconds
```

**Coverage**: NFR-SORT-1, AC-SORT-6

---

### Integration Tests

#### IT-SORT-1: Supply command shows sorted cards

**Purpose**: Validate CLI supply display uses sorting

**Setup**:
```typescript
const engine = new GameEngine();
const state = engine.initializeGame(1, 'sort-test');
const outputCapture = new OutputCapture();
```

**Execute**:
```typescript
displaySupply(state, outputCapture);
const output = outputCapture.getOutput();
```

**Assert**:
```typescript
expect(output).toContain('$0:');
expect(output).toContain('$2:');
expect(output).toContain('$3:');

// Verify Copper ($0) appears before Silver ($3)
const copperIndex = output.indexOf('Copper');
const silverIndex = output.indexOf('Silver');
expect(copperIndex).toBeLessThan(silverIndex);

// Verify cards within $4 tier are alphabetical
const fourDollarSection = output.match(/\$4:.*$/m)[0];
expect(fourDollarSection.indexOf('Bureaucrat')).toBeLessThan(fourDollarSection.indexOf('Smithy'));
```

**Coverage**: FR-SORT-3, AC-SORT-2

---

#### IT-SORT-2: Buy phase shows sorted options

**Purpose**: Validate buy options display sorting

**Setup**:
```typescript
const engine = new GameEngine();
let state = engine.initializeGame(1, 'buy-sort-test');
state = setBuyPhase(state, 5); // Player has 5 coins
const outputCapture = new OutputCapture();
```

**Execute**:
```typescript
displayBuyOptions(state, outputCapture);
const output = outputCapture.getOutput();
```

**Assert**:
```typescript
// Cards should be sorted by cost
const lines = output.split('\n');
const cardLines = lines.filter(line => line.includes('$'));

// Verify ascending cost order
for (let i = 0; i < cardLines.length - 1; i++) {
  const cost1 = parseInt(cardLines[i].match(/\$(\d+)/)[1]);
  const cost2 = parseInt(cardLines[i + 1].match(/\$(\d+)/)[1]);
  expect(cost1).toBeLessThanOrEqual(cost2);
}
```

**Coverage**: FR-SORT-3, AC-SORT-3

---

#### IT-SORT-3: All displays consistent

**Purpose**: Validate sorting is universal

**Setup**:
```typescript
const engine = new GameEngine();
const state = engine.initializeGame(1, 'consistency-test');
```

**Execute**:
```typescript
const supplyOutput = captureDisplay(() => displaySupply(state));
const buyOutput = captureDisplay(() => displayBuyOptions(state));
const handOutput = captureDisplay(() => displayHand(state));
```

**Assert**:
```typescript
// All displays should use same sort order
const supplyCards = extractCardOrder(supplyOutput);
const buyCards = extractCardOrder(buyOutput);

// Buy cards should be subset of supply cards in same order
const buyIndices = buyCards.map(card => supplyCards.indexOf(card));
for (let i = 0; i < buyIndices.length - 1; i++) {
  expect(buyIndices[i]).toBeLessThan(buyIndices[i + 1]);
}
```

**Coverage**: AC-SORT-5

---

### End-to-End Tests

#### E2E-SORT-1: Verify sorting throughout game

**Purpose**: Validate sorting consistency in real gameplay

**Setup**:
```typescript
const engine = new GameEngine();
let state = engine.initializeGame(1, 'e2e-sort-test');
```

**Execute**:
```typescript
// Play through several turns, capturing display output
const displayOutputs: string[] = [];

for (let turn = 0; turn < 5; turn++) {
  displayOutputs.push(captureDisplay(() => displaySupply(state)));
  state = playAITurn(state);
}
```

**Assert**:
```typescript
// All outputs should show consistent sorting
displayOutputs.forEach(output => {
  const cardOrder = extractCardOrder(output);
  const costs = cardOrder.map(card => getCard(card).cost);

  // Verify ascending cost order
  for (let i = 0; i < costs.length - 1; i++) {
    expect(costs[i]).toBeLessThanOrEqual(costs[i + 1]);
  }
});
```

**Coverage**: AC-SORT-4, AC-SORT-5, AC-SORT-7

---

## Regression Testing

### Phase 1-4 Test Suites

**Requirement**: ALL existing tests must pass (100% regression)

**Test Suites**:
- Phase 1: 121 tests (core game mechanics)
- Phase 2: MCP server tests
- Phase 3: 105 tests (multiplayer, AI)
- Phase 4: 92 tests (complete card set)

**Validation**:
```bash
npm run test
```

**Expected**:
```
Test Suites: 45 passed, 45 total
Tests:       318 passed, 318 total
Coverage:    95.2%
```

**Coverage**: AC-RKS-7, AC-CLI-10, AC-SORT-7

---

## Performance Testing

### Benchmarks

#### PERF-RKS-1: Kingdom Selection Performance

**Target**: < 10ms

**Test**:
```typescript
const iterations = 100;
const times: number[] = [];

for (let i = 0; i < iterations; i++) {
  const start = performance.now();
  engine.initializeGame(1, `seed-${i}`);
  const end = performance.now();
  times.push(end - start);
}

const avg = times.reduce((a, b) => a + b) / times.length;
expect(avg).toBeLessThan(10);
```

**Coverage**: AC-RKS-8

---

#### PERF-CLI-1: Option Generation Performance

**Target**: < 50ms (worst case: Cellar with 5 cards = 31 combinations)

**Test**:
```typescript
const state = createMockGameState({
  currentPlayerHand: ['Card1', 'Card2', 'Card3', 'Card4', 'Card5'],
  pendingEffect: { card: 'Cellar', effect: 'discard_for_cellar' }
});

const start = performance.now();
const options = generateDiscardOptions(state);
const end = performance.now();

expect(end - start).toBeLessThan(50);
expect(options.length).toBe(31); // 2^5 - 1 combinations
```

**Coverage**: AC-CLI-11

---

#### PERF-SORT-1: Card Sorting Performance

**Target**: < 5ms

**Test**:
```typescript
const allCards = getAllCards(); // ~32 cards

const start = performance.now();
const sorted = sortCardsByCostAndName(allCards);
const end = performance.now();

expect(end - start).toBeLessThan(5);
```

**Coverage**: AC-SORT-6

---

## Test Data

### Mock Game States

```typescript
function createMockGameState(overrides: Partial<GameState>): GameState {
  return {
    players: [
      {
        drawPile: overrides.player0DrawPile || [],
        hand: overrides.player0Hand || [],
        discardPile: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0
      }
    ],
    supply: overrides.supply || createDefaultSupply(),
    currentPlayer: 0,
    phase: overrides.phase || 'action',
    turnNumber: 1,
    seed: 'test-seed',
    gameLog: [],
    trash: overrides.trash || [],
    pendingEffect: overrides.pendingEffect
  };
}
```

### Helper Functions

```typescript
function extractKingdomCards(state: GameState): CardName[] {
  return Array.from(state.supply.keys())
    .filter(card => !isBasicCard(card) && card !== 'Curse');
}

function getAllKingdomCards(): CardName[] {
  return Object.keys(KINGDOM_CARDS);
}

function isBasicCard(card: CardName): boolean {
  return ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province'].includes(card);
}

function isTreasure(card: CardName): boolean {
  return getCard(card).type === 'treasure';
}
```

---

## Traceability Matrix

| Requirement | Unit Tests | Integration Tests | E2E Tests | Status |
|-------------|-----------|-------------------|-----------|--------|
| FR-RKS-1 | UT-RKS-1, UT-RKS-5 | IT-RKS-1 | E2E-RKS-1 | ⏳ Pending |
| FR-RKS-2 | UT-RKS-2, UT-RKS-3 | IT-RKS-1 | E2E-RKS-1 | ⏳ Pending |
| FR-RKS-3 | UT-RKS-6 | - | E2E-RKS-1 | ⏳ Pending |
| FR-RKS-4 | - | IT-RKS-2 | E2E-RKS-1 | ⏳ Pending |
| FR-RKS-5 | UT-RKS-4 | IT-RKS-3 | - | ⏳ Pending |
| FR-RKS-6 | UT-RKS-1, UT-RKS-8 | - | - | ⏳ Pending |
| FR-CLI-1 | UT-CLI-CELLAR-1, ... | IT-CLI-1 | E2E-CLI-1 | ⏳ Pending |
| FR-CLI-2 | UT-CLI-CELLAR-1, ... | IT-CLI-1 | E2E-CLI-1 | ⏳ Pending |
| FR-CLI-3 | UT-CLI-CELLAR-3 | IT-CLI-1 | E2E-CLI-1 | ⏳ Pending |
| FR-CLI-4 | UT-CLI-INPUT-1, UT-CLI-INPUT-2 | IT-CLI-ERROR-1 | E2E-CLI-1 | ⏳ Pending |
| FR-CLI-5 | UT-CLI-CELLAR-2, UT-CLI-REMODEL-2, ... | IT-CLI-1, IT-CLI-2, IT-CLI-3 | E2E-CLI-1 | ⏳ Pending |
| FR-CLI-6 | All card-specific UT-CLI-* | All IT-CLI-* | E2E-CLI-1 | ⏳ Pending |
| FR-CLI-7 | - | - | Regression tests | ⏳ Pending |
| FR-SORT-1 | UT-SORT-1 | IT-SORT-1 | E2E-SORT-1 | ⏳ Pending |
| FR-SORT-2 | UT-SORT-2 | IT-SORT-1 | E2E-SORT-1 | ⏳ Pending |
| FR-SORT-3 | - | IT-SORT-1, IT-SORT-2 | E2E-SORT-1 | ⏳ Pending |
| FR-SORT-4 | UT-SORT-1 | IT-SORT-1 | E2E-SORT-1 | ⏳ Pending |
| FR-SORT-5 | - | - | Regression tests | ⏳ Pending |

---

## Test Execution Plan

### Phase 1: Feature 1 (Random Kingdom)
1. Write UT-RKS-1 through UT-RKS-8 (2 hours)
2. Write IT-RKS-1 through IT-RKS-3 (1 hour)
3. Write E2E-RKS-1 (30 minutes)
4. **All tests RED** (fail)
5. Begin implementation (dev-agent)

### Phase 2: Feature 3 (Card Sorting)
1. Write UT-SORT-1 through UT-SORT-6 (1 hour)
2. Write IT-SORT-1 through IT-SORT-3 (30 minutes)
3. Write E2E-SORT-1 (30 minutes)
4. **All tests RED** (fail)
5. Begin implementation (dev-agent)

### Phase 3: Feature 2 (CLI Prompts) - Incremental
1. **Cellar**: Write UT-CLI-CELLAR-1 through UT-CLI-CELLAR-3, IT-CLI-1 (1 hour)
2. **Chapel**: Write UT-CLI-CHAPEL-1 through UT-CLI-CHAPEL-2 (30 minutes)
3. **Remodel**: Write UT-CLI-REMODEL-1 through UT-CLI-REMODEL-2 (30 minutes)
4. **Mine**: Write UT-CLI-MINE-1 through UT-CLI-MINE-2 (30 minutes)
5. **Workshop/Feast**: Write UT-CLI-WORKSHOP-1, UT-CLI-FEAST-1 (30 minutes)
6. **Library**: Write UT-CLI-LIBRARY-1 (30 minutes)
7. **Throne Room**: Write UT-CLI-THRONE-1 through UT-CLI-THRONE-2 (30 minutes)
8. **Chancellor**: Write UT-CLI-CHANCELLOR-1 through UT-CLI-CHANCELLOR-2 (30 minutes)
9. **Spy**: Write UT-CLI-SPY-1, IT-CLI-3 (30 minutes)
10. **Bureaucrat**: Write UT-CLI-BUREAUCRAT-1 (30 minutes)
11. **Input parsing**: Write UT-CLI-INPUT-1, UT-CLI-INPUT-2 (30 minutes)
12. **E2E**: Write E2E-CLI-1 (1 hour)
13. **All tests RED** (fail)
14. Begin implementation (dev-agent, card by card)

### Phase 4: Integration & Regression
1. Run all Phase 1-4 tests (validate 100% pass)
2. Run new Phase 4.1 tests (validate GREEN)
3. Performance benchmarks
4. Coverage report (validate ≥ 95%)

---

## Success Criteria

Phase 4.1 testing is **COMPLETE** when:

✅ **All new tests written** (before implementation):
- 8 unit tests for Feature 1 (Random Kingdom)
- 3 integration tests for Feature 1
- 1 E2E test for Feature 1
- 6 unit tests for Feature 3 (Card Sorting)
- 3 integration tests for Feature 3
- 1 E2E test for Feature 3
- 25+ unit tests for Feature 2 (CLI Prompts, all 11 cards)
- 4+ integration tests for Feature 2
- 1 E2E test for Feature 2

✅ **All tests initially RED** (validates tests are meaningful)

✅ **All tests GREEN after implementation** (100% pass rate)

✅ **Regression tests pass** (100% of Phase 1-4 tests)

✅ **Coverage targets met** (≥ 95% code coverage)

✅ **Performance targets met**:
- Kingdom selection < 10ms
- Option generation < 50ms
- Card sorting < 5ms

---

**Document Status**: DRAFT - Ready for test implementation

**Next Steps**:
1. Review and approve test specifications
2. Begin test-architect work (write tests in RED phase)
3. Validate all tests fail (RED confirmation)
4. Begin dev-agent work (implementation to make tests GREEN)
5. Regression validation
6. Coverage and performance validation

**Estimated Effort**: 4-5 hours for test specification (test-architect)
