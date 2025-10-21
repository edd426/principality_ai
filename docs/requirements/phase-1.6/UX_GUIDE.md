# Phase 1.6 UX Guide: Card Help Lookup System

**Status**: DRAFT
**Created**: 2025-10-20
**Phase**: 1.6

---

## Introduction

This guide defines the user experience for Phase 1.6's card help lookup system. It provides visual mockups, command syntax, error messages, and interaction patterns to ensure a consistent, intuitive interface.

**Audience**: Developers implementing the CLI, testers validating UX, and future documentation writers.

---

## Command Reference

### `help <card>` Command

**Purpose**: Display information about a specific card

**Syntax**:
```
help <card_name>
h <card_name>        (short alias)
```

**Parameters**:
- `<card_name>`: Name of the card (case-insensitive)

**Examples**:
```
help Village
help VILLAGE         (case-insensitive)
h Smithy             (using alias)
help Estate
```

---

### `cards` Command

**Purpose**: Display a catalog of all available cards

**Syntax**:
```
cards
```

**Parameters**: None

**Examples**:
```
cards                (shows full catalog)
```

---

## Visual Mockups

### Mockup 1: `help` Command - Success

**Scenario**: Player looks up Village card during action phase

```
=== TURN 1 | ACTION PHASE | Player 1 ===
Actions: 1  Buys: 1  Coins: 0

Your Hand:
  1. Copper   2. Copper   3. Estate   4. Village   5. Smithy

Supply:
  Village (10)  Smithy (10)  Market (10)  ...

> help Village

Village | 3 | Action | +1 Card, +2 Actions

> _
```

**Key UX Elements**:
- Help output is a single line
- Format: `Name | Cost | Type | Effect`
- Separators use pipe (`|`) with spaces for readability
- Game context (turn, phase, hand) remains visible above
- Prompt returns immediately after output
- No visual clutter or extra formatting

---

### Mockup 2: `help` Command - Unknown Card Error

**Scenario**: Player types invalid card name

```
> help Villag

Unknown card: Villag. Type 'cards' to see all available cards.

> _
```

**Key UX Elements**:
- Error message is clear and actionable
- Echoes the invalid input so user knows what was wrong
- Suggests using `cards` command (teaches discovery)
- No harsh ERROR or WARNING prefixes (friendly tone)
- User can immediately try again

---

### Mockup 3: `help` Command - Missing Argument

**Scenario**: Player types `help` without card name

```
> help

Usage: help <card_name> - Display information about a specific card
Example: help Village

> _
```

**Key UX Elements**:
- Usage message format: `Usage: <syntax> - <description>`
- Provides concrete example
- Concise (2 lines)
- Teaches correct syntax

---

### Mockup 4: `cards` Command - Full Catalog

**Scenario**: Player wants to browse all available cards

```
> cards

=== AVAILABLE CARDS ===

Name          | Cost | Type     | Effect
--------------|------|----------|------------------------------------------
Cellar        |  2   | Action   | +1 Action. Discard any number, draw that many.
Village       |  3   | Action   | +1 Card, +2 Actions
Woodcutter    |  3   | Action   | +1 Buy, +2 Coins
Smithy        |  4   | Action   | +3 Cards
Laboratory    |  5   | Action   | +2 Cards, +1 Action
Festival      |  5   | Action   | +2 Actions, +1 Buy, +2 Coins
Market        |  5   | Action   | +1 Card, +1 Action, +1 Buy, +1 Coin
Council Room  |  5   | Action   | +4 Cards, +1 Buy. Each other player draws 1.
Copper        |  0   | Treasure | Worth 1 coin
Silver        |  3   | Treasure | Worth 2 coins
Gold          |  6   | Treasure | Worth 3 coins
Estate        |  2   | Victory  | Worth 1 VP
Duchy         |  5   | Victory  | Worth 3 VP
Province      |  8   | Victory  | Worth 6 VP
Curse         |  0   | Curse    | Worth -1 VP

> _
```

**Key UX Elements**:
- Clear section header: `=== AVAILABLE CARDS ===`
- Table with 4 columns: Name, Cost, Type, Effect
- Header row with column names
- Separator line using dashes and pipes
- Data rows aligned with consistent column widths
- Cards sorted: Action → Treasure → Victory → Curse
- Within each type, sorted by cost (ascending)
- No pagination (all cards visible at once)
- Clean, scannable layout

---

### Mockup 5: `help` Alias Usage

**Scenario**: Player uses short alias during buy phase

```
=== TURN 1 | BUY PHASE | Player 1 ===
Actions: 0  Buys: 1  Coins: 3

> h Silver

Silver | 3 | Treasure | Worth 2 coins

> _
```

**Key UX Elements**:
- `h` works identically to `help`
- Same output format
- No indication that it's an alias (transparent to user)

---

## Table Formatting Specifications

### Column Widths

