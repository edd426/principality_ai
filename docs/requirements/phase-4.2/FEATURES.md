# Phase 4.2 Features: MCP Interactive Card Decisions

**Status**: DRAFT
**Created**: 2025-11-05
**Last-Updated**: 2025-11-05
**Owner**: requirements-architect
**Phase**: 4.2

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Stories](#user-stories)
3. [Functional Requirements](#functional-requirements)
4. [Shared Presentation Layer](#shared-presentation-layer)
5. [MCP Interface Specifications](#mcp-interface-specifications)
6. [CLI Integration](#cli-integration)
7. [Card-Specific Requirements](#card-specific-requirements)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Edge Cases](#edge-cases)
10. [Traceability Matrix](#traceability-matrix)

---

## Feature Overview

### The Problem

**Current State**: 11 interactive action cards work in CLI but are unplayable via MCP because:
- MCP doesn't expose `pendingEffect` states to AI agents
- AI agents cannot see available move options
- AI agents have no way to submit interactive choices
- Move option generation is tightly coupled to CLI display layer

**Example**: Playing Cellar via MCP
```
AI Agent → "play_action Cellar"
MCP → "Move executed" (but no indication of what to do next)
AI Agent → Stuck (doesn't know what options are available)
```

### The Solution

**Shared Architecture**: Extract interactive card logic into shared presentation layer

**Three-Layer Architecture**:
```
1. CORE (packages/core/src/presentation/move-options.ts)
   ↓ Generates structured MoveOption objects
   ↓
2. CLI (packages/cli/src/display.ts)
   ↓ Formats for human-readable display
   ↓
3. MCP (packages/mcp-server/src/tools/game-execute.ts)
   ↓ Formats for AI-readable structured response
```

**Result**: Both interfaces can handle interactive cards using shared logic

---

## User Stories

### Core Functionality

**US-MCP-INT-1**: AI Agent Sees Pending Effect
- **As an** AI agent
- **I want** to be notified when a move creates a `pendingEffect`
- **So that** I know I need to make an interactive choice

**US-MCP-INT-2**: AI Agent Receives Structured Options
- **As an** AI agent
- **I want** to receive a list of available move options with descriptions
- **So that** I can make an informed decision

**US-MCP-INT-3**: AI Agent Submits Choice
- **As an** AI agent
- **I want** to submit my choice via numeric index or move command
- **So that** I can resolve the pending effect and continue gameplay

**US-MCP-INT-4**: Multi-Step Card Support
- **As an** AI agent playing Remodel or Mine
- **I want** to receive sequential prompts for each step
- **So that** I can complete multi-step card effects

**US-MCP-INT-5**: Shared Logic for Both Interfaces
- **As a** developer
- **I want** one source of truth for generating move options
- **So that** CLI and MCP behave consistently and I avoid duplicate code

### CLI Continuity

**US-CLI-CONT-1**: No CLI Regression
- **As a** human player using CLI
- **I want** my experience to remain unchanged
- **So that** I can continue playing without disruption

**US-CLI-CONT-2**: Shared Code Benefits CLI
- **As a** developer maintaining CLI
- **I want** to use the same shared logic as MCP
- **So that** bug fixes benefit both interfaces

---

## Functional Requirements

### Core Shared Layer Requirements

**FR-SHARED-1**: Move Option Data Structure
- System SHALL define `MoveOption` interface with:
  - `index: number` - Sequential number (1-based)
  - `move: Move` - Executable Move object
  - `description: string` - Human-readable description
  - `cardNames?: readonly CardName[]` - Cards involved (optional)
  - `details?: Record<string, any>` - Additional metadata (optional)

**FR-SHARED-2**: Option Generator Functions
- System SHALL provide generator function for each interactive card:
  - `generateCellarOptions(hand): MoveOption[]`
  - `generateChapelOptions(hand): MoveOption[]`
  - `generateRemodelStep1Options(hand): MoveOption[]`
  - `generateRemodelStep2Options(maxCost, supply): MoveOption[]`
  - `generateMineStep1Options(hand): MoveOption[]`
  - `generateMineStep2Options(maxCost, supply): MoveOption[]`
  - `generateWorkshopOptions(supply): MoveOption[]`
  - `generateFeastOptions(supply): MoveOption[]`
  - `generateLibraryOptions(card): MoveOption[]`
  - `generateThroneRoomOptions(hand): MoveOption[]`
  - `generateChancellorOptions(deckSize): MoveOption[]`
  - `generateSpyOptions(card, player): MoveOption[]`
  - `generateBureaucratOptions(hand): MoveOption[]`

**FR-SHARED-3**: Main Generator Dispatcher
- System SHALL provide `generateMoveOptions(state, validMoves): MoveOption[]`
- Function SHALL dispatch to appropriate card-specific generator based on `state.pendingEffect.effect`
- Function SHALL return empty array if no pendingEffect

**FR-SHARED-4**: Deterministic Option Order
- Generator functions SHALL produce options in deterministic order
- Same input state SHALL always produce same option order
- Enables reproducible testing and debugging

**FR-SHARED-5**: Comprehensive Coverage
- System SHALL support all 11 interactive cards
- System SHALL handle single-step, multi-step, and iterative cards
- System SHALL work for both human players and AI players

### MCP Interface Requirements

**FR-MCP-1**: Pending Effect Detection
- MCP execute tool SHALL detect when `result.newState.pendingEffect` exists
- MCP SHALL include `pendingEffect` field in response when present
- MCP SHALL NOT return generic "Move executed" message when pending effect exists

**FR-MCP-2**: Structured Response Format
- When `pendingEffect` exists, MCP response SHALL include:
  ```typescript
  {
    success: true,
    message: string,  // E.g., "Card requires choice"
    pendingEffect: {
      card: CardName,
      effect: string,
      step?: number,     // For multi-step cards
      options: Array<{
        index: number,
        description: string,
        command: string    // Move command to execute this option
      }>
    },
    gameState: {...},
    validMoves: string[]
  }
  ```

**FR-MCP-3**: Move Command Format
- Each option SHALL include `command` field with executable move syntax
- Command format SHALL match existing MCP move parsing
- Examples:
  - `"discard_for_cellar Copper,Copper,Estate"`
  - `"trash_cards Copper,Copper,Estate,Curse"`
  - `"trash_for_remodel Estate"`
  - `"gain_card Smithy"`

**FR-MCP-4**: Numeric Selection Support
- MCP SHALL accept numeric input for interactive choices
- Format: `"select 2"` or just `"2"` to choose option 2
- System SHALL map numeric input to corresponding Move object
- System SHALL validate numeric input is within range

**FR-MCP-5**: Multi-Step Handling
- For multi-step cards (Remodel, Mine), MCP SHALL:
  - Include `step` field in response (e.g., `step: 1`, `step: 2`)
  - Return new `pendingEffect` response after each step completes
  - Clear `pendingEffect` only when all steps complete

**FR-MCP-6**: Iterative Card Handling
- For iterative cards (Library, Spy), MCP SHALL:
  - Return `pendingEffect` response for each iteration
  - Include context (e.g., "Card drawn: Village")
  - Continue iteration until card effect completes

**FR-MCP-7**: Error Handling
- MCP SHALL return clear error messages for:
  - Invalid option selection (out of range)
  - Invalid move command syntax
  - Pending effect mismatch (wrong card)
- MCP SHALL preserve game state on error

**FR-MCP-8**: Option Limit Handling
- If options exceed reasonable limit (e.g., >50), MCP SHALL:
  - Include first 50 options
  - Add message: "Showing first 50 of N options. Use move command for specific choice."
  - Still accept all valid move commands (not limited to displayed options)

### CLI Integration Requirements

**FR-CLI-1**: Use Shared Layer
- CLI SHALL call `generateMoveOptions()` from shared presentation layer
- CLI SHALL NOT duplicate option generation logic
- CLI SHALL format options for human-readable display

**FR-CLI-2**: No Behavioral Changes
- CLI interactive prompts SHALL behave identically to Phase 4.1 Feature 2
- Human players SHALL see same prompts as before
- Only internal implementation changes (use shared functions)

**FR-CLI-3**: Consistent Option Numbering
- CLI SHALL use same `index` values from `MoveOption[]`
- Option [1] in CLI SHALL correspond to option 1 in MCP
- Enables cross-interface debugging

---

## Shared Presentation Layer

### Module Structure

**File**: `packages/core/src/presentation/move-options.ts`

**Exports**:
```typescript
// Data structures
export interface MoveOption { ... }

// Main generator (dispatcher)
export function generateMoveOptions(
  state: GameState,
  validMoves: readonly Move[]
): MoveOption[]

// Card-specific generators
export function generateCellarOptions(hand: readonly CardName[]): MoveOption[]
export function generateChapelOptions(hand: readonly CardName[], maxTrash: number): MoveOption[]
export function generateRemodelStep1Options(hand: readonly CardName[]): MoveOption[]
export function generateRemodelStep2Options(maxCost: number, supply: ReadonlyMap<CardName, number>): MoveOption[]
// ... (all 11 cards)

// Helper functions
export function formatMoveCommand(move: Move): string
export function getCombinations<T>(arr: T[], maxSize: number): T[][]
```

### Card-Specific Generator Specifications

#### 1. Cellar

**Function**: `generateCellarOptions(hand: readonly CardName[]): MoveOption[]`

**Input**: Player's hand
**Output**: All possible discard combinations

**Algorithm**:
1. Generate all combinations of cards (up to hand size)
2. Include "discard nothing" option
3. Sort by number of cards descending
4. Create MoveOption for each combination

**Example Output**:
```typescript
[
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
]
```

**Complexity**: O(2^n) where n = hand size (limit to reasonable size)

---

#### 2. Chapel

**Function**: `generateChapelOptions(hand: readonly CardName[], maxTrash: number): MoveOption[]`

**Input**: Player's hand, max trash count (4)
**Output**: All possible trash combinations (up to maxTrash)

**Algorithm**: Similar to Cellar, but limited to `maxTrash` cards

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'trash_cards', cards: ['Copper', 'Copper', 'Estate', 'Curse'] },
    description: "Trash: Copper, Copper, Estate, Curse (4 cards)",
    cardNames: ['Copper', 'Copper', 'Estate', 'Curse'],
    details: { trashCount: 4 }
  },
  {
    index: 2,
    move: { type: 'trash_cards', cards: [] },
    description: "Trash nothing",
    cardNames: [],
    details: { trashCount: 0 }
  }
]
```

---

#### 3. Remodel (2-Step)

**Step 1 Function**: `generateRemodelStep1Options(hand: readonly CardName[]): MoveOption[]`

**Input**: Player's hand
**Output**: Options for which card to trash

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'trash_for_remodel', card: 'Estate' },
    description: "Trash: Estate ($2) → Can gain up to $4",
    cardNames: ['Estate'],
    details: { trashCost: 2, maxGainCost: 4 }
  },
  {
    index: 2,
    move: { type: 'trash_for_remodel', card: 'Copper' },
    description: "Trash: Copper ($0) → Can gain up to $2",
    cardNames: ['Copper'],
    details: { trashCost: 0, maxGainCost: 2 }
  }
]
```

**Step 2 Function**: `generateRemodelStep2Options(maxCost: number, supply: ReadonlyMap<CardName, number>): MoveOption[]`

**Input**: Max gain cost, supply
**Output**: Options for which card to gain

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'gain_card', card: 'Smithy' },
    description: "Gain: Smithy ($4)",
    cardNames: ['Smithy'],
    details: { gainCost: 4 }
  },
  {
    index: 2,
    move: { type: 'gain_card', card: 'Village' },
    description: "Gain: Village ($3)",
    cardNames: ['Village'],
    details: { gainCost: 3 }
  }
]
```

---

#### 4. Mine (2-Step)

**Step 1 Function**: `generateMineStep1Options(hand: readonly CardName[]): MoveOption[]`

**Input**: Player's hand
**Output**: Options for which treasure to trash

**Filter**: Only treasures
**Example Output**: (Similar to Remodel Step 1, but treasures only)

**Step 2 Function**: `generateMineStep2Options(maxCost: number, supply: ReadonlyMap<CardName, number>): MoveOption[]`

**Input**: Max gain cost, supply
**Output**: Options for which treasure to gain to hand

**Filter**: Only treasures, cost ≤ maxCost
**Special**: Gained card goes to hand, not discard pile

---

#### 5. Workshop

**Function**: `generateWorkshopOptions(supply: ReadonlyMap<CardName, number>): MoveOption[]`

**Input**: Supply
**Output**: All cards costing up to $4

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'gain_card', card: 'Smithy' },
    description: "Gain: Smithy ($4)",
    cardNames: ['Smithy'],
    details: { gainCost: 4 }
  },
  // ... (all cards ≤ $4)
]
```

---

#### 6. Feast

**Function**: `generateFeastOptions(supply: ReadonlyMap<CardName, number>): MoveOption[]`

**Input**: Supply
**Output**: All cards costing up to $5

**Note**: Similar to Workshop but with cost limit $5

---

#### 7. Library (Iterative)

**Function**: `generateLibraryOptions(card: CardName): MoveOption[]`

**Input**: Action card just drawn
**Output**: Binary choice - set aside or keep

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'library_set_aside', cards: ['Village'], choice: true },
    description: "Set aside: Village (skip it, discard at end)",
    cardNames: ['Village'],
    details: { action: 'set_aside' }
  },
  {
    index: 2,
    move: { type: 'library_set_aside', cards: ['Village'], choice: false },
    description: "Keep: Village in hand",
    cardNames: ['Village'],
    details: { action: 'keep' }
  }
]
```

**Iteration**: Called once per action card drawn during Library resolution

---

#### 8. Throne Room

**Function**: `generateThroneRoomOptions(hand: readonly CardName[]): MoveOption[]`

**Input**: Player's hand (excluding Throne Room itself)
**Output**: All action cards as options + "skip" option

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'select_action_for_throne', card: 'Village' },
    description: "Play: Village (twice) → +2 Cards, +4 Actions",
    cardNames: ['Village'],
    details: { doubledEffect: '+2 Cards, +4 Actions' }
  },
  {
    index: 2,
    move: { type: 'select_action_for_throne', card: 'Smithy' },
    description: "Play: Smithy (twice) → +6 Cards",
    cardNames: ['Smithy'],
    details: { doubledEffect: '+6 Cards' }
  },
  {
    index: 3,
    move: { type: 'select_action_for_throne', card: null },
    description: "Skip (don't use Throne Room)",
    cardNames: [],
    details: { action: 'skip' }
  }
]
```

