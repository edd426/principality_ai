# CLI Playtest Report: Error Recovery

**Date:** 2025-12-27
**Seed:** cli-errors-001
**Edition:** 2E
**Session Log:** /tmp/cli-test-c.session.log

---

## Completion Status

- [x] Reached Turn 20 (actually reached Turn 27)
- [x] Single session (no restarts)
- Total turns played: 27
- Total moves executed: ~85 (estimated from session)

---

## Error Testing Summary

This playtest specifically tested error handling by intentionally making invalid moves. All 5 planned error scenarios were tested:

### Error Test Results

| Test | Move Attempted | Error Message | Recovery |
|------|---------------|---------------|----------|
| 1. Invalid number | `--move "99"` | `Error: Invalid move command: "99"` | Successful |
| 2. Wrong card name | `--move "buy Silvr"` | `Error: Invalid move command: "buy Silvr"` | Successful |
| 3. Buy too expensive | `--move "buy Province"` (with $3) | `Error: Invalid move command: "buy Province"` | Successful |
| 4. Invalid command | `--move "attack"` | `Error: Invalid move command: "attack"` | Successful |
| 5. Wrong phase | `--move "buy Silver"` in Action Phase | `Error: Invalid move command: "buy Silver"` | Successful |

---

## Questionnaire

### Q1: Did the game initialize correctly?
Answer: Yes

The game initialized properly with the specified seed and edition.

### Q2: Were the Available Moves always clear?
Answer: Yes

The Available Moves list was always present and accurate. It updated correctly after each move to reflect the current game state.

### Q3: Did playing treasures correctly increase your Coins?
Answer: Yes

Each treasure card played increased coins as expected:
- Copper: +$1
- Silver: +$2
- Gold: +$3

### Q4: Did the turn number advance at the expected times?
Answer: Yes

Expected: Turn advances after Cleanup Phase
The turn counter incremented correctly after each Cleanup Phase ended.

### Q5: Did phase transitions work correctly?
Answer: Yes

Expected: Action → Buy → Cleanup → Next Turn
All phase transitions worked as expected throughout the entire game.

### Q6: Were you ever confused about what to do?
Answer: No

The error messages and Available Moves list made it clear what was valid. The CLI prevented all invalid actions before they could corrupt the game state.

### Q7: Did any moves produce unexpected results?
Answer: No

All valid moves produced expected results. All invalid moves were rejected with error messages.

### Q8: Did any error messages appear?
Answer: Yes (intentionally)

All 5 error scenarios produced the same error format:
```
Error: Invalid move command: "<attempted move>"
```

**Observations:**
- The error message is consistent across all error types
- The game state is always displayed after an error
- The Available Moves list is shown, helping the user understand what's valid
- The game never crashed or became unplayable after an error
- Exit code 1 is returned for errors (proper error signaling)

### Q9: Rate the overall clarity of the CLI (1-5)
Score: 4/5

Comments:
The CLI is very clear and functional. The error handling is robust - all invalid moves were caught before execution. The consistent error message format works well.

**Minor improvement suggestion:** The error message could be more specific. For example:
- Current: `Error: Invalid move command: "buy Province"`
- Better: `Error: Cannot buy Province - not enough coins (have $3, need $8)`
- Or: `Error: Invalid move number "99" - only 1 move available`

However, since the Available Moves list is always shown after an error, users can still understand what went wrong.

### Q10: Any other observations?

**Positive findings:**
1. **Resilient error handling:** The game recovered perfectly from every error. No state corruption occurred.
2. **Session logging:** The session log captured all errors with timestamps, which is valuable for debugging.
3. **No restart needed:** Despite 5 intentional errors, the game continued smoothly without requiring reinitialization.
4. **Clear feedback loop:** Error → Show state → Show valid moves → User tries again. This is good UX.

**Error message consistency:**
All errors produced the same generic message. This is simple but works because:
- The game state is preserved and displayed
- Available Moves shows what's actually valid
- Users can always recover by picking a valid move

**Performance:**
Even with rapid sequential commands, the CLI remained responsive and accurate.

---

## Game Summary

Final VP: 3 VP (3 Estates)
Cards bought: 4 Silver, 1 Gold (approximate count)
Strategy notes: Simple Big Money strategy. Focused on buying Silver/Gold when possible.

**Note:** The game was played beyond turn 20 (to turn 27) due to the automated script continuing past the target. All error testing was completed within the first 5 turns, and the remaining turns verified continued stability.

---

## Detailed Error Analysis

### Error Pattern

All error scenarios followed this pattern:
1. Invalid move submitted
2. CLI validates the move
3. Error message displayed
4. Current game state displayed
5. Available Moves list displayed
6. Exit code 1 returned
7. Game state preserved (no corruption)
8. Next valid move accepted normally

### Error Recovery Success Rate

**5/5 errors recovered successfully (100%)**

No errors required:
- Game restart
- Manual state file editing
- Special recovery commands

The CLI's error handling is production-ready for preventing invalid moves.

---

## Recommendations

### Keep Current Design
1. Generic error message is acceptable given the Available Moves list
2. Always showing game state after errors is helpful
3. Non-zero exit codes for errors enable scripting

### Consider Enhancements
1. **More specific error messages** for better user experience:
   - "Cannot afford [card] - have $X, need $Y"
   - "Invalid move number - choose 1-N"
   - "Cannot buy in Action Phase - end phase first"

2. **Error categories in session log** for analysis:
   - Add error type field: INVALID_MOVE_NUMBER, INVALID_CARD_NAME, etc.
   - Helps identify common user mistakes

3. **Suggestion system** for typos:
   - "buy Silvr" → "Did you mean: Silver?"
   - Would require fuzzy matching (low priority)

### Session Log Format
The session log format is excellent. It captures:
- Timestamp for each action
- Full command with arguments
- Complete output including errors
- Exit codes and success status

This is valuable for both debugging and user behavior analysis.