**Column 1: Name** - 14 characters (left-aligned)
```
"Village       "  (7 chars + 7 spaces)
"Council Room  "  (12 chars + 2 spaces)
```

**Column 2: Cost** - 4 characters (center-aligned)
```
" 0  "
" 3  "
" 10 "  (future-proofing for costs > 9)
```

**Column 3: Type** - 9 characters (left-aligned)
```
"Action   "
"Treasure "
"Victory  "
"Curse    "
```

**Column 4: Effect** - Remaining width (left-aligned, no padding)
```
"Worth 1 coin"
"+3 Cards"
"+4 Cards, +1 Buy. Each other player draws 1."
```

### Separator Line

```
--------------|------|----------|------------------------------------------
```

- Uses dashes (`-`) to match column widths
- Uses pipes (`|`) to match column separators
- Aligns exactly with header and data rows

### Padding

**Before pipe**: 1 space
**After pipe**: 1 space

**Example**:
```
Village       | 3    | Action   | +1 Card, +2 Actions
^^^^^^^^^^^^^   ^      ^^^^^^^^
14 chars        4      9 chars
```

---

## Error Messages

### Error 1: Unknown Card

**Format**:
```
Unknown card: {input}. Type 'cards' to see all available cards.
```

**Examples**:
```
Unknown card: Villag. Type 'cards' to see all available cards.
Unknown card: FakeCard. Type 'cards' to see all available cards.
Unknown card: 123. Type 'cards' to see all available cards.
```

**Tone**: Friendly, helpful, actionable

---

### Error 2: Missing Argument

**Format**:
```
Usage: help <card_name> - Display information about a specific card
Example: help Village
```

**Trigger**: User types `help` with no card name

**Tone**: Instructive, provides example

---

### Error 3: System Error (Fallback)

**Format**:
```
Error: Unable to retrieve card information. Please try again.
```

**Trigger**: Unexpected error (missing description, etc.)

**Tone**: Polite, generic (for rare cases)

---

## User Workflows

### Workflow 1: New Player Learning Cards

**Scenario**: Player starting their first game wants to learn available cards

```
Step 1: Start game
> npm run play -- --seed=tutorial

Step 2: Browse all cards
> cards
[Table of all 15 cards displayed]

Step 3: Learn specific card
> help Village
Village | 3 | Action | +1 Card, +2 Actions

Step 4: Learn another card
> h Smithy
Smithy | 4 | Action | +3 Cards

Step 5: Start playing
> 4
[Plays Village card]
```

**Time**: ~1-2 minutes to browse and learn

---

### Workflow 2: Experienced Player Quick Reference

**Scenario**: Player forgets exact effect of a card mid-game

```
Step 1: During action phase, unsure about Market
> h Market
Market | 5 | Action | +1 Card, +1 Action, +1 Buy, +1 Coin

Step 2: Make decision
> 3
[Plays Market card]
```

**Time**: ~5 seconds

---

### Workflow 3: Buy Phase Decision Making

**Scenario**: Player deciding what to buy with limited coins

```
Step 1: Check available budget
[Buys: 1  Coins: 5]

Step 2: Browse options
> cards
[Sees all cards with costs]

Step 3: Compare cards
> help Laboratory
Laboratory | 5 | Action | +2 Cards, +1 Action

> help Market
Market | 5 | Action | +1 Card, +1 Action, +1 Buy, +1 Coin

Step 4: Make purchase
> buy Market
```

**Time**: ~30 seconds

---

### Workflow 4: Recovering from Typo

**Scenario**: Player makes typo in card name

```
Step 1: Typo
> help Vilage

Step 2: See error
Unknown card: Vilage. Type 'cards' to see all available cards.

Step 3: Correct spelling
> help Village
Village | 3 | Action | +1 Card, +2 Actions
```

**Time**: ~10 seconds

---

## Interaction Patterns

### Pattern 1: Non-Intrusive Help

**Principle**: Help commands don't interrupt game flow

**Implementation**:
- No screen clearing
- No fullscreen overlays
- Output appears inline
- Game state visible above and below
- Prompt returns immediately
- Player can continue playing

**Example**:
```
[Game state visible]
> help Village
Village | 3 | Action | +1 Card, +2 Actions
> [player continues]
```

---

### Pattern 2: Consistent Formatting

**Principle**: All help output follows same format

**Implementation**:
- Always: `Name | Cost | Type | Effect`
- Always: Proper case for card name (even if input was lowercase)
- Always: Single line output
- Always: Pipe separators with spaces

**Example**:
```
> help village          (lowercase input)
Village | 3 | Action | +1 Card, +2 Actions   (proper case output)
```

---

### Pattern 3: Discoverability

**Principle**: Commands suggest related commands

**Implementation**:
- Unknown card error suggests `cards` command
- `help` usage message shows example
- `cards` catalog shows all available cards