---

#### 9. Chancellor

**Function**: `generateChancellorOptions(deckSize: number): MoveOption[]`

**Input**: Player's draw pile size
**Output**: Binary choice - deck to discard or not

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'chancellor_decision', choice: true },
    description: "Yes - Put deck into discard pile (5 cards)",
    cardNames: [],
    details: { deckSize: 5, action: 'move_to_discard' }
  },
  {
    index: 2,
    move: { type: 'chancellor_decision', choice: false },
    description: "No - Keep deck as is",
    cardNames: [],
    details: { action: 'keep_deck' }
  }
]
```

---

#### 10. Spy (Iterative)

**Function**: `generateSpyOptions(card: CardName, playerIndex: number): MoveOption[]`

**Input**: Revealed card, player index
**Output**: Binary choice - discard or keep

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'spy_decision', choice: true },
    description: "Discard: Copper (Player 1's top card)",
    cardNames: ['Copper'],
    details: { player: 1, action: 'discard' }
  },
  {
    index: 2,
    move: { type: 'spy_decision', choice: false },
    description: "Keep: Copper on top of deck (Player 1)",
    cardNames: ['Copper'],
    details: { player: 1, action: 'keep' }
  }
]
```

**Iteration**: Called once per player in turn order

---

#### 11. Bureaucrat (Iterative)

