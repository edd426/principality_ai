# CLI Phase 2 Requirements - Executive Summary

**Status**: COMPLETE ✅
**Created**: 2025-10-05
**Last Updated**: 2025-10-20 (marked complete - all features implemented and tested)
**Phase**: 1.5
**Version**: 2.0.0

---

## Overview

All user clarifications received. Six CLI UX improvement features are fully specified and ready for implementation. All open questions have been resolved.

**Total Estimated Effort**: 28 hours (6-7 days)

---

## Feature Summary (6 Features)

### 1. Auto-Play All Treasures ✨ Must-Have

**Problem**: Playing 5 Copper cards one-by-one is tedious

**Solution**: Command-based treasure playing - type `treasures` or `t` to play all at once

**User Decision**: Command-based (NOT automatic)
- User must type command to play all treasures
- Preserves individual treasure playing option
- Maintains full player control

**Example**:
```
> treasures
✓ Played all treasures: Copper (+$1), Copper (+$1), Silver (+$2)
Total coins: $4
```

**Impact**: Eliminates 50-80% of manual inputs per game

**Effort**: 4 hours

---

### 2. Stable Card Numbers 🎯 Should-Have

**Problem**: AI agents struggle when "Play Village" changes from [1] to [3] between turns

**Solution**: Fixed numbers that never change

**User Decision**: Simple stable-only display (no hybrid)
- Just show stable numbers: `[7] Play Village`
- Cleaner, simpler UI
- Enabled via `--stable-numbers` flag

**Example**:
```
Turn 1:
  [7] Play Village    ← Always [7]
  [6] Play Smithy     ← Always [6]

Turn 5:
  [7] Play Village    ← Still [7]!
```

**Impact**: AI agents can learn "always pick 7 for Village"

**Effort**: 6 hours (reduced from 8 - simpler without hybrid)

---

### 3. Multi-Card Chained Submission ⚡ Should-Have

**Problem**: Executing 5 moves requires 5 separate inputs

**Solution**: Accept comma or space-separated move chains

**User Decision**: Full rollback on any error
- If ANY move fails, rollback ALL moves
- Game state unchanged if chain fails
- Detailed error message showing which move failed

**Example**:
```
> 1, 2, 3

✓ Played Village
✓ Played Smithy
✓ Ended Action Phase
```

**Error Handling**:
```
> 1, 99
✗ Chain failed at move 2: Invalid move number (99).
  All moves rolled back. Game state unchanged.
```

**Impact**: 60-70% faster gameplay for common sequences

**Effort**: 8 hours (increased from 6 - rollback adds complexity)

---

### 4. Reduced Supply Pile Sizes 🎲 Could-Have

**Problem**: Testing 20-turn games is slow during development

**Solution**: `--quick-game` flag reduces victory piles only

**User Decision**: Provinces confirmed (not "principalities")
- Reduce Estates, Duchies, Provinces from 12 → 8
- Villages are kingdom cards, stay at 10
- All kingdom cards stay at 10
- Treasures unchanged

**Example**:
```bash
npm run play -- --quick-game
```

**Impact**: Games finish in 10-15 turns instead of 20-25 (40% faster)

**Effort**: 2 hours

---

### 5. Victory Points Display 🏆 Must-Have (NEW)

**Problem**: Victory points were completely missing from Phase 1 CLI

**Solution**: Display VP in game status header at all times

**User Discovery**: "Please add to the UI something that shows the number of victory points. I noticed this was missing from the cli ui."

**Example**:
```
=== Turn 5 | Player 1 | VP: 5 (3E, 1D) | Action Phase ===
```

Or expanded format:
```
=== Turn 5 | Player 1 | Action Phase ===
Victory Points: 5 VP (2 Estates, 1 Duchy)
```

**Impact**: Essential game information now visible

**Effort**: 5 hours

---

### 6. Auto-Skip Cleanup Phase ⚡ Should-Have

**Problem**: Players must manually press a key every turn to execute cleanup even though no decisions are required

**Solution**: Automatically execute cleanup and advance to next turn when no choices exist

**Example**:
```
✓ Cleanup: Discarded 3 cards, drew 5 new cards

=== Turn 2 | Player 1 | Action Phase ===
```

**Opt-Out**: `--manual-cleanup` flag disables auto-skip

**Impact**: Eliminates one manual input per turn, smoother game flow

**Effort**: 3 hours