**Example Chain**:
```
> help Fake                 (unknown card)
Unknown card: Fake. Type 'cards' to see all available cards.

> cards                     (user learns about command)
[Full catalog shown]

> help Village              (user finds correct card)
Village | 3 | Action | +1 Card, +2 Actions
```

---

### Pattern 4: Case-Insensitive Flexibility

**Principle**: Accept any case variation to reduce friction

**Implementation**:
- `village`, `VILLAGE`, `Village`, `ViLLaGe` all work
- Output always uses proper case (as defined in code)
- No error for case mismatch

**Example**:
```
> help SMITHY
Smithy | 4 | Action | +3 Cards

> h smithy
Smithy | 4 | Action | +3 Cards
```

---

## Accessibility Considerations

### Screen Reader Compatibility

**Table Format**:
- Use ASCII characters (no box-drawing Unicode)
- Screen readers can navigate line-by-line
- Clear column headers

**Help Output**:
- Single line format is screen-reader friendly
- Pipe separators create natural pauses

### Keyboard-Only Navigation

**All commands are keyboard-based**:
- No mouse required
- Type command and press Enter
- Works in any terminal emulator

### Visual Clarity

**Contrast**:
- Use standard terminal colors (no custom colors in Phase 1.6)
- High contrast with default terminal backgrounds

**Spacing**:
- Adequate spacing between columns
- Clear visual separation with pipes

---

## Terminal Compatibility

### Minimum Terminal Width

**Requirement**: 80 characters

**Table Width Calculation**:
```
Name (14) + Cost (4) + Type (9) + Effect (30) + Separators (9) = ~66 chars
```

**Fits comfortably in 80-column terminal** ✓

### Maximum Effect Length

**Longest Effect**: Council Room (~50 characters)
```
"+4 Cards, +1 Buy. Each other player draws 1."
```

**Still fits in standard terminal** ✓

### Terminal Emulators Tested

Should work on:
- macOS Terminal
- iTerm2
- Windows Terminal
- VS Code Integrated Terminal
- Linux terminals (xterm, gnome-terminal, etc.)

---

## Command Help Integration

### Update General Help Command

When player types `help` (no arguments), include new commands:

```
Available Commands:
  help <card>  - Display information about a specific card
  h <card>     - Alias for help
  cards        - Display catalog of all available cards
  hand         - Display your current hand
  supply       - Display available cards in supply
  status       - Display game status
  quit         - Quit the game
```

**Note**: `help` with no args shows command list. `help <card>` shows card info.

---

## Future UX Enhancements (Out of Scope)

These are NOT in Phase 1.6 but could be considered later:

**Phase 2+**:
- Color coding by card type (Actions=green, Treasures=yellow, etc.)
- Partial name matching (`help vil` suggests Village)
- Filter by properties (`cards --actions`, `cards --cost=3`)
- Interactive catalog (arrow keys to browse)
- Card art/icons (ASCII art representations)
- Strategic hints in help text
- Comparison mode (`compare Village Smithy`)

---

## UX Testing Checklist

Manual testing to verify UX quality:

### Visual Testing
- [ ] Table columns align vertically
- [ ] No text wrapping or overflow
- [ ] Separator line matches header
- [ ] Effects are fully visible (no truncation)
- [ ] Fits in 80-column terminal

### Interaction Testing
- [ ] `help` command responds instantly (< 5ms)
- [ ] `cards` command responds instantly (< 10ms)
- [ ] Commands work during all game phases
- [ ] Commands don't interrupt game flow
- [ ] Prompt returns immediately after output

### Error Testing
- [ ] Unknown card shows helpful error
- [ ] Missing argument shows usage message
- [ ] Typos are clearly reported
- [ ] Error messages are friendly (not harsh)

### Usability Testing
- [ ] New player can discover all cards via `cards`
- [ ] Experienced player can quickly look up a card
- [ ] Alias `h` works as expected
- [ ] Case variations accepted
- [ ] Help text is accurate and clear

---

## Documentation Updates Required

After Phase 1.6 implementation, update:

**CLI README** (`packages/cli/README.md`):
- Add `help` and `cards` to command list
- Include examples
- Document aliases

**DEVELOPMENT_GUIDE** (`docs/reference/DEVELOPMENT_GUIDE.md`):
- Add section on card help system
- Include usage examples
- Note where to add new card descriptions

**Main README** (`README.md`):
- Update "Getting Started" with help commands
- Add screenshot of `cards` output (optional)

---

## Conclusion

Phase 1.6's UX design prioritizes:
1. **Simplicity**: Two commands (`help`, `cards`) with clear syntax
2. **Discoverability**: Error messages guide users to correct commands
3. **Consistency**: Predictable formatting and behavior
4. **Non-intrusiveness**: Help doesn't interrupt gameplay
5. **Accessibility**: Works in any terminal, keyboard-only, screen-reader friendly

**Implementation Note**: Stick to these specifications for Phase 1.6. Enhanced UX features (colors, interactivity, etc.) can be added in later phases once the foundation is solid.