**Function**: `generateBureaucratOptions(hand: readonly CardName[]): MoveOption[]`

**Input**: Opponent's hand
**Output**: Victory cards to topdeck + "reveal hand" option

**Example Output**:
```typescript
[
  {
    index: 1,
    move: { type: 'reveal_and_topdeck', card: 'Estate' },
    description: "Topdeck: Estate",
    cardNames: ['Estate'],
    details: { action: 'topdeck' }
  },
  {
    index: 2,
    move: { type: 'reveal_and_topdeck', card: 'Duchy' },
    description: "Topdeck: Duchy",
    cardNames: ['Duchy'],
    details: { action: 'topdeck' }
  },
  {
    index: 3,
    move: { type: 'reveal_and_topdeck', card: null },
    description: "Reveal hand (no Victory cards)",
    cardNames: [],
    details: { action: 'reveal_hand' }
  }
]
```

**Iteration**: Called for each opponent

---

## MCP Interface Specifications

### Response Format for Pending Effects

#### Success Response with Pending Effect

```json
{
  "success": true,
  "message": "Card requires choice: Cellar",
  "pendingEffect": {
    "card": "Cellar",
    "effect": "discard_for_cellar",
    "step": null,
    "options": [
      {
        "index": 1,
        "description": "Discard: Copper, Copper, Estate (draw 3)",
        "command": "discard_for_cellar Copper,Copper,Estate"
      },
      {
        "index": 2,
        "description": "Discard: Copper, Copper (draw 2)",
        "command": "discard_for_cellar Copper,Copper"
      },
      {
        "index": 3,
        "description": "Discard nothing (draw 0)",
        "command": "discard_for_cellar"
      }
    ]
  },
  "gameState": {
    "phase": "action",
    "turnNumber": 3,
    "activePlayer": 0,
    "hand": { "Copper": 2, "Estate": 1 },
    "currentCoins": 0,
    "currentActions": 1,
    "currentBuys": 1
  },
  "validMoves": [
    "discard_for_cellar Copper,Copper,Estate",
    "discard_for_cellar Copper,Copper",
    "discard_for_cellar"
  ],
  "gameOver": false
}
```

