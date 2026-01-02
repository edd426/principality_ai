# CLI Playtest Report - Chapel Trashing

**Date:** 2025-12-27
**Seed:** chapel-test-001
**Edition:** mixed
**Session Log:** /tmp/cli-test-chapel.session.log

---

## Completion Status

- [x] Reached Turn 20
- [x] Single session (no restarts)
- Total turns played: 20
- Total moves executed: 63

---

## Critical Issue: Chapel Not Available

**BLOCKER:** Chapel was not present in the kingdom supply for this test.

**Test Objective:** Test Chapel's multi-step trashing mechanic (trash up to 4 cards)

**What Happened:** The game initialized with seed `chapel-test-001` and edition `mixed`, but the kingdom cards were:
- Cellar, Council Room, Feast, Library, Market, Mine, Moneylender, Smithy, Spy, Workshop

Chapel was not among the 10 kingdom cards, making it impossible to test the Chapel trashing mechanic as intended.

**Root Cause:** The seed/edition combination did not guarantee Chapel would be in the kingdom. The test scenario assumed a specific card would be present, but randomized kingdom selection prevented this.

**Recommended Fix:**
1. Add CLI option to force specific cards into kingdom (e.g., `--include-card Chapel`)
2. OR document which seeds include which cards
3. OR use a non-randomized kingdom setup for targeted card testing

---

## Questionnaire

### Q1: Did the game initialize correctly?
Answer: **Partially**
If No, what happened: The game initialized and ran correctly, but Chapel was not in the kingdom supply despite the test being designed to test Chapel mechanics. The initialization itself worked fine from a technical perspective.

### Q2: Were the Available Moves always clear?
Answer: **Yes**
The Available Moves list was always clear and showed exactly what actions could be taken. The `[T] Play ALL Treasures` shortcut was particularly helpful.

### Q3: Did playing treasures correctly increase your Coins?
Answer: **Yes**
Playing treasures with the `[T]` shortcut correctly increased Coins. For example:
- Turn 1: 3 Copper → $3
- Turn 2: 4 Copper → $4
- Turn 4: 3 Copper + 1 Silver → $5
- Turn 20: 4 Copper + 1 Silver → $6

### Q4: Did the turn number advance at the expected times?
Answer: **Yes**
Expected: Turn advances after Cleanup Phase
The turn number consistently advanced after completing the Cleanup Phase, going from Turn 1 → Turn 2 → ... → Turn 20 → Turn 21 as expected.

### Q5: Did phase transitions work correctly?
Answer: **Yes**
Expected: Action → Buy → Cleanup → Next Turn
All phase transitions worked perfectly. The pattern was consistent:
1. Action Phase (no actions to play, ended phase)
2. Buy Phase (played treasures, optionally bought, ended phase)
3. Cleanup Phase (ended phase)
4. Next turn began

### Q6: Were you ever confused about what to do?
Answer: **No**
The CLI output was clear throughout. Once I realized Chapel wasn't available, I simply played through using basic Big Money strategy. The Available Moves list made it impossible to be confused about valid actions.

### Q7: Did any moves produce unexpected results?
Answer: **No**
All moves worked as expected:
- `end` ended the current phase
- `T` played all treasures in hand
- `buy Silver` purchased Silver when affordable
- All commands executed correctly

### Q8: Did any error messages appear?
Answer: **No**
No errors occurred during the entire 20-turn playthrough.

### Q9: Rate the overall clarity of the CLI (1-5)
Score: **5/5**
Comments: The CLI is extremely clear. The turn/phase header, hand display, coins/buys/actions counters, and Available Moves list all combine to make the game state completely transparent. The `[T] Play ALL Treasures` shortcut is excellent UX.

### Q10: Any other observations?

**Positive Observations:**
1. The CLI handled 20+ turns without any stability issues
2. The session log was successfully created at `/tmp/cli-test-chapel.session.log`
3. The `[T]` shortcut for playing all treasures is a massive UX improvement
4. Phase transitions are clearly marked and easy to follow
5. The turn counter is always visible and accurate

**Issues:**
1. **No way to guarantee specific cards in kingdom for testing** - This is the main blocker for targeted card testing
2. **Limited strategic play occurred** - Only bought 3 Silver cards total across 20 turns because I didn't implement smart buying logic in my automation script
3. **Deck composition unclear** - The CLI shows hand and supply, but not discard pile or draw pile size, making it hard to track deck composition

**Suggestions:**
1. Add `--force-kingdom "Card1,Card2,..."` CLI option for testing
2. Consider showing deck stats: "Deck: 10 cards | Discard: 5 cards | In hand: 5"
3. Add a "show deck composition" command (e.g., `--stats`) to see all cards owned

---

## Game Summary

Final VP: **3 VP** (3 Estate)
Cards bought:
- Turn 1: Silver
- Turn 2: Silver
- Turn 4: Silver
- Turns 5-20: No purchases (automation skipped buying)

Strategy notes:
Due to Chapel not being available, I played basic Big Money strategy. However, my automation script did not implement purchasing logic for turns 5-20, so I only accumulated treasures without buying victory cards. In a real game, I would have purchased Gold and Province cards as coins accumulated.

---

## Test Outcome

**Result:** INCONCLUSIVE - Chapel trashing mechanic could not be tested

**Reason:** Chapel was not available in the kingdom supply

**CLI Functionality:** All tested CLI features worked correctly (phase transitions, treasure playing, basic buying, turn progression)

**Next Steps:**
1. Implement CLI option to force specific cards into kingdom
2. Re-run test with `--include-card Chapel` or similar mechanism
3. OR identify a seed that is known to include Chapel

---

## Session Log Evidence

The session log at `/tmp/cli-test-chapel.session.log` contains 2,979 lines documenting the entire playthrough. Key evidence:

```bash
$ wc -l /tmp/cli-test-chapel.session.log
2979

$ grep "bought" /tmp/cli-test-chapel.session.log
✓ Player 1 bought Silver
✓ Player 1 bought Silver
✓ Player 1 bought Silver

$ grep -c "✓" /tmp/cli-test-chapel.session.log
63
```

This confirms:
- 3 total purchases (all Silver)
- 63 successful move executions
- Complete session documented in log