---

## All Questions Resolved ✅

### Question 1: "Principalities" Clarification
**Answer**: "Yes, I meant Provinces"
- Confirmed: Reduce Estates, Duchies, Provinces to 8
- Villages stay at 10 (kingdom card, not victory card)

### Question 2: Auto-Play Behavior
**Answer**: "No, treasures require a command to play all"
- Command-based, NOT automatic
- User types `treasures` or `t` or `play all`
- Can still play individually

### Question 3: Stable Numbering Display
**Answer**: "For simplicity, just show the stable numbering please"
- Simple display only: `[7] Play Village`
- No hybrid with sequential numbers
- Remove old numbered display entirely

### Question 4: Chain Error Handling
**Answer**: "If move 2 fails, stop and reset as though none of the moves in the chain have happened"
- Full rollback/transaction behavior
- If ANY move fails, revert ALL moves
- Detailed error message
- Game state unchanged

### Question 5: Victory Points (NEW FEATURE)
**Answer**: "Also, please add to the UI something that shows the number of victory points"
- Missing from Phase 1
- Must-have feature
- Show in game header
- Update after buying victory cards

### Question 6: Auto-Skip Cleanup (NEW FEATURE)
**Observation**: User identified cleanup phase requires manual input despite having no choices
- Auto-execute cleanup when only one move option exists
- Display cleanup summary
- Opt-out via `--manual-cleanup` flag
- Future-proof for cards with cleanup decisions

---

## Implementation Plan

### Week 1: Core Features (17 hours)
1. **Feature 1**: Auto-Play Treasures (4 hours)
   - Command parser for `treasures`, `t`, `play all`
   - Play all treasures in sequence
   - Display summary message

2. **Feature 5**: Victory Points Display (5 hours)
   - VP calculation logic
   - Header display integration
   - Update after buy/gain actions

3. **Feature 6**: Auto-Skip Cleanup (3 hours)
   - Auto-skip detection logic
   - Cleanup summary generation
   - `--manual-cleanup` flag handling

4. **Feature 4**: Reduced Piles (2 hours)
   - `--quick-game` flag parsing
   - Victory pile size configuration
   - Help text updates

5. **Feature 2**: Stable Numbers (3 hours partial)
   - Stable number mapping
   - Display formatting

### Week 2: Advanced Features (11 hours)
6. **Feature 2**: Stable Numbers (3 hours completion)
   - Input parsing for stable numbers
   - Help command reference
   - Testing edge cases

7. **Feature 3**: Chained Submission (8 hours)
   - Chain parsing (comma/space separated)
   - Transaction/rollback mechanism
   - Error handling and messages
   - Integration testing

### Total: 28 hours

---

## Updated Effort Estimates

| Feature | Original | Updated | Reason |
|---------|----------|---------|--------|
| Feature 1 | 4 hrs | 4 hrs | Unchanged (command-based) |
| Feature 2 | 8 hrs | 6 hrs | Simpler (no hybrid) |
| Feature 3 | 6 hrs | 8 hrs | More complex (rollback) |
| Feature 4 | 2 hrs | 2 hrs | Unchanged |
| Feature 5 | - | 5 hrs | New feature (VP display) |
| Feature 6 | - | 3 hrs | New feature (auto-skip) |
| **Total** | **20 hrs** | **28 hrs** | +40% |

---

## Key Implementation Notes

### Auto-Play Treasures
- **NOT automatic** - requires command
- Commands: `treasures`, `t`, `play all`, `all`
- Individual play still available
- Show summary after playing

### Stable Numbering
- **Simple display** - no hybrid
- Format: `[7] Play Village`
- Gaps are normal (non-consecutive)
- Opt-in via `--stable-numbers` flag

### Chained Submission
- **Full rollback** on any error
- Save state before chain starts
- If any move fails, restore saved state
- Detailed error: which move failed, why, that all rolled back

### Reduced Piles
- **Victory cards only** (Estate, Duchy, Province)
- Villages are kingdom cards - not reduced
- All kingdom cards stay at 10
- Treasures unchanged

### Victory Points
- **Always visible** in header
- Format: "VP: 5 (3E, 1D)" or "Victory Points: 5 VP"
- Calculate from entire deck (hand + draw + discard + in-play)
- Update after buy/gain
- Show in `hand` and `status` commands

