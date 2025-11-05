# Phase 4.2 Technical Specification: MCP Interactive Card Decisions

**Status**: DRAFT
**Created**: 2025-11-05
**Last-Updated**: 2025-11-05
**Owner**: requirements-architect
**Phase**: 4.2

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Structure](#module-structure)
3. [Data Structures](#data-structures)
4. [Implementation Guidance](#implementation-guidance)
5. [Integration Points](#integration-points)
6. [Algorithm Specifications](#algorithm-specifications)
7. [Error Handling](#error-handling)
8. [Performance Considerations](#performance-considerations)
9. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACES                         │
├──────────────────────┬──────────────────────────────────────┤
│  CLI (Human Players) │  MCP (AI Agents)                     │
│  packages/cli/       │  packages/mcp-server/                │
│                      │                                       │
│  display.ts          │  tools/game-execute.ts               │
│  ↓ Formats for       │  ↓ Formats for                       │
│    human display     │    AI structured response            │
└──────────────────────┴──────────────────────────────────────┘
                              ↑
                              │ Both call
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            SHARED PRESENTATION LAYER                         │
│            packages/core/src/presentation/                   │
│                                                              │
│  move-options.ts  (NEW MODULE)                              │
│  ├─ generateMoveOptions() - Main dispatcher                 │
│  ├─ generateCellarOptions() - Card-specific generators      │
│  ├─ generateChapelOptions()                                 │
│  ├─ ... (11 card generators)                                │
│  └─ formatMoveCommand() - Helper functions                  │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ Uses
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  GAME ENGINE & CORE                          │
│                  packages/core/src/                          │
│                                                              │
│  game.ts       - Game engine, getValidMoves()               │
│  types.ts      - GameState, Move, pendingEffect             │
│  cards.ts      - Card definitions                           │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

**1. Single Responsibility**: Each module has one clear purpose
- Core: Game logic and state management
- Presentation: Generate options and format for display
- CLI: Human-readable formatting and terminal I/O
- MCP: AI-readable structured responses and network I/O

**2. Dependency Inversion**: High-level modules don't depend on low-level details
- CLI and MCP depend on shared presentation layer
- Presentation layer depends on core types, not on UI details
- Core doesn't know about presentation, CLI, or MCP

**3. Open/Closed**: Open for extension, closed for modification
- Adding new interactive cards: Add generator function to move-options.ts
- Existing code (CLI, MCP) doesn't need changes
- New card types automatically work if they follow pattern

**4. DRY (Don't Repeat Yourself)**: One source of truth
- Option generation logic exists once in shared layer
- CLI and MCP reuse that logic
- Bug fixes benefit both interfaces

---

## Module Structure

### New Module: `packages/core/src/presentation/move-options.ts`

**Purpose**: Generate structured move options for interactive cards

**Exports**:
```typescript
// Data structures
export interface MoveOption { ... }
export interface MoveOptionGenerationContext { ... }

// Main dispatcher
export function generateMoveOptions(
  state: GameState,
  validMoves: readonly Move[]
): MoveOption[]

// Card-specific generators
export function generateCellarOptions(hand: readonly CardName[]): MoveOption[]
export function generateChapelOptions(hand: readonly CardName[], maxTrash: number): MoveOption[]
export function generateRemodelStep1Options(hand: readonly CardName[]): MoveOption[]
export function generateRemodelStep2Options(maxCost: number, supply: ReadonlyMap<CardName, number>): MoveOption[]
export function generateMineStep1Options(hand: readonly CardName[]): MoveOption[]
export function generateMineStep2Options(maxCost: number, supply: ReadonlyMap<CardName, number>): MoveOption[]
export function generateWorkshopOptions(supply: ReadonlyMap<CardName, number>, maxCost: number): MoveOption[]
export function generateFeastOptions(supply: ReadonlyMap<CardName, number>, maxCost: number): MoveOption[]
export function generateLibraryOptions(card: CardName): MoveOption[]
export function generateThroneRoomOptions(hand: readonly CardName[]): MoveOption[]
export function generateChancellorOptions(deckSize: number): MoveOption[]
export function generateSpyOptions(card: CardName, playerIndex: number): MoveOption[]
export function generateBureaucratOptions(hand: readonly CardName[]): MoveOption[]

// Helper functions
export function formatMoveCommand(move: Move): string
export function getCombinations<T>(arr: readonly T[], maxSize: number): ReadonlyArray<ReadonlyArray<T>>
export function formatCardList(cards: readonly CardName[]): string
```

**File Structure**:
```typescript
// move-options.ts

import { CardName, Move, GameState, Supply } from '../types';
import { getCard, isTreasureCard, isActionCard, isVictoryCard } from '../cards';

// ============================================================
// DATA STRUCTURES
// ============================================================

export interface MoveOption {
  index: number;                   // 1-based sequential
  move: Move;                      // Executable Move object
  description: string;             // Human-readable description
  cardNames?: readonly CardName[]; // Cards involved
  details?: Record<string, any>;   // Additional metadata
}

// ============================================================
// MAIN DISPATCHER
// ============================================================

export function generateMoveOptions(
  state: GameState,
  validMoves: readonly Move[]
): MoveOption[] {
  const pendingEffect = state.pendingEffect;
  if (!pendingEffect) {
    return []; // No pending effect, no options to generate
  }

  const player = state.players[state.currentPlayer];

  // Dispatch to appropriate generator based on effect type
  switch (pendingEffect.effect) {
    case 'discard_for_cellar':
      return generateCellarOptions(player.hand);

    case 'trash_cards':
      return generateChapelOptions(player.hand, pendingEffect.maxTrash || 4);

    case 'trash_for_remodel':
      return generateRemodelStep1Options(player.hand);

    case 'gain_card':
      if (pendingEffect.card === 'Remodel') {
        return generateRemodelStep2Options(pendingEffect.maxGainCost || 0, state.supply);
      } else if (pendingEffect.card === 'Mine') {
        return generateMineStep2Options(pendingEffect.maxGainCost || 0, state.supply);
      } else if (pendingEffect.card === 'Workshop') {
        return generateWorkshopOptions(state.supply, 4);
      } else if (pendingEffect.card === 'Feast') {
        return generateFeastOptions(state.supply, 5);
      }
      return [];

    case 'select_treasure_to_trash':
      return generateMineStep1Options(player.hand);

    case 'library_set_aside':
      // Card to consider is in pendingEffect context
      const cardToSetAside = pendingEffect.card; // Or other context
      return generateLibraryOptions(cardToSetAside);

    case 'select_action_for_throne':
      return generateThroneRoomOptions(player.hand);

    case 'chancellor_decision':
      return generateChancellorOptions(player.drawPile.length);

    case 'spy_decision':
      const revealedCard = pendingEffect.revealedCard || 'Unknown';
      const targetPlayer = pendingEffect.targetPlayer || 0;
      return generateSpyOptions(revealedCard, targetPlayer);

    case 'reveal_and_topdeck':
      return generateBureaucratOptions(player.hand);

    default:
      return []; // Unknown effect type
  }
}

// ============================================================
// CARD-SPECIFIC GENERATORS
// ============================================================

export function generateCellarOptions(hand: readonly CardName[]): MoveOption[] {
  // Implementation details below
}

export function generateChapelOptions(hand: readonly CardName[], maxTrash: number): MoveOption[] {
  // Implementation details below
}

// ... (all other generators)

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function formatMoveCommand(move: Move): string {
  switch (move.type) {
    case 'discard_for_cellar':
      return move.cards && move.cards.length > 0
        ? `discard_for_cellar ${move.cards.join(',')}`
        : 'discard_for_cellar';

    case 'trash_cards':
      return move.cards && move.cards.length > 0
        ? `trash_cards ${move.cards.join(',')}`
        : 'trash_cards';

    case 'trash_for_remodel':
      return `trash_for_remodel ${move.card}`;

    case 'gain_card':
      return `gain_card ${move.card}`;

    // ... (all move types)

    default:
      return move.type;
  }
}

export function getCombinations<T>(
  arr: readonly T[],
  maxSize: number
): ReadonlyArray<ReadonlyArray<T>> {
  // Implementation: Generate all combinations up to maxSize
  // See "Algorithm Specifications" section below
}

export function formatCardList(cards: readonly CardName[]): string {
  return cards.join(', ');
}
```

---

## Data Structures

### MoveOption Interface

```typescript
export interface MoveOption {
  /**
   * Sequential index (1-based) for option selection
   * Used by CLI for numbered menu, by MCP for numeric selection
   */
  index: number;

  /**
   * Executable Move object
   * Can be passed directly to GameEngine.executeMove()
   */
  move: Move;

  /**
   * Human-readable description of what this option does
   * Examples:
   *   - "Discard: Copper, Copper, Estate (draw 3)"
   *   - "Trash: Copper ($0) → Can gain up to $2"
   *   - "Gain: Smithy ($4)"
   */
  description: string;

  /**
   * Cards involved in this move (optional)
   * Used for detailed display or filtering
   * Examples:
   *   - ['Copper', 'Copper', 'Estate'] for discard option
   *   - ['Smithy'] for gain option
   */
  cardNames?: readonly CardName[];

  /**
   * Additional metadata for context (optional)
   * Examples:
   *   - { drawCount: 3, trashCount: 4 }
   *   - { gainCost: 4, maxGainCost: 4 }
   *   - { action: 'set_aside', player: 1 }
   */
  details?: Record<string, any>;
}
```

### Usage Example

```typescript
const options: MoveOption[] = [
  {
    index: 1,
    move: { type: 'discard_for_cellar', cards: ['Copper', 'Copper', 'Estate'] },
    description: "Discard: Copper, Copper, Estate (draw 3)",
    cardNames: ['Copper', 'Copper', 'Estate'],
    details: { drawCount: 3 }
  },
  {
    index: 2,
    move: { type: 'discard_for_cellar', cards: ['Copper', 'Copper'] },
    description: "Discard: Copper, Copper (draw 2)",
    cardNames: ['Copper', 'Copper'],
    details: { drawCount: 2 }
  },
  {
    index: 3,
    move: { type: 'discard_for_cellar', cards: [] },
    description: "Discard nothing (draw 0)",
    cardNames: [],
    details: { drawCount: 0 }
  }
];

// CLI usage
options.forEach(opt => {
  console.log(`  [${opt.index}] ${opt.description}`);
});

// MCP usage
return {
  success: true,
  pendingEffect: {
    card: 'Cellar',
    effect: 'discard_for_cellar',
    options: options.map(opt => ({
      index: opt.index,
      description: opt.description,
      command: formatMoveCommand(opt.move)
    }))
  }
};
```

---

## Implementation Guidance

### Step-by-Step Implementation Plan

#### Phase 1: Core Infrastructure (5h)
1. Create `move-options.ts` file with structure
2. Implement `MoveOption` interface
3. Implement `generateMoveOptions()` dispatcher
4. Implement helper functions:
   - `formatMoveCommand()`
   - `getCombinations()`
   - `formatCardList()`
5. Write unit tests for helpers

#### Phase 2: Simple Cards (10h)
6. Implement `generateCellarOptions()`
7. Write unit tests for Cellar
8. Implement `generateChapelOptions()`
9. Write unit tests for Chapel
10. Implement `generateWorkshopOptions()`
11. Write unit tests for Workshop
12. Implement `generateFeastOptions()`
13. Write unit tests for Feast
14. Implement `generateChancellorOptions()`
15. Write unit tests for Chancellor

#### Phase 3: Medium Cards (12h)
16. Implement `generateRemodelStep1Options()`
17. Implement `generateRemodelStep2Options()`
18. Write unit tests for Remodel (both steps)
19. Implement `generateMineStep1Options()`
20. Implement `generateMineStep2Options()`
21. Write unit tests for Mine (both steps)
22. Implement `generateThroneRoomOptions()`
23. Write unit tests for Throne Room

#### Phase 4: Complex Cards (18h)
24. Implement `generateLibraryOptions()`
25. Write unit tests for Library
26. Implement `generateSpyOptions()`
27. Write unit tests for Spy
28. Implement `generateBureaucratOptions()`
29. Write unit tests for Bureaucrat

#### Phase 5: Integration (10h)
30. Refactor CLI to use shared layer
31. Update MCP to return pendingEffect
32. Write integration tests (CLI)
33. Write integration tests (MCP)
34. Write E2E tests

#### Phase 6: Polish (5h)
35. Performance optimization
36. Error handling improvements
37. Documentation updates
38. Code review and refactoring

**Total**: ~60 hours (includes testing)

---

### Card-Specific Implementation Details

#### Cellar Implementation

```typescript
export function generateCellarOptions(hand: readonly CardName[]): MoveOption[] {
  if (hand.length === 0) {
    // Edge case: empty hand
    return [
      {
        index: 1,
        move: { type: 'discard_for_cellar', cards: [] },
        description: "Discard nothing (draw 0)",
        cardNames: [],
        details: { drawCount: 0 }
      }
    ];
  }

  // Generate all combinations of cards (1 to hand.length)
  const allCombinations = getCombinations(hand, hand.length);

  // Create MoveOption for each combination
  const options: MoveOption[] = allCombinations.map((cards, idx) => {
    const cardList = Array.from(cards); // Convert readonly to mutable for Move
    return {
      index: idx + 1,
      move: { type: 'discard_for_cellar', cards: cardList },
      description: cardList.length > 0
        ? `Discard: ${formatCardList(cardList)} (draw ${cardList.length})`
        : "Discard nothing (draw 0)",
      cardNames: cardList,
      details: { drawCount: cardList.length }
    };
  });

  // Sort by number of cards descending (most discard first)
  options.sort((a, b) => {
    const aCount = a.cardNames?.length || 0;
    const bCount = b.cardNames?.length || 0;
    return bCount - aCount;
  });

  // Re-index after sorting
  options.forEach((opt, idx) => {
    opt.index = idx + 1;
  });

  return options;
}
```

#### Remodel Implementation

```typescript
export function generateRemodelStep1Options(hand: readonly CardName[]): MoveOption[] {
  if (hand.length === 0) {
    return [
      {
        index: 1,
        move: { type: 'trash_for_remodel', card: null },
        description: "No cards to trash",
        cardNames: [],
        details: { action: 'skip' }
      }
    ];
  }

  return hand.map((card, idx) => {
    const cardDef = getCard(card);
    const maxGainCost = cardDef.cost + 2;

    return {
      index: idx + 1,
      move: { type: 'trash_for_remodel', card },
      description: `Trash: ${card} ($${cardDef.cost}) → Can gain up to $${maxGainCost}`,
      cardNames: [card],
      details: { trashCost: cardDef.cost, maxGainCost }
    };
  });
}

export function generateRemodelStep2Options(
  maxCost: number,
  supply: ReadonlyMap<CardName, number>
): MoveOption[] {
  const availableCards: Array<{ name: CardName; cost: number }> = [];

  // Find all cards in supply with cost <= maxCost
  supply.forEach((quantity, cardName) => {
    if (quantity > 0) { // Only available cards
      const cardDef = getCard(cardName);
      if (cardDef.cost <= maxCost) {
        availableCards.push({ name: cardName, cost: cardDef.cost });
      }
    }
  });

  if (availableCards.length === 0) {
    return [
      {
        index: 1,
        move: { type: 'gain_card', card: null },
        description: "No cards available to gain",
        cardNames: [],
        details: { action: 'skip' }
      }
    ];
  }

  // Sort by cost descending, then alphabetically
  availableCards.sort((a, b) => {
    if (a.cost !== b.cost) {
      return b.cost - a.cost; // Higher cost first
    }
    return a.name.localeCompare(b.name); // Alphabetical
  });

  return availableCards.map((card, idx) => ({
    index: idx + 1,
    move: { type: 'gain_card', card: card.name },
    description: `Gain: ${card.name} ($${card.cost})`,
    cardNames: [card.name],
    details: { gainCost: card.cost, maxGainCost: maxCost }
  }));
}
```

#### Library Implementation

```typescript
export function generateLibraryOptions(card: CardName): MoveOption[] {
  // Binary choice: set aside or keep
  return [
    {
      index: 1,
      move: { type: 'library_set_aside', cards: [card], choice: true },
      description: `Set aside: ${card} (skip it, discard at end)`,
      cardNames: [card],
      details: { action: 'set_aside' }
    },
    {
      index: 2,
      move: { type: 'library_set_aside', cards: [card], choice: false },
      description: `Keep: ${card} in hand`,
      cardNames: [card],
      details: { action: 'keep' }
    }
  ];
}
```

---

## Integration Points

### CLI Integration

**File**: `packages/cli/src/display.ts`

**Changes**:
```typescript
import { generateMoveOptions, MoveOption } from '@principality/core';

/**
 * Display interactive prompt for pending effects
 * REFACTORED to use shared presentation layer
 */
displayPendingEffectPrompt(state: GameState, validMoves: Move[]): void {
  const pendingEffect = state.pendingEffect;
  if (!pendingEffect) {
    return;
  }

  // Get structured options from SHARED LAYER
  const options: MoveOption[] = generateMoveOptions(state, validMoves);

  if (options.length === 0) {
    console.log("No options available for pending effect");
    return;
  }

  // Display card effect description
  const player = state.players[state.currentPlayer];
  const card = getCard(pendingEffect.card);

  console.log(`\n✓ Player ${state.currentPlayer + 1} played ${pendingEffect.card}`);
  console.log(`Effect: ${card.description}\n`);

  // Display card-specific header
  this.displayPromptHeader(pendingEffect);

  // Display options using shared data
  options.forEach(opt => {
    console.log(`  [${opt.index}] ${opt.description}`);
  });

  console.log('');
}

/**
 * Display card-specific prompt headers
 */
private displayPromptHeader(pendingEffect: PendingEffect): void {
  switch (pendingEffect.effect) {
    case 'discard_for_cellar':
      console.log('Choose cards to discard:');
      break;
    case 'trash_cards':
      console.log(`Choose cards to trash (up to ${pendingEffect.maxTrash || 4}):`);
      break;
    case 'trash_for_remodel':
      console.log('Step 1: Choose card to trash:');
      break;
    case 'gain_card':
      if (pendingEffect.card === 'Remodel') {
        console.log(`Step 2: Choose card to gain (up to $${pendingEffect.maxGainCost}):`);
      } else if (pendingEffect.card === 'Mine') {
        console.log(`Step 2: Choose treasure to gain to hand (up to $${pendingEffect.maxGainCost}):`);
      } else if (pendingEffect.card === 'Workshop') {
        console.log('Choose card to gain (up to $4):');
      } else if (pendingEffect.card === 'Feast') {
        console.log('Choose card to gain (up to $5):');
      }
      break;
    // ... (other cases)
  }
}
```

**Testing Strategy**:
- Run all Phase 4.1 Feature 2 tests
- Verify behavior is identical
- Check option numbering consistency

---

### MCP Integration

**File**: `packages/mcp-server/src/tools/game-execute.ts`

**Changes**:
```typescript
import { generateMoveOptions, formatMoveCommand, MoveOption } from '@principality/core';

async execute(request: GameExecuteRequest): Promise<GameExecuteResponse> {
  // ... existing validation and execution logic ...

  const result = this.gameEngine.executeMove(state, parsedMove);

  if (!result.success) {
    // ... existing error handling ...
  }

  // Update server state
  if (result.newState) {
    this.setState(result.newState);
  }

  // *** NEW: Detect pending effect ***
  const finalState = result.newState || state;
  if (finalState.pendingEffect) {
    return this.handlePendingEffect(finalState);
  }

  // ... existing success response logic ...
}

/**
 * Handle pending effect by generating structured options for AI agent
 * NEW METHOD
 */
private handlePendingEffect(state: GameState): GameExecuteResponse {
  const pendingEffect = state.pendingEffect!;
  const validMoves = this.gameEngine.getValidMoves(state);

  // Generate options using SHARED LAYER
  const options: MoveOption[] = generateMoveOptions(state, validMoves);

  if (options.length === 0) {
    // No options means auto-skip or error
    return {
      success: false,
      error: {
        message: "Pending effect has no valid options",
        suggestion: "This may indicate a game engine issue"
      }
    };
  }

  // Format options for MCP response
  const formattedOptions = options.map(opt => ({
    index: opt.index,
    description: opt.description,
    command: formatMoveCommand(opt.move)
  }));

  // Determine step number for multi-step cards
  const step = this.getStepNumber(pendingEffect);

  // Build response message
  const message = step !== null
    ? `${pendingEffect.card} - Step ${step}: ${this.getStepDescription(pendingEffect)}`
    : `Card requires choice: ${pendingEffect.card}`;

  return {
    success: true,
    message,
    pendingEffect: {
      card: pendingEffect.card,
      effect: pendingEffect.effect,
      step,
      options: formattedOptions
    },
    gameState: this.formatStateForAutoReturn(state),
    validMoves: validMoves.map(move => formatMoveCommand(move)),
    gameOver: isGameOver(state)
  };
}

/**
 * Determine step number for multi-step cards
 * NEW METHOD
 */
private getStepNumber(pendingEffect: PendingEffect): number | null {
  // Remodel: Step 1 = trash_for_remodel, Step 2 = gain_card
  if (pendingEffect.card === 'Remodel') {
    return pendingEffect.effect === 'trash_for_remodel' ? 1 : 2;
  }

  // Mine: Step 1 = select_treasure_to_trash, Step 2 = gain_card
  if (pendingEffect.card === 'Mine') {
    return pendingEffect.effect === 'select_treasure_to_trash' ? 1 : 2;
  }

  // Single-step cards: no step number
  return null;
}

/**
 * Get human-readable description for step
 * NEW METHOD
 */
private getStepDescription(pendingEffect: PendingEffect): string {
  switch (pendingEffect.effect) {
    case 'discard_for_cellar':
      return 'Choose cards to discard';
    case 'trash_cards':
      return `Choose cards to trash (up to ${pendingEffect.maxTrash || 4})`;
    case 'trash_for_remodel':
      return 'Choose card to trash';
    case 'select_treasure_to_trash':
      return 'Choose treasure to trash';
    case 'gain_card':
      if (pendingEffect.card === 'Remodel' || pendingEffect.card === 'Mine') {
        return `Choose card to gain (up to $${pendingEffect.maxGainCost})`;
      } else if (pendingEffect.card === 'Workshop') {
        return 'Choose card to gain (up to $4)';
      } else if (pendingEffect.card === 'Feast') {
        return 'Choose card to gain (up to $5)';
      }
      return 'Choose card to gain';
    // ... (other cases)
    default:
      return 'Make a choice';
  }
}
```

**Testing Strategy**:
- Unit test `handlePendingEffect()`
- Integration test with each card
- E2E test full card workflows

---

## Algorithm Specifications

### Combination Generation

**Purpose**: Generate all combinations of items from an array

**Algorithm**: Iterative bit-masking approach (efficient, no recursion)

```typescript
export function getCombinations<T>(
  arr: readonly T[],
  maxSize: number
): ReadonlyArray<ReadonlyArray<T>> {
  const n = arr.length;
  const combinations: T[][] = [];

  // Edge case: empty array
  if (n === 0) {
    return [[]]; // Empty combination
  }

  // Limit maxSize to array length
  const effectiveMaxSize = Math.min(maxSize, n);

  // Generate all combinations using bit-masking
  // For n items, there are 2^n combinations (including empty)
  const totalCombinations = Math.pow(2, n);

  for (let mask = 0; mask < totalCombinations; mask++) {
    const combination: T[] = [];

    for (let i = 0; i < n; i++) {
      // Check if bit i is set in mask
      if ((mask & (1 << i)) !== 0) {
        combination.push(arr[i]);
      }
    }

    // Only include combinations up to maxSize
    if (combination.length <= effectiveMaxSize) {
      combinations.push(combination);
    }
  }

  return combinations;
}
```

**Complexity**:
- **Time**: O(2^n) where n = array length
- **Space**: O(2^n) for storing combinations

**Optimization for Large Hands**:
```typescript
export function getCombinations<T>(
  arr: readonly T[],
  maxSize: number
): ReadonlyArray<ReadonlyArray<T>> {
  const n = arr.length;

  // Performance safeguard: limit to reasonable size
  if (n > 10) {
    console.warn(`getCombinations: Array size ${n} exceeds recommended limit (10). Performance may be impacted.`);
    // Could limit to smaller maxSize or use sampling
  }

  // ... (rest of implementation)
}
```

**Performance Benchmarks**:
- n=5: 32 combinations, <1ms
- n=7: 128 combinations, ~2ms
- n=10: 1024 combinations, ~10ms
- n=15: 32768 combinations, ~300ms (too slow!)

**Recommendation**: For Cellar/Chapel, limit hand size consideration to 10 cards max. For larger hands, use heuristic or sampling.

---

### Option Sorting

**Purpose**: Sort options in intuitive order for humans and AI

**Algorithm**:
```typescript
function sortOptions(options: MoveOption[]): void {
  // Sort by number of cards involved (descending)
  options.sort((a, b) => {
    const aCount = a.cardNames?.length || 0;
    const bCount = b.cardNames?.length || 0;

    if (aCount !== bCount) {
      return bCount - aCount; // More cards first
    }

    // Secondary sort: alphabetically by description
    return a.description.localeCompare(b.description);
  });

  // Re-index after sorting
  options.forEach((opt, idx) => {
    opt.index = idx + 1;
  });
}
```

**Rationale**:
- Most discard first (more aggressive options)
- "Discard nothing" last (conservative option)
- Predictable ordering for testing

---

## Error Handling

### Error Scenarios and Handling

**1. Empty Hand Scenarios**
```typescript
// Cellar with empty hand
if (hand.length === 0) {
  return [
    {
      index: 1,
      move: { type: 'discard_for_cellar', cards: [] },
      description: "No cards to discard",
      cardNames: [],
      details: { action: 'skip' }
    }
  ];
}
```

**2. No Valid Options**
```typescript
// Workshop with no cards ≤ $4
if (availableCards.length === 0) {
  return [
    {
      index: 1,
      move: { type: 'gain_card', card: null },
      description: "No cards available to gain",
      cardNames: [],
      details: { action: 'skip', reason: 'empty_supply' }
    }
  ];
}
```

**3. Invalid Pending Effect**
```typescript
// Unknown effect type
default:
  console.warn(`generateMoveOptions: Unknown effect type: ${pendingEffect.effect}`);
  return []; // Empty array signals error to caller
```

**4. MCP Numeric Selection Out of Range**
```typescript
// In MCP tool
const selection = parseInt(input, 10);
if (isNaN(selection) || selection < 1 || selection > options.length) {
  return {
    success: false,
    error: {
      message: `Invalid selection: ${input}. Valid range is 1-${options.length}.`,
      suggestion: `Choose a number between 1 and ${options.length}, or use a move command.`
    }
  };
}
```

**5. Option Limit Exceeded**
```typescript
// In MCP tool
const MAX_DISPLAYED_OPTIONS = 50;

if (options.length > MAX_DISPLAYED_OPTIONS) {
  const displayedOptions = options.slice(0, MAX_DISPLAYED_OPTIONS);
  return {
    success: true,
    message: `Showing first ${MAX_DISPLAYED_OPTIONS} of ${options.length} options`,
    pendingEffect: {
      card: pendingEffect.card,
      effect: pendingEffect.effect,
      options: displayedOptions.map(opt => ({
        index: opt.index,
        description: opt.description,
        command: formatMoveCommand(opt.move)
      })),
      note: `Use move command for specific choice beyond displayed options`
    },
    // ... rest of response
  };
}
```

---

## Performance Considerations

### Bottlenecks and Optimizations

**1. Combination Generation**
- **Issue**: O(2^n) complexity for n-card hands
- **Mitigation**:
  - Limit to n ≤ 10 (1024 combinations)
  - Warn if exceeding limit
  - Consider sampling or heuristic for larger hands

**2. Supply Iteration**
- **Issue**: Iterating entire supply for Workshop/Feast
- **Mitigation**:
  - Cache available cards by cost tier
  - Pre-filter by cost before iteration
  - Use Map for O(1) lookups

**3. Repeated Option Generation**
- **Issue**: Generating same options multiple times
- **Mitigation**:
  - Memoization for deterministic inputs
  - Cache options for same game state
  - Clear cache on state change

**4. MCP Response Size**
- **Issue**: Large JSON responses for many options
- **Mitigation**:
  - Limit displayed options to 50
  - Use compact command syntax
  - Paginate if needed

### Performance Targets

| Operation | Target | Worst Case |
|-----------|--------|------------|
| generateCellarOptions (5 cards) | < 10ms | < 20ms |
| generateRemodelStep2Options (20 cards) | < 5ms | < 10ms |
| generateMoveOptions (any card) | < 15ms | < 30ms |
| Full MCP response generation | < 50ms | < 100ms |
| CLI prompt display | < 10ms | < 20ms |

---

## Testing Strategy

### Unit Tests (Shared Layer)

**File**: `packages/core/tests/presentation/move-options.test.ts`

**Coverage**:
- Each generator function:
  - Normal cases (typical hands)
  - Edge cases (empty hand, single card, max size)
  - Error cases (invalid inputs)
- Helper functions:
  - `getCombinations()` with various sizes
  - `formatMoveCommand()` for all move types
  - `formatCardList()` with various inputs
- Main dispatcher:
  - Routes to correct generator for each effect type
  - Handles unknown effect types gracefully

**Example Test**:
```typescript
describe('generateCellarOptions', () => {
  it('should generate all combinations for 3-card hand', () => {
    const hand: CardName[] = ['Copper', 'Copper', 'Estate'];
    const options = generateCellarOptions(hand);

    // Should have 8 combinations (2^3)
    expect(options).toHaveLength(8);

    // Check first option (discard all 3)
    expect(options[0].move.cards).toHaveLength(3);
    expect(options[0].description).toContain('draw 3');

    // Check last option (discard nothing)
    expect(options[7].move.cards).toHaveLength(0);
    expect(options[7].description).toContain('draw 0');

    // Verify all options have valid indices
    options.forEach((opt, idx) => {
      expect(opt.index).toBe(idx + 1);
    });
  });

  it('should handle empty hand', () => {
    const hand: CardName[] = [];
    const options = generateCellarOptions(hand);

    expect(options).toHaveLength(1);
    expect(options[0].description).toContain('No cards');
  });

  it('should sort by number of cards descending', () => {
    const hand: CardName[] = ['Copper', 'Estate'];
    const options = generateCellarOptions(hand);

    expect(options[0].move.cards).toHaveLength(2); // Discard both
    expect(options[1].move.cards).toHaveLength(1); // Discard one
    expect(options[2].move.cards).toHaveLength(1); // Discard other
    expect(options[3].move.cards).toHaveLength(0); // Discard nothing
  });
});
```

### Integration Tests (CLI & MCP)

**CLI Integration**:
```typescript
describe('CLI displayPendingEffectPrompt', () => {
  it('should display Cellar prompt using shared layer', () => {
    const state = createTestStateWithCellarPending();
    const validMoves = engine.getValidMoves(state);

    // Capture console output
    const consoleSpy = jest.spyOn(console, 'log');

    display.displayPendingEffectPrompt(state, validMoves);

    // Verify prompt displayed
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cellar'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[1]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Discard'));
  });
});
```

**MCP Integration**:
```typescript
describe('MCP game_execute with pendingEffect', () => {
  it('should return structured options for Cellar', async () => {
    // Setup game with Cellar in hand
    const state = createTestState();
    tool.setState(state);

    // Play Cellar
    const response = await tool.execute({ move: 'play_action Cellar' });

    expect(response.success).toBe(true);
    expect(response.pendingEffect).toBeDefined();
    expect(response.pendingEffect.card).toBe('Cellar');
    expect(response.pendingEffect.options).toHaveLength(greaterThan(0));

    // Verify each option has required fields
    response.pendingEffect.options.forEach(opt => {
      expect(opt.index).toBeGreaterThan(0);
      expect(opt.description).toBeTruthy();
      expect(opt.command).toBeTruthy();
    });
  });

  it('should execute selected option successfully', async () => {
    // Play Cellar (get options)
    const response1 = await tool.execute({ move: 'play_action Cellar' });

    // Select option 1
    const selectedCommand = response1.pendingEffect.options[0].command;
    const response2 = await tool.execute({ move: selectedCommand });

    expect(response2.success).toBe(true);
    expect(response2.pendingEffect).toBeUndefined(); // Cleared after execution
  });
});
```

### E2E Tests (Full Workflows)

**Example E2E Test**:
```typescript
describe('E2E: Remodel workflow via MCP', () => {
  it('should complete 2-step Remodel process', async () => {
    // Setup game
    const server = new MCPGameServer();
    await server.start();

    // Start new game
    await server.executeCommand('game_session', { command: 'new', seed: 'test-remodel' });

    // Play actions until we can play Remodel
    // ... (setup moves)

    // Step 1: Play Remodel
    const step1Response = await server.executeCommand('game_execute', { move: 'play_action Remodel' });
    expect(step1Response.pendingEffect.step).toBe(1);
    expect(step1Response.pendingEffect.card).toBe('Remodel');

    // Step 2: Trash Estate
    const trashCommand = step1Response.pendingEffect.options[0].command; // Trash Estate
    const step2Response = await server.executeCommand('game_execute', { move: trashCommand });
    expect(step2Response.pendingEffect.step).toBe(2);

    // Step 3: Gain Smithy
    const gainCommand = step2Response.pendingEffect.options.find(opt => opt.description.includes('Smithy')).command;
    const finalResponse = await server.executeCommand('game_execute', { move: gainCommand });
    expect(finalResponse.success).toBe(true);
    expect(finalResponse.pendingEffect).toBeUndefined(); // Cleared

    // Cleanup
    await server.stop();
  });
});
```

---

**Document Status**: DRAFT - Ready for review and implementation

**Next Steps**:
1. Review and approve technical specification
2. Create TESTING.md with detailed test cases
3. Begin implementation (test-architect writes tests, dev-agent implements)
