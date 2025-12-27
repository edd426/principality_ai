# Playtest: UX-001 Move Syntax Discovery

**Date**: 2025-12-25
**Seed**: `mixed-test-0`
**Edition**: `mixed`
**Game ID**: game-1766641653993-m4gzt13gl

## Purpose
Test which move syntax formats are accepted by the game engine and document error messages for invalid formats.

---

## MOVE SYNTAX TEST RESULTS

### End Phase Commands

| Syntax | Phase | Result | Error Message | Notes |
|--------|-------|--------|---------------|-------|
| `end` | Action | SUCCESS | — | Standard format works |
| `end` | Buy | SUCCESS | — | Standard format works |
| `end_phase` | Action | SUCCESS | — | Underscore format also works |
| `end_phase` | Buy | SUCCESS | — | Underscore format also works |
| `end phase` | Action | SUCCESS | — | Space-separated format works! |
| `end phase` | Buy | SUCCESS | — | Space-separated format works! |

**Key Finding**: All three formats work: `end`, `end_phase`, `end phase`

---

### Treasure Playing Commands

| Syntax | Phase | Card | Result | Error Message | Notes |
|--------|-------|------|--------|---------------|-------|
| `play_treasure Copper` | Buy | Copper | SUCCESS | — | Explicit treasure card works |
| `play_treasure copper` | Buy | Copper | SUCCESS | — | Lowercase card name works |
| `play_treasure all` | Buy | Multiple | SUCCESS | — | Batch command works, plays all at once |
| `play_treasure all` | Action | Multiple | FAILED | "Cannot play treasures in Action phase." | Good error message |
| `play_treasure Copper` | Action | Copper | FAILED | "Invalid move: \"play_treasure Copper\" is not legal in current game state." + helpful suggestion | Clear phase error |
| `play treasures` | Buy | Multiple | FAILED | "Invalid index: treasures. Must be 0-0" | Wrong syntax, not recognized |
| `play 0` | Buy | Estate | FAILED | "Card at index 0 (Estate) is not playable" | Index format works but checks card type |

**Key Finding**:
- Explicit `play_treasure CardName` is the standard format
- Batch `play_treasure all` works and is efficient
- Lowercase card names are normalized
- Index-based `play 0` doesn't work for treasures in buy phase

---

### Buy Commands

| Syntax | Phase | Card | Result | Error Message | Notes |
|--------|-------|------|--------|---------------|-------|
| `buy Copper` | Buy | Copper | SUCCESS | — | Standard format works |
| `buy copper` | Buy | Copper | SUCCESS | — | Lowercase works |
| `buy COPPER` | Buy | Copper | SUCCESS | — | ALL CAPS works |
| `buy  Copper` | Buy | Copper | SUCCESS | — | Extra whitespace tolerated |
| `buy Silver` | Buy | Silver | SUCCESS | — | Standard format works |
| `buy_card Copper` | Buy | Copper | FAILED | "Cannot parse move: \"buy_card Copper\". Invalid format." | Underscore format NOT supported |
| `purchase Copper` | Buy | Copper | FAILED | "Cannot parse move: \"purchase Copper\". Invalid format." | Alternate verb not supported |
| `buy Coppers` | Buy | Copper | FAILED | "Cannot buy \"Coppers\": not in supply" | Plural not recognized |
| `buy InvalidCard` | Buy | InvalidCard | FAILED | "Cannot buy \"Invalidcard\": not in supply" | Non-existent cards caught |
| `buy Gold` | Buy | Gold | FAILED | "Invalid move: \"buy Gold\" is not legal in current game state." + lists valid purchases | Insufficient coins error is clear |
| `buy Copper` | Buy | Copper | FAILED | "Invalid move: \"buy Copper\" is not legal in current game state." | Out of buys error (0 buys left) |

**Key Finding**:
- Only `buy CardName` format works
- Case-insensitive (copper, Copper, COPPER all work)
- Whitespace is trimmed
- Clear error messages for invalid cards or insufficient resources
- Helpful suggestions showing available cards

---

### Index-Based Play Commands

| Syntax | Phase | Card @ Index | Result | Error Message | Notes |
|--------|-------|--------------|--------|---------------|-------|
| `play 0` | Buy | Estate | FAILED | "Card at index 0 (Estate) is not playable" | System validates card type |

**Key Finding**: Index-based format doesn't work in buy phase (treasures need explicit `play_treasure`)

---

### Action Card Commands

| Syntax | Phase | Card | Result | Error Message | Notes |
|--------|-------|------|--------|---------------|-------|
| `play_action Copper` | Action | Copper | FAILED | "Cannot play action \"Copper\": not in hand or not an action card" | System validates card type |

**Key Finding**: `play_action CardName` format exists but requires actual action cards

---

### Edge Cases

| Syntax | Result | Error Message | Notes |
|--------|--------|---------------|-------|
| (empty string) | FAILED | "Cannot parse move: \"\". Invalid format." | Empty commands rejected cleanly |
| Spaces in card names | N/A | — | Not tested (no spaces in card names) |
| Trailing/leading spaces | N/A | — | Not tested directly |

---

## ERROR MESSAGE QUALITY ASSESSMENT

### Helpful Error Messages (5/5)
- **Phase errors**: "Cannot play treasures in Action phase. You're in action phase - play action cards or \"end\" to move to buy phase."
- **Insufficient coins**: Shows list of valid purchases with costs
- **Card not found**: "Cannot buy \"Invalidcard\": not in supply"
- **Suggestions**: Examples provided for correct syntax

### Less Helpful
- None observed - error messages are consistently good

---

## SUMMARY OF VALID SYNTAX

### Commands That Work

**End Phase (any of these work)**:
- `end`
- `end_phase`
- `end phase`

**Play Treasures**:
- `play_treasure CardName` (case-insensitive)
- `play_treasure all` (batch command)

**Buy Cards**:
- `buy CardName` (case-insensitive)

**Notes**:
- Card names are case-insensitive (copper = Copper = COPPER)
- Extra whitespace is trimmed
- Underscore variants (buy_card, purchase) NOT supported

### Commands That Don't Work

- `play_action CardName` (when card is not an action)
- `buy_card CardName` (use `buy` instead)
- `purchase CardName` (use `buy` instead)
- `play treasures` (use `play_treasure all` or individual cards)
- `play 0` for treasures (use `play_treasure CardName`)

---

## RECOMMENDATIONS FOR DOCUMENTATION

1. **Recommend single format**: Use `play_treasure all` in buy phase (clearest, fastest)
2. **Document flexibility**: Players can use `end`, `end_phase`, or `end phase` interchangeably
3. **Case handling**: Mention that card names are case-insensitive
4. **Error messages**: Current messages are helpful - no changes needed

---

## CONCLUSION

The move parser is **robust and user-friendly**:
- Multiple valid syntaxes for end phase reduce friction
- Case-insensitive card names are forgiving
- Error messages guide players to correct syntax
- Batch command (`play_treasure all`) provides efficiency

**No bugs detected** - all failures were for truly invalid moves. Error messages correctly guide users to valid alternatives.