#### Multi-Step Response (Remodel Step 1)

```json
{
  "success": true,
  "message": "Remodel - Step 1: Choose card to trash",
  "pendingEffect": {
    "card": "Remodel",
    "effect": "trash_for_remodel",
    "step": 1,
    "options": [
      {
        "index": 1,
        "description": "Trash: Estate ($2) → Can gain up to $4",
        "command": "trash_for_remodel Estate"
      },
      {
        "index": 2,
        "description": "Trash: Copper ($0) → Can gain up to $2",
        "command": "trash_for_remodel Copper"
      }
    ]
  },
  "gameState": {...},
  "validMoves": [...],
  "gameOver": false
}
```

#### Multi-Step Response (Remodel Step 2)

```json
{
  "success": true,
  "message": "Remodel - Step 2: Choose card to gain (up to $4)",
  "pendingEffect": {
    "card": "Remodel",
    "effect": "gain_card",
    "step": 2,
    "options": [
      {
        "index": 1,
        "description": "Gain: Smithy ($4)",
        "command": "gain_card Smithy"
      },
      {
        "index": 2,
        "description": "Gain: Village ($3)",
        "command": "gain_card Village"
      }
    ]
  },
  "gameState": {...},
  "validMoves": [...],
  "gameOver": false
}
```

