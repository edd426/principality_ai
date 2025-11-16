# Phase 4.2 Architecture: Core/CLI/MCP Responsibility Boundaries

**Status**: ACTIVE
**Created**: 2025-11-16
**Last-Updated**: 2025-11-16
**Owner**: requirements-architect
**Phase**: 4.2

---

## Purpose

This document clarifies the responsibility boundaries between Core, CLI, and MCP layers, providing developers with clear guidance on:
- What formatting logic MUST be in core vs interfaces
- What to do when encountering missing handlers
- How to add support for new effect types
- Function distinctions and fallback behavior

**Addresses**: GitHub Issue #29 - Documentation gaps for Core/CLI/MCP responsibility boundaries

---

## Table of Contents

1. [Responsibility Matrix](#responsibility-matrix)
2. [Function Distinctions](#function-distinctions)
3. [Adding New Interactive Cards](#adding-new-interactive-cards)
4. [Error Handling Policy](#error-handling-policy)
5. [Quick Reference](#quick-reference)

---

## Responsibility Matrix

### Core Responsibilities (`packages/core/src/`)

| Concern | Location | Who's Responsible | Notes |
|---------|----------|-------------------|-------|
| **Option generation** | `presentation/move-options.ts` | Core | ✓ Single source of truth |
| **Move command formatting** | `presentation/move-options.ts` (`formatMoveCommand`) | Core | ✓ Used by MCP for commands |
| **Move descriptions** | `presentation/move-descriptions.ts` | Core | ✓ Used by CLI for display |
| **Move parsing** | `presentation/move-parser.ts` | Core | ✓ Used by both CLI and MCP |
| **Error messages** | `presentation/error-messages.ts` | Core | ✓ Business logic errors |
| **Game logic** | `game.ts`, `cards.ts`, `types.ts` | Core | ✓ No UI dependencies |
| **Fallback handling** | N/A | **Interfaces (CLI/MCP)** | ❌ NOT core responsibility |

**Core Principles**:
- ✅ Core provides DATA (options, descriptions, commands)
- ✅ Core provides PARSING (text → Move objects)
- ✅ Core provides VALIDATION (game rules)
- ❌ Core does NOT handle UI-specific formatting (terminal colors, JSON structure)
- ❌ Core does NOT handle I/O (console.log, network responses)
- ❌ Core does NOT decide fallback behavior when data is empty

---

### CLI Responsibilities (`packages/cli/src/`)

| Concern | Location | Who's Responsible | Notes |
|---------|----------|-------------------|-------|
| **Terminal display** | `display.ts` | CLI | ✓ Console formatting, colors |
| **Readline I/O** | `cli.ts` | CLI | ✓ User input handling |
| **Human-readable formatting** | `display.ts` | CLI | ✓ Wraps core data for display |
| **Fallback for empty options** | `display.ts` | CLI | ✓ Decides how to handle empty returns |
| **Stable numbers** | `stable-numbers.ts` | CLI | ✓ Optional feature for AI consistency |
| **VP display** | `vp-calculator.ts` | CLI | ✓ Victory point formatting |

**CLI Principles**:
- ✅ CLI calls core functions to GET data
- ✅ CLI formats data for HUMAN readability
- ✅ CLI handles terminal-specific concerns (colors, prompts, readline)
- ❌ CLI does NOT generate move options (uses core)
- ❌ CLI does NOT parse moves (uses core)
- ❌ CLI does NOT implement game logic

---

### MCP Responsibilities (`packages/mcp-server/src/`)

| Concern | Location | Who's Responsible | Notes |
|---------|----------|-------------------|-------|
| **JSON serialization** | `tools/game-execute.ts` | MCP | ✓ Structured responses for AI |
| **Network I/O** | MCP server framework | MCP | ✓ stdio transport |
| **AI-optimized responses** | `tools/game-execute.ts` | MCP | ✓ Compact, structured format |
| **Fallback for empty options** | `tools/game-execute.ts` | MCP | ✓ Decides how to handle empty returns |
| **Logging** | `logger.ts` | MCP | ✓ Move history, debugging |

**MCP Principles**:
- ✅ MCP calls core functions to GET data
- ✅ MCP formats data for AI agent consumption (JSON)
- ✅ MCP handles network-specific concerns (stdio, logging)
- ❌ MCP does NOT generate move options (uses core)
- ❌ MCP does NOT parse moves (uses core)
- ❌ MCP does NOT implement game logic

---

## Function Distinctions

### Core Presentation Functions

#### 1. `formatMoveCommand(move: Move): string`

**Location**: `packages/core/src/presentation/move-options.ts`

**Purpose**: Convert Move object → command string for **MCP execution**

**Usage**: MCP returns these commands to AI agents for submission

**Example**:
```typescript
const move: Move = { type: 'discard_for_cellar', cards: ['Copper', 'Estate'] };
formatMoveCommand(move);
// → "discard_for_cellar Copper,Estate"
```

**Why Core?**: Command syntax is part of the move protocol, not UI-specific

---

#### 2. `getMoveDescriptionCompact(move: Move): string`

**Location**: `packages/core/src/presentation/move-descriptions.ts`

**Purpose**: Get **human-readable** description for CLI display

**Usage**: CLI shows these descriptions in numbered menus

**Example**:
```typescript
const move: Move = { type: 'buy', card: 'Village' };
getMoveDescriptionCompact(move);
// → "Buy Village ($3)"
```

**Why Core?**: Descriptions are canonical, shared across interfaces

---

#### 3. `generateMoveOptions(state: GameState, validMoves: Move[]): MoveOption[]`

**Location**: `packages/core/src/presentation/move-options.ts`

**Purpose**: Generate structured options for pending effects

**Usage**: Both CLI and MCP use this for interactive cards

**Example**:
```typescript
const options = generateMoveOptions(state, validMoves);
// → [
//   { index: 1, move: {...}, description: "Discard: Copper, Estate (draw 2)", ... },
//   { index: 2, move: {...}, description: "Discard nothing (draw 0)", ... }
// ]
```

**Why Core?**: Option generation logic is business logic, not UI

---

### When to Use Which Function

| Scenario | Function to Use | Why |
|----------|----------------|-----|
| MCP needs command for AI agent | `formatMoveCommand` | Returns parseable command string |
| CLI needs menu description | `getMoveDescriptionCompact` | Returns human-readable text with cost |
| Interactive card prompts (CLI/MCP) | `generateMoveOptions` | Returns structured options with both |
| Logging/debugging | `getMoveDescription` | Returns basic description without cost |

**Key Distinction**:
- `formatMoveCommand` → **Command syntax** (for execution)
- `getMoveDescriptionCompact` → **Human display** (for reading)
- Both are in Core because they define canonical representations

---

## Adding New Interactive Cards

### Checklist for New Interactive Cards

When adding a new card that requires interactive choices (like Cellar, Remodel, etc.), follow these steps:

#### 1. **Define Requirements** (requirements-architect)

- [ ] Document card mechanics in `docs/requirements/phase-X/FEATURES.md`
- [ ] Specify expected behavior in `docs/requirements/phase-X/TESTING.md`
- [ ] Define new `PendingEffect` type if needed (in `packages/core/src/types.ts`)

#### 2. **Write Tests First** (test-architect)

- [ ] Add generator function tests in `packages/core/tests/presentation/move-options.test.ts`
- [ ] Add CLI integration tests in `packages/cli/tests/display.test.ts`
- [ ] Add MCP integration tests in `packages/mcp-server/tests/tools/game-execute.test.ts`
- [ ] Add E2E tests in `packages/mcp-server/tests/e2e/`

**Target**: All tests written, all tests FAILING (red phase)

#### 3. **Implement Core Generator** (dev-agent)

- [ ] Add generator function to `packages/core/src/presentation/move-options.ts`
  - Example: `generateNewCardOptions(hand: readonly CardName[]): MoveOption[]`
- [ ] Add case to `generateMoveOptions()` dispatcher (switch statement)
- [ ] Handle new move type in `formatMoveCommand()` if needed
- [ ] Handle new move type in `getMoveDescriptionCompact()` if needed

**Location**: `packages/core/src/presentation/move-options.ts`

**Example**:
```typescript
export function generateNewCardOptions(hand: readonly CardName[]): MoveOption[] {
  // Generate options based on card mechanics
  const options: MoveOption[] = hand.map((card, idx) => ({
    index: idx + 1,
    move: { type: 'new_card_effect', card },
    description: `Use ${card}`,
    cardNames: [card],
    details: { /* card-specific metadata */ }
  }));
  return options;
}

// In generateMoveOptions() dispatcher:
case 'new_card_effect':
  return generateNewCardOptions(player.hand);
```

#### 4. **Verify Interface Integration** (dev-agent)

**CLI**: No changes needed (automatically uses shared layer)
- Run `npm run play` to test human gameplay
- Verify options display correctly

**MCP**: No changes needed (automatically uses shared layer)
- Run integration tests to verify JSON response structure
- Verify AI agents receive correct options

**Target**: All tests PASSING (green phase)

#### 5. **Update Documentation** (requirements-architect)

- [ ] Update `ARCHITECTURE.md` (this file) if new patterns emerge
- [ ] Update `API.md` with new move types
- [ ] Update `TESTING.md` with coverage results

---

### When New Effect Type is Required

If your card introduces a **brand new effect type** (not reusing existing ones):

1. **Add to types** (`packages/core/src/types.ts`):
   ```typescript
   export interface PendingEffect {
     // ... existing fields ...
     effect: 'discard_for_cellar' | 'trash_cards' | 'new_effect_type'; // Add here
     // ... add effect-specific fields ...
   }
   ```

2. **Add to dispatcher** (`packages/core/src/presentation/move-options.ts`):
   ```typescript
   case 'new_effect_type':
     return generateNewCardOptions(player.hand);
   ```

3. **Add fallback handling** (CLI and MCP):
   - CLI: Display error message if generator returns empty
   - MCP: Return error response if generator returns empty

---

## Error Handling Policy

### When Generators Return Empty Arrays

**Scenario**: `generateMoveOptions()` returns `[]` for unknown effect type

#### Core Behavior:
```typescript
default:
  console.warn(`generateMoveOptions: Unknown effect type: ${pendingEffect.effect}`);
  return []; // Empty array signals error to caller
```

**Policy**: Core WARNS and returns empty array. **Core does NOT throw errors** for missing handlers.

#### CLI Behavior:
```typescript
const options = generateMoveOptions(state, validMoves);

if (options.length === 0) {
  console.log("⚠ Warning: No options available for this card effect.");
  console.log("This may indicate an implementation gap. Please report this issue.");
  console.log("\nFalling back to standard valid moves:");
  this.displayAvailableMoves(validMoves);
  return;
}
```

**Policy**: CLI falls back to showing standard valid moves from `getValidMoves()`

#### MCP Behavior:
```typescript
const options = generateMoveOptions(state, validMoves);

if (options.length === 0) {
  return {
    success: false,
    error: {
      message: "Pending effect has no valid options",
      suggestion: "This card effect may not be fully implemented. Use getValidMoves() for available actions.",
      details: {
        pendingEffect: state.pendingEffect,
        cardAffected: state.pendingEffect.card
      }
    }
  };
}
```

**Policy**: MCP returns error response with actionable guidance

---

### When Card Has No Valid Options (Intentional)

**Example**: Chapel with empty hand, Workshop with no cards ≤ $4

#### Core Behavior:
```typescript
if (hand.length === 0) {
  return [
    {
      index: 1,
      move: { type: 'trash_cards', cards: [] },
      description: "Trash nothing",
      cardNames: [],
      details: { action: 'skip' }
    }
  ];
}
```

**Policy**: Core returns SINGLE "skip" option (not empty array)

**Distinction**:
- `[]` (empty) → **Implementation error** (unknown effect type)
- `[{ skip option }]` → **Intentional skip** (valid game state, no choices)

---

### Missing Handler vs. No Options

| Scenario | Core Returns | Interface Behavior |
|----------|-------------|-------------------|
| **Unknown effect type** | `[]` + warning | CLI: Fallback to validMoves<br>MCP: Error response |
| **Intentional skip** (e.g., empty hand) | `[{ skip option }]` | CLI: Display skip option<br>MCP: Return skip option |
| **No valid choices** (e.g., supply empty) | `[{ skip/error option }]` | CLI: Display reason<br>MCP: Return reason |

---

### When to Add New Generators

**Add generator when**:
- ✅ New card requires interactive choices
- ✅ New effect type appears in `PendingEffect`
- ✅ Tests fail due to missing generator

**Don't add generator when**:
- ❌ Card has automatic effects (no choices)
- ❌ Effect is already handled by existing generator
- ❌ Card uses standard action/buy/end moves

---

## Quick Reference

### For Developers Adding New Cards

1. **Does your card require choices?**
   - No → Just add to `cards.ts`, no presentation layer changes needed
   - Yes → Follow "Adding New Interactive Cards" checklist

2. **Does your card use an existing effect type?**
   - Yes → Reuse existing generator (e.g., `gain_card` for Workshop/Feast)
   - No → Add new effect type and generator

3. **Where should code go?**
   ```
   ✓ Option generation → packages/core/src/presentation/move-options.ts
   ✓ Move descriptions → packages/core/src/presentation/move-descriptions.ts
   ✓ Game logic → packages/core/src/cards.ts
   ✓ CLI display → packages/cli/src/display.ts (rarely needs changes)
   ✓ MCP responses → packages/mcp-server/src/tools/game-execute.ts (rarely needs changes)
   ```

4. **What if generator returns empty?**
   - Check console warnings for "Unknown effect type"
   - Add case to `generateMoveOptions()` dispatcher
   - Add generator function for new effect type

---

### For Debugging Empty Options

1. **Check Core warning**:
   ```
   generateMoveOptions: Unknown effect type: <effect_name>
   ```

2. **Check `pendingEffect.effect` value**:
   ```typescript
   console.log('Pending effect:', state.pendingEffect.effect);
   ```

3. **Verify generator exists**:
   - Search for `case 'your_effect':` in `generateMoveOptions()` switch
   - Search for `generateYourCardOptions()` function

4. **Check interface fallback**:
   - CLI: Should show standard valid moves as fallback
   - MCP: Should return error response with guidance

---

### For Understanding Function Roles

```typescript
// Core provides DATA
const options = generateMoveOptions(state, validMoves);    // → MoveOption[]
const command = formatMoveCommand(move);                    // → "discard_for_cellar Copper"
const description = getMoveDescriptionCompact(move);        // → "Discard: Copper (draw 1)"

// CLI uses DATA for display
options.forEach(opt => {
  console.log(`  [${opt.index}] ${opt.description}`);     // Human-readable menu
});

// MCP uses DATA for JSON
return {
  pendingEffect: {
    options: options.map(opt => ({
      index: opt.index,
      description: opt.description,
      command: formatMoveCommand(opt.move)                 // AI-executable command
    }))
  }
};
```

---

## Related Documents

- [Phase 4.2 OVERVIEW.md](./OVERVIEW.md) - High-level architecture overview
- [Phase 4.2 TECHNICAL.md](./TECHNICAL.md) - Implementation details
- [API.md](/docs/reference/API.md) - Complete API reference
- [DEVELOPMENT_GUIDE.md](/docs/reference/DEVELOPMENT_GUIDE.md) - Development workflows

---

**Last Updated**: 2025-11-16 by requirements-architect
**Status**: ACTIVE - Ready for use by all agents
**Feedback**: GitHub Issue #29 (resolved by this document)