### Auto-Skip Cleanup
- **Auto-execute** when no choices required
- Display cleanup summary: "✓ Cleanup: Discarded N cards, drew 5 new cards"
- Immediately advance to next turn (< 100ms)
- Opt-out via `--manual-cleanup` flag
- Future-proof for cards with cleanup decisions

---

## Testing Requirements

### Unit Tests (per feature)
- Feature 1: Command parsing, treasure playing, display
- Feature 2: Stable number mapping, gaps, help text
- Feature 3: Chain parsing, rollback, error messages
- Feature 4: Flag parsing, pile configuration
- Feature 5: VP calculation, display, updates
- Feature 6: Auto-skip detection, cleanup summary, manual flag

### Integration Tests
- All features together
- VP updates when chaining buy moves
- Stable numbers in chained input
- Performance with all features enabled

### Regression Tests
- Existing CLI functionality unchanged
- Backward compatibility without flags
- Standard game rules preserved

---

## Configuration Summary

### Command-Line Flags

```bash
npm run play -- [options]

Options:
  --seed=<string>         Game seed for deterministic randomness
  --players=<number>      Number of players (default: 1)
  --quick-game            Reduce victory piles to 8 for faster games
  --stable-numbers        Enable stable card numbering for AI agents
  --manual-cleanup        Disable auto-skip of cleanup phase
  --help                  Show help message
```

### In-Game Commands

```
Commands:
  <number>           Execute numbered move
  <n1>, <n2>, ...    Execute chain of moves (with rollback)
  treasures / t      Play all treasures at once
  play all / all     Alternative to 'treasures'
  help               Show help
  help stable        Show stable number reference (if enabled)
  hand               Show current hand (includes VP)
  status             Show player status (includes VP)
  supply             Show supply piles
  quit / exit        Exit game
```

---

## Ready for Implementation

All requirements are finalized. No blocking questions remain.

**Next Actions**:

1. **dev-agent**: Begin implementation starting with Feature 1
2. **test-architect**: Write test specifications for all 5 features
3. **requirements-architect**: Update CLAUDE.md with Phase 1.5 features

---

## Files to Modify

### Core Files
- `packages/cli/src/parser.ts` - Chain parsing, command recognition
- `packages/cli/src/display.ts` - Stable numbers, VP display
- `packages/cli/src/cli.ts` - Command handling, transaction logic
- `packages/cli/src/game-state.ts` - VP calculation
- `packages/core/src/game.ts` - Supply configuration (quick-game)

### New Files
- `packages/cli/src/transaction.ts` - Rollback mechanism for chains
- `packages/cli/src/vp-calculator.ts` - Victory points logic

### Documentation
- `CLAUDE.md` - Update with new features
- `CLI_PHASE2_*.md` - All requirements docs (updated)
- `STABLE_NUMBER_REFERENCE.md` - Stable number mappings (updated)

---

## Success Criteria

**Feature 1**: ✓ User can type `treasures` to play all at once
**Feature 2**: ✓ Stable numbers never change across turns
**Feature 3**: ✓ Chains rollback completely on any error
**Feature 4**: ✓ `--quick-game` reduces victory piles only
**Feature 5**: ✓ VP always visible in game header
**Feature 6**: ✓ Cleanup auto-executes when no choices exist

**Integration**: ✓ All features work together without conflicts
**Performance**: ✓ < 100ms per turn with all features enabled
**Regression**: ✓ Existing CLI functionality unchanged

---

## Document References

- [CLI_PHASE2_REQUIREMENTS.md](/Users/eddelord/Documents/Projects/principality_ai/CLI_PHASE2_REQUIREMENTS.md) - Full technical requirements
- [CLI_PHASE2_VISUAL_GUIDE.md](/Users/eddelord/Documents/Projects/principality_ai/CLI_PHASE2_VISUAL_GUIDE.md) - Visual examples and mockups
- [CLI_PHASE2_TEST_SPEC.md](/Users/eddelord/Documents/Projects/principality_ai/CLI_PHASE2_TEST_SPEC.md) - Test specifications
- [STABLE_NUMBER_REFERENCE.md](/Users/eddelord/Documents/Projects/principality_ai/STABLE_NUMBER_REFERENCE.md) - Stable number mappings
- [CLAUDE.md](/Users/eddelord/Documents/Projects/principality_ai/CLAUDE.md) - Project conventions

---

**Status**: APPROVED - All clarifications received, ready to begin development
