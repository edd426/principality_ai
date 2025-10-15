# Stable Number Reference

**Purpose**: Quick reference for stable card numbering system (CLI Phase 2 Feature)

**Status**: Proposed - Not yet implemented

---

## What Are Stable Numbers?

Stable numbers are fixed identifiers assigned to each card type that **never change** across turns, phases, or game states. This makes it easier for AI agents to learn consistent strategies.

**Example**:
- Village is always `[7]` or `S7`
- Whether you have 1 Village or 3 Villages in hand
- Whether it's turn 1 or turn 20
- The stable number for Village never changes

---

## Stable Number Mapping

### Action Cards (1-10)

| Number | Card | Cost | Effect |
|--------|------|------|--------|
| `1` | Cellar | $2 | +1 Action, Discard any number, draw that many |
| `2` | Council Room | $5 | +4 Cards, +1 Buy |
| `3` | Festival | $5 | +2 Actions, +$2, +1 Buy |
| `4` | Laboratory | $5 | +2 Cards, +1 Action |
| `5` | Market | $5 | +1 Card, +1 Action, +$1, +1 Buy |
| `6` | Smithy | $4 | +3 Cards |
| `7` | Village | $3 | +1 Card, +2 Actions |
| `8` | Woodcutter | $3 | +$2, +1 Buy |
| `9-10` | *(Reserved for future cards)* | - | - |

**Alphabetical Order**: Action cards sorted alphabetically

---

### Treasure Cards (11-13)

| Number | Card | Cost | Value |
|--------|------|------|-------|
| `11` | Copper | $0 | +$1 |
| `12` | Silver | $3 | +$2 |
| `13` | Gold | $6 | +$3 |

**Sorted by Value**: Copper < Silver < Gold

---

### Buy Moves - Treasures (21-23)

| Number | Card | Cost |
|--------|------|------|
| `21` | Buy Copper | $0 |
| `22` | Buy Silver | $3 |
| `23` | Buy Gold | $6 |

---

### Buy Moves - Victory Cards (24-26)

| Number | Card | Cost | VP |
|--------|------|------|-----|
| `24` | Buy Estate | $2 | 1 |
| `25` | Buy Duchy | $5 | 3 |
| `26` | Buy Province | $8 | 6 |

---

### Buy Moves - Kingdom Cards (27-34)

| Number | Card | Cost |
|--------|------|------|
| `27` | Buy Cellar | $2 |
| `28` | Buy Council Room | $5 |
| `29` | Buy Festival | $5 |
| `30` | Buy Laboratory | $5 |
| `31` | Buy Market | $5 |
| `32` | Buy Smithy | $4 |
| `33` | Buy Village | $3 |
| `34` | Buy Woodcutter | $3 |

**Alphabetical Order**: All buy moves sorted alphabetically

---

### Special Moves (50+)

| Number | Move | Description |
|--------|------|-------------|
| `50` | End Phase | Always available, advances to next phase |
| `51` | *(Reserved)* | Future special moves |

---

## Usage Examples

### Standard Mode (Sequential Numbers)

```
Available Moves:
  [1] Play Village
  [2] Play Smithy
  [3] End Phase

> 1
✓ Played Village
```

### Stable Numbering Mode

```
Available Moves:
  [7] Play Village
  [6] Play Smithy
  [50] End Phase

> 7
✓ Played Village
```

**Note**: Numbers are not consecutive (gaps are normal)

### Hybrid Mode (Recommended)

```
Available Moves:
  [1] (S7) Play Village
  [2] (S6) Play Smithy
  [3] (S50) End Phase

> 1          ← Sequential number
✓ Played Village

> S6         ← Stable number
✓ Played Smithy
```

**Accepts both**: Sequential `[1, 2, 3]` AND stable `[S7, S6, S50]`

---

## When to Use Stable Numbers

### Best For

✅ **AI Agents**: Consistent number → card mapping for learning
✅ **Scripted Play**: Writing automated game scripts
✅ **Strategy Analysis**: Comparing strategies across games
✅ **Debugging**: Reproducible move sequences

### Not Ideal For

❌ **Casual Human Play**: Gaps in numbering can be confusing
❌ **First-time Players**: Extra cognitive load to learn mappings
❌ **Quick Games**: Sequential numbers are faster to scan

---

## Enabling Stable Numbers

### Command-Line Flag

```bash
npm run play -- --stable-numbers
```

### In-Game Help

```
> help stable

Stable Number Reference:
  Actions:     1-10  (alphabetical)
  Treasures:   11-13 (by value)
  Buy Moves:   21-34 (alphabetical)
  End Phase:   50

Type the stable number (e.g., "7" for Village)
or use "S7" format in hybrid mode.
```

---

## AI Agent Quick Reference

### Common Action Sequences

| Strategy | Stable Number Chain | Description |
|----------|-------------------|-------------|
| Village → Smithy | `7, 6` | Enable card draw |
| Laboratory Chain | `4, 4, 4` | Play all Labs |
| Market → End | `5, 50` | Market then buy phase |
| Skip Actions | `50` | Go straight to buy |

### Common Buy Patterns

| Purchase | Stable Number | When to Buy |
|----------|--------------|-------------|
| Silver | `22` | Early game ($3+) |
| Village | `33` | Build action engine |
| Smithy | `32` | Build draw engine |
| Province | `26` | End game ($8+) |

---

## Implementation Notes

### For Developers

**Mapping Storage**:
```typescript
const STABLE_NUMBERS = {
  // Action cards (alphabetical)
  'Cellar': 1,
  'Council Room': 2,
  'Festival': 3,
  'Laboratory': 4,
  'Market': 5,
  'Smithy': 6,
  'Village': 7,
  'Woodcutter': 8,

  // Treasures (by value)
  'Copper': 11,
  'Silver': 12,
  'Gold': 13,

  // Buy moves (alphabetical, offset by 20)
  'Buy Copper': 21,
  'Buy Silver': 22,
  // ... etc

  // Special moves
  'End Phase': 50
};
```

**Reverse Lookup**:
```typescript
const STABLE_NUMBER_TO_CARD = Object.fromEntries(
  Object.entries(STABLE_NUMBERS).map(([card, num]) => [num, card])
);
```

---

## Future Expansion

### Phase 2+ Cards

When new cards are added:

- **Reserve numbers**: 9-10 (actions), 14-20 (treasures), 35-49 (buys)
- **Maintain alphabetical**: Insert new cards in sorted order
- **Renumber if needed**: Update reference doc, increment version
- **Backward compatibility**: Old stable numbers deprecated gracefully

### Example: Adding "Chapel" (trashing card)

- **Alphabetical position**: Between Cellar (1) and Council Room (2)
- **Options**:
  - A) Shift all cards down, Chapel becomes 2 (breaks compatibility)
  - B) Assign Chapel to reserved slot 9 (maintains compatibility)
- **Recommendation**: Option B, update reference with note

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-10-05 | Initial draft (not yet implemented) |

---

## See Also

- [CLI_PHASE2_REQUIREMENTS.md](/Users/eddelord/Documents/Projects/principality_ai/CLI_PHASE2_REQUIREMENTS.md) - Full feature requirements
- [API_REFERENCE.md](/Users/eddelord/Documents/Projects/principality_ai/API_REFERENCE.md) - Game engine API
- [CARD_CATALOG.md](/Users/eddelord/Documents/Projects/principality_ai/CARD_CATALOG.md) - All card details