### AI Agent Interaction Flow

**Example: Playing Cellar via MCP**

```
Step 1: AI plays Cellar
Request:  { move: "play_action Cellar" }
Response: {
  success: true,
  pendingEffect: {
    card: "Cellar",
    options: [
      {index: 1, description: "Discard: Copper, Copper (draw 2)", command: "discard_for_cellar Copper,Copper"},
      {index: 2, description: "Discard: Copper (draw 1)", command: "discard_for_cellar Copper"},
      {index: 3, description: "Discard nothing", command: "discard_for_cellar"}
    ]
  }
}

Step 2: AI makes choice
Request:  { move: "discard_for_cellar Copper,Copper" }
Response: {
  success: true,
  message: "Discarded: Copper, Copper. Drew 2 cards.",
  gameState: {...},  // pendingEffect is cleared
  validMoves: [...]  // Normal moves available
}

Step 3: AI continues normal gameplay
```

**Example: Playing Remodel via MCP (Multi-Step)**

```
Step 1: Play Remodel
Request:  { move: "play_action Remodel" }
Response: { pendingEffect: { step: 1, options: [...] } }

Step 2: Choose card to trash
Request:  { move: "trash_for_remodel Estate" }
Response: { pendingEffect: { step: 2, options: [...] } }  // Still pending!

Step 3: Choose card to gain
Request:  { move: "gain_card Smithy" }
Response: { success: true, message: "Remodel complete", ... }  // Pending cleared
```

---

## CLI Integration

### Changes to CLI Display

**File**: `packages/cli/src/display.ts`

**Modified Functions**:
```typescript
/**
 * Display interactive prompt for pending effects (Feature 2)
 * NOW USES SHARED LAYER instead of local logic
 */
displayPendingEffectPrompt(state: GameState, validMoves: Move[]): void {
  const pendingEffect = state.pendingEffect;
  if (!pendingEffect) return;

  // Get structured options from SHARED LAYER
  const options = generateMoveOptions(state, validMoves);

  // Format for human-readable display
  const player = state.players[state.currentPlayer];
  const card = getCard(pendingEffect.card);

  console.log(`\n✓ Player ${state.currentPlayer + 1} played ${pendingEffect.card}`);
  console.log(`Effect: ${card.description}\n`);

  // Display options using shared data
  if (pendingEffect.effect === 'discard_for_cellar') {
    console.log('Choose cards to discard:');
  } else if (pendingEffect.effect === 'trash_cards') {
    console.log('Choose cards to trash:');
  } // ... (card-specific headers)

  options.forEach(opt => {
    console.log(`  [${opt.index}] ${opt.description}`);
  });

  console.log('');
}
```

