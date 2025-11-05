# Phase 4.2 Overview: MCP Interactive Card Decisions

**Status**: DRAFT
**Created**: 2025-11-05
**Last-Updated**: 2025-11-05
**Owner**: requirements-architect
**Phase**: 4.2
**Dependencies**: Phase 4.1 Feature 2 (CLI Interactive Prompts)

---

## Executive Summary

**Problem**: Interactive card decisions (Cellar, Chapel, Remodel, etc.) are currently CLI-only. The MCP server cannot handle `pendingEffect` states, making 11 action cards unplayable by AI agents via the MCP interface.

**Impact**:
- AI agents cannot use 11 interactive action cards through MCP
- Feature parity gap between CLI and MCP interfaces
- Blocks AI gameplay testing for important cards
- MCP games limited to simple non-interactive cards only

**Solution**: Create shared presentation layer for generating interactive card move options, usable by both CLI (for humans) and MCP (for AI agents).

**Scope**: Enable all 11 interactive cards to work via MCP by extracting prompt generation logic into `packages/core/src/presentation/` and making MCP return structured options to AI agents.

---

## Problem Statement

### Current Architecture Issues

**CLI Implementation** (Phase 4.1 Feature 2):
```
CLI Game Loop → Detects pendingEffect
              → Generates move options (in CLI layer)
              → Displays formatted prompts (in CLI layer)
              → User selects numeric choice
              → Executes selected move
```

**Problem**: Move option generation and formatting are tightly coupled to CLI display layer.

**MCP Current Behavior**:
```
AI Agent → Submits move via MCP
        → Engine sets pendingEffect
        → MCP returns generic "Move executed" message
        → AI agent has NO IDEA what options are available
        → AI agent cannot proceed
```

**Problem**: MCP doesn't expose `pendingEffect` states or available move options to AI agents.

### Affected Cards

All 11 interactive action cards cannot be used via MCP:

1. **Cellar** ($2) - Choose cards to discard
2. **Chapel** ($2) - Choose cards to trash (up to 4)
3. **Remodel** ($4) - 2-step: trash card → gain card
4. **Mine** ($5) - 2-step: trash treasure → gain treasure to hand
5. **Workshop** ($3) - Choose card to gain (up to $4)
6. **Feast** ($4) - Choose card to gain (up to $5)
7. **Library** ($5) - Multi-step: set aside or keep action cards
8. **Throne Room** ($4) - Choose action to play twice
9. **Chancellor** ($3) - Binary choice: deck to discard?
10. **Spy** ($4) - Multi-step: discard or keep revealed cards
11. **Bureaucrat** ($4) - Opponent chooses victory card to topdeck

---

## Proposed Architecture

### Shared Presentation Layer

**Core Principle**: Interactive card logic belongs in the **game engine/presentation layer**, not UI layers.

**Architecture**:
```
packages/core/src/presentation/move-options.ts (NEW)
  ↓
  ├─→ CLI (packages/cli/src/display.ts)
  │   └─→ Format for human-readable display
  │
  └─→ MCP (packages/mcp-server/src/tools/game-execute.ts)
      └─→ Format for AI-readable structured response
```

### Key Components

#### 1. Shared Move Option Generator (`packages/core/src/presentation/move-options.ts`)

```typescript
export interface MoveOption {
  index: number;                   // Sequential number (1, 2, 3, ...)
  move: Move;                      // Actual Move object to execute
  description: string;             // Human-readable description
  cardNames?: readonly CardName[]; // Cards involved (for discard/trash)
  details?: Record<string, any>;   // Additional context (e.g., draw count)
}

export function generateCellarOptions(hand: readonly CardName[]): MoveOption[]
export function generateChapelOptions(hand: readonly CardName[]): MoveOption[]
export function generateRemodelStep1Options(hand: readonly CardName[]): MoveOption[]
export function generateRemodelStep2Options(maxCost: number, supply: Supply): MoveOption[]
// ... (functions for all 11 cards)
```

#### 2. CLI Prompt Display (`packages/cli/src/display.ts`)

