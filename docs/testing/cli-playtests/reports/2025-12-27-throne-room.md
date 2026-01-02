# CLI Playtest Report - Throne Room

**Date:** 2025-12-27
**Seed:** throne-room-test-001
**Edition:** mixed
**Session Log:** /tmp/cli-test-throne.session.log

---

## Completion Status

- [x] Reached Turn 20
- [x] Single session (no restarts)
- Total turns played: 20
- Total moves executed: ~80

---

## Questionnaire

### Q1: Did the game initialize correctly?
Answer: Yes
If No, what happened: N/A

### Q2: Were the Available Moves always clear?
Answer: Yes
If No, describe unclear moments: N/A

### Q3: Did playing treasures correctly increase your Coins?
Answer: Yes
If No, describe what happened: N/A

### Q4: Did the turn number advance at the expected times?
Answer: Yes
Expected: Turn advances after Cleanup Phase
If No, when did it advance unexpectedly: N/A

### Q5: Did phase transitions work correctly?
Answer: Yes
Expected: Action → Buy → Cleanup → Next Turn
If No, describe the issue: N/A

### Q6: Were you ever confused about what to do?
Answer: No
If Yes, describe the confusion and how you resolved it: N/A

### Q7: Did any moves produce unexpected results?
Answer: No
If Yes, list the move and what happened: N/A

### Q8: Did any error messages appear?
Answer: No
If Yes, quote the error and what caused it: N/A

### Q9: Rate the overall clarity of the CLI (1-5)
Score: 5
Comments: The Throne Room mechanic was implemented very clearly. When played, it prompted with "(select action to play twice)" and showed only valid actions that could be played twice.

### Q10: Any other observations?
Yes - several positive observations about Throne Room implementation:

**Throne Room Mechanic Test Results:**

Turn 5 was the critical test moment where I had both Throne Room and Workshop in hand:

1. **Played Throne Room** - Output: "Player 1 played Throne Room (select action to play twice)"
2. **Available Moves showed**: "[1] Play twice: Workshop"
3. **Selected Workshop** - First play: "Player 1 played Workshop (gain card up to $4, waiting for gain_card move)"
4. **Gained Silver** - Silver supply went from 38 → 37
5. **Second automatic play**: "Player 1 played Workshop (gain card up to $4, waiting for gain_card move)"
6. **Gained Silver again** - Silver supply went from 37 → 36

**Result**: Workshop was successfully played TWICE, each time allowing me to gain a card up to $4. The mechanic worked perfectly.

**UX Observations:**
- The "(select action to play twice)" message was clear and informative
- The "Play twice: [card name]" format in Available Moves was unambiguous
- The two separate "Player 1 played Workshop" messages confirmed both plays occurred
- Supply counts decremented correctly (38 → 37 → 36 Silvers)
- No confusion about whether the effect happened once or twice

**Edge Case Tested:**
On Turns 9, 11, and 18, I had Throne Room in hand but NO other action cards. The CLI correctly handled this by:
- Showing "[1] Play Throne Room" as an available move
- Allowing me to skip it with "End Phase"
- Not forcing me to play Throne Room when it would have no effect

---

## Game Summary

Final VP: 33 VP (3E, 2D, 4P)
Cards bought:
- Turn 1: Throne Room
- Turn 2: Workshop
- Turns 3-8: Silvers (building economy)
- Turn 7: Gold
- Turn 9: Duchy
- Turns 10, 14, 15: Provinces
- Turn 16: Duchy
- Turn 20: Province (game-ending)

Strategy notes:
- Successfully tested Throne Room + Workshop combo on Turn 5
- Throne Room played Workshop twice, gaining 2 Silvers
- Built strong Silver economy which accelerated Province purchases
- Game ended exactly on Turn 20 when Province pile emptied
- Workshop's "gain card up to $4" was triggered twice by Throne Room as expected

**Test Objective Achieved**: Throne Room's "play an action card twice" mechanic functions correctly in the CLI.