**No Behavioral Changes**:
- Human players see identical prompts
- Option numbers remain the same
- Descriptions remain the same
- Only internal implementation changes

**Benefits of Shared Layer**:
- Bug fixes in core benefit CLI
- Consistent option generation
- Easier testing (test core once)

---

## Card-Specific Requirements

### Summary Table

| Card | Steps | Iterative | Generator Functions | Complexity |
|------|-------|-----------|---------------------|------------|
| Cellar | 1 | No | `generateCellarOptions()` | MEDIUM |
| Chapel | 1 | No | `generateChapelOptions()` | MEDIUM |
| Remodel | 2 | No | `generateRemodelStep1Options()`, `generateRemodelStep2Options()` | HIGH |
| Mine | 2 | No | `generateMineStep1Options()`, `generateMineStep2Options()` | HIGH |
| Workshop | 1 | No | `generateWorkshopOptions()` | LOW |
| Feast | 1 | No | `generateFeastOptions()` | LOW |
| Library | 1 | Yes | `generateLibraryOptions()` | MEDIUM |
| Throne Room | 1 | No | `generateThroneRoomOptions()` | MEDIUM |
| Chancellor | 1 | No | `generateChancellorOptions()` | LOW |
| Spy | 1 | Yes | `generateSpyOptions()` | MEDIUM |
| Bureaucrat | 1 | Yes | `generateBureaucratOptions()` | MEDIUM |

### Detailed Specifications