**Uses shared options** to display formatted prompts:
```typescript
displayPendingEffectPrompt(state: GameState, validMoves: Move[]): void {
  // Get structured options from core
  const options = generateMoveOptions(state, validMoves);

  // Format for human display
  console.log("Choose cards to discard:");
  options.forEach(opt => {
    console.log(`  [${opt.index}] ${opt.description}`);
  });
}
```

#### 3. MCP Response Handler (`packages/mcp-server/src/tools/game-execute.ts`)

**Returns structured options** to AI agent:
```typescript
// When move execution results in pendingEffect
if (result.newState?.pendingEffect) {
  const options = generateMoveOptions(result.newState, validMoves);

  return {
    success: true,
    message: "Card requires choice",
    pendingEffect: {
      card: result.newState.pendingEffect.card,
      effect: result.newState.pendingEffect.effect,
      options: options.map(opt => ({
        index: opt.index,
        description: opt.description,
        command: formatMoveCommand(opt.move)
      }))
    },
    gameState: {...},
    validMoves: [...]  // Include move commands for each option
  };
}
```

**AI Agent Workflow**:
```
1. AI submits: "play_action Cellar"
2. MCP responds: {
     pendingEffect: {
       card: "Cellar",
       options: [
         {index: 1, description: "Discard: Copper, Copper, Estate (draw 3)", command: "discard_for_cellar Copper,Copper,Estate"},
         {index: 2, description: "Discard: Copper, Copper (draw 2)", command: "discard_for_cellar Copper,Copper"},
         ...
       ]
     }
   }
3. AI chooses option (e.g., "discard_for_cellar Copper,Copper")
4. MCP executes move, game continues
```

---

## Goals and Non-Goals

### Goals

1. **Enable MCP interactivity**: AI agents can use all 11 interactive cards via MCP
2. **Shared logic**: One source of truth for generating move options
3. **Feature parity**: MCP and CLI have equivalent capabilities (different UX, same features)
4. **Maintain TDD**: Tests first, implementation follows
5. **No CLI regression**: CLI behavior remains unchanged (except refactored internals)

### Non-Goals

1. **NOT changing CLI UX**: Human players see same prompts as before
2. **NOT changing game engine**: Only presentation layer changes
3. **NOT AI strategy**: This phase provides access; AI intelligence is separate
4. **NOT web UI**: Phase 4.2 is CLI + MCP only; web UI comes later

---

## Success Criteria

Phase 4.2 is **COMPLETE** when:

### Functional Completeness
- [ ] All 11 interactive cards work via MCP
- [ ] AI agents receive structured move options for pending effects
- [ ] AI agents can submit numeric selections or move commands
- [ ] Multi-step cards (Remodel, Mine, Library, Spy) work end-to-end via MCP
- [ ] CLI behavior unchanged (no regressions)

### Code Quality
- [ ] Shared presentation layer in `packages/core/src/presentation/move-options.ts`
- [ ] CLI uses shared layer (no duplicate logic)
- [ ] MCP uses shared layer (no duplicate logic)
- [ ] Test coverage ≥ 95% for new code
- [ ] All Phase 1-4.1 tests pass

### Documentation
- [ ] FEATURES.md: Complete feature requirements
- [ ] TECHNICAL.md: Architecture and implementation guidance
- [ ] TESTING.md: Comprehensive test specifications
- [ ] API.md: Updated with MCP pendingEffect response format
- [ ] CLAUDE.md: Updated with Phase 4.2 status

---

## Estimated Effort

| Component | Effort | Status |
|-----------|--------|--------|
| **Requirements** | 6h | In Progress |
| - FEATURES.md | 2h | Pending |
| - TECHNICAL.md | 2h | Pending |
| - TESTING.md | 2h | Pending |
| **Implementation** | 35-40h | Not Started |
| - Shared presentation layer | 15h | Not Started |
| - CLI refactoring | 8h | Not Started |
| - MCP integration | 10h | Not Started |
| - Testing | 12h | Not Started |
| **Total** | **41-46h** | **In Progress** |

**Breakdown by Card Complexity**:
- Simple cards (Cellar, Chapel, Workshop, Feast, Chancellor): 2h each = 10h
- Medium cards (Remodel, Mine, Throne Room): 4h each = 12h
- Complex cards (Library, Spy, Bureaucrat): 6h each = 18h

---

## Dependencies

### Prerequisites (Already Exist)
- ✅ Phase 4.1 Feature 2: CLI interactive prompts implemented
- ✅ `pendingEffect` system in game engine
- ✅ `getValidMoves()` for pending effects
- ✅ MCP server infrastructure
- ✅ Move parsing system

### Blocks
- ❌ Phase 5 (Web UI): Cannot implement web interactive prompts without shared layer
- ❌ AI strategy refinement: AI cannot test interactive cards until MCP supports them

### Related Work
- Phase 4.1 Feature 2 provides reference implementation (CLI)
- Phase 4.2 extracts and generalizes that logic

---

## Risk Analysis

### Technical Risks

**Risk 1: Complex State Management**
- **Issue**: Multi-step cards (Remodel, Library) have complex state transitions
- **Mitigation**: Thorough testing, clear state machine documentation
- **Likelihood**: Medium
- **Impact**: Medium

**Risk 2: MCP Response Size**
- **Issue**: Large number of options (Cellar with 5 cards = 31 combinations) might exceed MCP limits
- **Mitigation**: Paginate options, limit displayed combinations, optimize response format
- **Likelihood**: Low
- **Impact**: Medium

**Risk 3: CLI Refactoring Breaks Existing Behavior**
- **Issue**: Extracting logic from CLI might introduce regressions
- **Mitigation**: Comprehensive regression tests, careful refactoring
- **Likelihood**: Low
- **Impact**: High

### Schedule Risks

**Risk 4: Effort Underestimation**
- **Issue**: 41-46h estimate might be too optimistic for complex cards
- **Mitigation**: Start with simple cards, adjust timeline after initial implementation
- **Likelihood**: Medium
- **Impact**: Medium

**Risk 5: Dependency on Phase 4.1 Completion**
- **Issue**: Phase 4.2 cannot start until Phase 4.1 Feature 2 is complete
- **Mitigation**: Review Phase 4.1 code while waiting
- **Likelihood**: Low (Phase 4.1 is in progress)
- **Impact**: Low

---

## Next Steps

### Immediate (Requirements Phase)
1. ✅ Create OVERVIEW.md (this document)
2. ⏳ Create FEATURES.md - Detailed functional requirements
3. ⏳ Create TECHNICAL.md - Architecture and implementation guidance
4. ⏳ Create TESTING.md - Test specifications

### Implementation Phase (After Requirements Approval)
1. Create `packages/core/src/presentation/move-options.ts`
2. Implement simple card generators (Cellar, Chapel)
3. Write unit tests for generators
4. Refactor CLI to use shared layer
5. Integrate MCP with shared layer
6. Implement medium complexity cards (Remodel, Mine)
7. Implement complex cards (Library, Spy, Bureaucrat)
8. End-to-end testing (CLI + MCP)
9. Documentation updates
10. Code review and merge

---

## Related Documents

- `/docs/requirements/phase-4.1/FEATURES.md` - CLI interactive prompts (reference implementation)
- `/docs/requirements/phase-4.2/FEATURES.md` - This phase's detailed requirements (to be created)
- `/docs/requirements/phase-4.2/TECHNICAL.md` - Architecture details (to be created)
- `/docs/requirements/phase-4.2/TESTING.md` - Test specifications (to be created)
- `/packages/core/src/presentation/` - Existing presentation layer
- `/packages/cli/src/display.ts` - Current CLI implementation
- `/packages/mcp-server/src/tools/game-execute.ts` - MCP tool implementation

---

**Document Status**: DRAFT - Ready for review

**Approval Required From**:
- requirements-architect (owner)
- User (stakeholder)

**After Approval**:
- Begin creating FEATURES.md, TECHNICAL.md, TESTING.md
- Share requirements with test-architect and dev-agent