(See "Shared Presentation Layer" section above for detailed specifications of each card's generator function)

---

## Acceptance Criteria

### Shared Layer Completeness

**AC-SHARED-1**: All Card Generators Exist
- GIVEN the shared presentation layer
- WHEN all 11 interactive cards are checked
- THEN each card SHALL have a dedicated generator function
- AND all functions SHALL be exported from `move-options.ts`

**AC-SHARED-2**: Deterministic Option Generation
- GIVEN identical game state and hand
- WHEN generator function is called twice
- THEN both calls SHALL produce identical option arrays
- AND option order SHALL be identical

**AC-SHARED-3**: Complete MoveOption Objects
- GIVEN any generator function output
- WHEN options are inspected
- THEN each option SHALL have:
  - Valid `index` (1-based, sequential)
  - Valid `move` object (executable)
  - Non-empty `description`
  - Appropriate `cardNames` and `details` (if applicable)

### MCP Interface Completeness

**AC-MCP-1**: Pending Effect Detection
- GIVEN Cellar is played via MCP
- WHEN `pendingEffect` is set
- THEN MCP response SHALL include `pendingEffect` field
- AND response SHALL include `options` array

**AC-MCP-2**: Structured Options Returned
- GIVEN Cellar pending effect response
- WHEN options are inspected
- THEN each option SHALL have `index`, `description`, and `command`
- AND all options SHALL be executable moves

**AC-MCP-3**: Move Command Execution
- GIVEN MCP returns `command: "discard_for_cellar Copper,Copper"`
- WHEN AI agent submits that command
- THEN move SHALL execute successfully
- AND game state SHALL update correctly

**AC-MCP-4**: Numeric Selection Support
- GIVEN MCP returns 3 options
- WHEN AI agent submits `"select 2"` or `"2"`
- THEN option 2 SHALL be executed
- AND response SHALL confirm selection

**AC-MCP-5**: Multi-Step Card Support
- GIVEN Remodel is played via MCP
- WHEN Step 1 is completed
- THEN MCP SHALL return new `pendingEffect` with `step: 2`
- AND Step 2 options SHALL be appropriate to Step 1 choice

**AC-MCP-6**: Iterative Card Support
- GIVEN Library is played via MCP
- WHEN first action card is drawn
- THEN MCP SHALL return `pendingEffect` for that card
- AND AI agent SHALL make choice
- AND process SHALL repeat until hand has 7 cards or draw pile empty

**AC-MCP-7**: Error Handling
- GIVEN pending effect with 3 options
- WHEN AI agent submits `"select 99"`
- THEN MCP SHALL return error message
- AND game state SHALL be unchanged
- AND AI agent SHALL receive valid options again

**AC-MCP-8**: All 11 Cards Work End-to-End
- GIVEN each of 11 interactive cards is played via MCP
- WHEN full interaction flow is completed
- THEN all cards SHALL work correctly
- AND no cards SHALL be blocked or broken

### CLI Integration Completeness

**AC-CLI-1**: No Behavioral Regression
- GIVEN Phase 4.1 Feature 2 CLI tests
- WHEN those tests are run with Phase 4.2 code
- THEN 100% of tests SHALL pass
- AND human players SHALL see identical prompts

**AC-CLI-2**: Shared Layer Usage
- GIVEN CLI display code
- WHEN code is inspected
- THEN CLI SHALL call `generateMoveOptions()` from shared layer
- AND CLI SHALL NOT duplicate option generation logic

**AC-CLI-3**: Consistent Option Numbering
- GIVEN same game state used by CLI and MCP
- WHEN both generate options for Cellar
- THEN option [1] in CLI SHALL match option 1 in MCP
- AND descriptions SHALL be identical

### Performance

**AC-PERF-1**: Generator Performance
- GIVEN generator function with worst-case input (Cellar with 5 cards)
- WHEN performance is measured
- THEN generation SHALL complete in < 50ms

**AC-PERF-2**: MCP Response Time
- GIVEN interactive card played via MCP
- WHEN response time is measured
- THEN total response time (including option generation) SHALL be < 100ms

### Test Coverage

**AC-TEST-1**: Unit Test Coverage
- GIVEN shared presentation layer code
- WHEN test coverage is measured
- THEN coverage SHALL be ≥ 95%

**AC-TEST-2**: Integration Test Coverage
- GIVEN MCP tool integration
- WHEN test coverage is measured
- THEN coverage SHALL be ≥ 95%

**AC-TEST-3**: E2E Test Coverage
- GIVEN all 11 interactive cards
- WHEN E2E tests are reviewed
- THEN each card SHALL have at least 1 E2E test via MCP
- AND multi-step cards SHALL have complete workflow tests

---

## Edge Cases

### General Edge Cases

**EC-GEN-1**: No Valid Options
- **Scenario**: Player plays Chapel with empty hand
- **Expected**: Generator returns single option: "No cards to trash"
- **MCP Response**: Include option with `command: "skip"` or auto-resolve

**EC-GEN-2**: Single Option Only
- **Scenario**: Player plays Throne Room with only one action in hand
- **Expected**: Generator returns that action + "skip" option (2 options)
- **Rationale**: User should always have "skip" choice

**EC-GEN-3**: Large Number of Options
- **Scenario**: Cellar with hand of 5 different cards (31 combinations)
- **Expected**: Generator produces all combinations, MCP limits display to 50
- **Rationale**: Complete data available even if display is truncated

**EC-GEN-4**: Pending Effect Mismatch
- **Scenario**: AI agent submits move for wrong pending effect
- **Expected**: MCP returns error "Expected discard_for_cellar, got trash_cards"
- **Rationale**: Clear error prevents confusion

**EC-GEN-5**: Numeric Selection Out of Range
- **Scenario**: Options 1-5 available, AI submits "select 10"
- **Expected**: MCP returns error "Invalid selection: 10. Valid range is 1-5."
- **Rationale**: Helpful error message

### Card-Specific Edge Cases

**EC-CELLAR-1**: Empty Hand
- **Scenario**: Player plays Cellar with 0 cards in hand
- **Expected**: Single option "Discard nothing (draw 0)"

**EC-CHAPEL-1**: Hand Smaller Than Max Trash
- **Scenario**: Player has 2 cards, Chapel allows 4
- **Expected**: Generate combinations up to 2 cards only

**EC-REMODEL-1**: Insufficient Supply Step 2
- **Scenario**: Step 1 trashes Estate ($2), but no cards ≤ $4 in supply
- **Expected**: Option "No cards available to gain" + auto-skip

**EC-MINE-1**: No Treasures in Hand
- **Scenario**: Player plays Mine with no treasures
- **Expected**: Single option "No treasures to trash" + auto-skip

**EC-WORKSHOP-1**: Empty Supply
- **Scenario**: All cards ≤ $4 are sold out
- **Expected**: Single option "No cards available to gain"

**EC-LIBRARY-1**: Already 7 Cards
- **Scenario**: Player has 7 cards when Library is played
- **Expected**: No pending effect, card effect complete immediately

**EC-LIBRARY-2**: Draw Pile Empty
- **Scenario**: Library draws until draw pile and discard pile both empty
- **Expected**: Stop drawing, pending effect clears

**EC-THRONE-1**: No Actions in Hand
- **Scenario**: Player plays Throne Room with no other actions
- **Expected**: Single option "Skip (no action cards to play)"

**EC-SPY-1**: Empty Draw Pile (Opponent)
- **Scenario**: Spy reveals opponent's top card, but opponent has no cards
- **Expected**: Skip that opponent's reveal, continue to next

**EC-BUREAUCRAT-1**: No Victory Cards
- **Scenario**: Opponent has no victory cards when Bureaucrat attacks
- **Expected**: Single option "Reveal hand (no Victory cards)"

---

## Traceability Matrix

Map requirements to test IDs (to be defined in TESTING.md):

| Requirement ID | Description | Test IDs |
|----------------|-------------|----------|
| FR-SHARED-1 | MoveOption structure | UT-SHARED-1 |
| FR-SHARED-2 | Generator functions exist | UT-SHARED-2 through UT-SHARED-12 |
| FR-SHARED-3 | Main dispatcher | UT-SHARED-DISPATCH-1 |
| FR-SHARED-4 | Deterministic order | UT-SHARED-DET-1, UT-SHARED-DET-2 |
| FR-SHARED-5 | Comprehensive coverage | UT-SHARED-COV-1 |
| FR-MCP-1 | Pending effect detection | IT-MCP-DETECT-1, IT-MCP-DETECT-2 |
| FR-MCP-2 | Structured response | IT-MCP-RESPONSE-1 through IT-MCP-RESPONSE-11 |
| FR-MCP-3 | Move command format | IT-MCP-CMD-1 |
| FR-MCP-4 | Numeric selection | IT-MCP-SELECT-1, IT-MCP-SELECT-2 |
| FR-MCP-5 | Multi-step handling | IT-MCP-MULTI-1, IT-MCP-MULTI-2 |
| FR-MCP-6 | Iterative handling | IT-MCP-ITER-1, IT-MCP-ITER-2, IT-MCP-ITER-3 |
| FR-MCP-7 | Error handling | IT-MCP-ERROR-1 through IT-MCP-ERROR-5 |
| FR-MCP-8 | Option limit | IT-MCP-LIMIT-1 |
| FR-CLI-1 | Use shared layer | IT-CLI-SHARED-1 |
| FR-CLI-2 | No behavioral changes | IT-CLI-REGRESS-1 (all Phase 4.1 tests) |
| FR-CLI-3 | Consistent numbering | IT-CLI-CONSISTENT-1 |

**E2E Tests** (cross-cutting):
- E2E-MCP-CELLAR-1: Complete Cellar workflow via MCP
- E2E-MCP-CHAPEL-1: Complete Chapel workflow via MCP
- E2E-MCP-REMODEL-1: Complete Remodel 2-step workflow via MCP
- E2E-MCP-MINE-1: Complete Mine 2-step workflow via MCP
- E2E-MCP-WORKSHOP-1: Complete Workshop workflow via MCP
- E2E-MCP-FEAST-1: Complete Feast workflow via MCP
- E2E-MCP-LIBRARY-1: Complete Library iterative workflow via MCP
- E2E-MCP-THRONE-1: Complete Throne Room workflow via MCP
- E2E-MCP-CHANCELLOR-1: Complete Chancellor workflow via MCP
- E2E-MCP-SPY-1: Complete Spy iterative workflow via MCP (2-player)
- E2E-MCP-BUREAUCRAT-1: Complete Bureaucrat iterative workflow via MCP (2-player)

---

**Document Status**: DRAFT - Ready for review and test specification

**Next Steps**:
1. Review and approve functional requirements
2. Create TECHNICAL.md with implementation details
3. Create TESTING.md with comprehensive test specifications
4. Begin test-architect work (write tests first per TDD)
5. Begin dev-agent implementation (once tests exist)
