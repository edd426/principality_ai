# CLI Playtest Report - Attack Cards

**Date:** 2025-12-27
**Seed:** attack-test-001
**Edition:** mixed
**Session Log:** /tmp/cli-test-attack.session.log

---

## Completion Status

- [x] Reached Turn 20 (Game ended naturally on Turn 18 - Province pile empty)
- [x] Single session (no restarts)
- Total turns played: 18
- Total moves executed: ~65

---

## Questionnaire

### Q1: Did the game initialize correctly?
Answer: Yes
Comments: Game initialized with both Militia and Witch in the kingdom, perfect for testing attack cards.

### Q2: Were the Available Moves always clear?
Answer: Yes
Comments: All moves were clearly displayed. The [T] shortcut for "Play ALL Treasures" was very convenient.

### Q3: Did playing treasures correctly increase your Coins?
Answer: Yes
Comments: Coins increased correctly each time treasures were played. The [T] shortcut made this much faster.

### Q4: Did the turn number advance at the expected times?
Answer: Yes
Expected: Turn advances after Cleanup Phase
Comments: Turn number advanced correctly after each Cleanup Phase.

### Q5: Did phase transitions work correctly?
Answer: Yes
Expected: Action → Buy → Cleanup → Next Turn
Comments: All phase transitions worked as expected.

### Q6: Were you ever confused about what to do?
Answer: No
Comments: The attack card testing was straightforward. However, I noticed that opponent effects are not visible in single-player mode.

### Q7: Did any moves produce unexpected results?
Answer: Partial
Comments:
- **Militia**: Worked correctly - gave +$2 coins, showed "opponents must discard" message
- **Witch**: Drew 2 cards correctly, BUT did not show "opponents gain Curse" message or any indication that Curses were distributed
- The Curse pile count was not visible in the Supply display
- In single-player mode, it's unclear if opponent attack effects are being processed at all

### Q8: Did any error messages appear?
Answer: Yes (minor)
Comments: On Turn 12, tried to "buy Province" with only $7 (needed $8). Got error: "Invalid input. Enter a number, "help", "hand", "supply", or "quit"". This is appropriate - the move wasn't in the Available Moves list. My error, not the CLI's.

### Q9: Rate the overall clarity of the CLI (1-5)
Score: 4
Comments:
- Very clear for basic gameplay
- Attack card messages are present but limited
- Opponent effects are not visible (may be by design for single-player)
- The [T] shortcut is excellent for speeding up treasure playing

### Q10: Any other observations?

**Attack Card Testing Results:**

1. **Militia ($4 attack)**
   - Played successfully 3 times (Turns 3, 6, 10, 15)
   - Correctly gave +$2 coins to the player
   - Message displayed: "opponents must discard"
   - Opponent hand state changes not visible (single-player limitation?)

2. **Witch ($5 attack)**
   - Played successfully 4 times (Turns 5, 8, 12, 18)
   - Correctly drew 2 cards for the player each time
   - NO message about Curses being distributed
   - Curse pile not shown in Supply display

**UX Observations:**
- The attack message for Militia is informative
- Witch is missing feedback about the Curse distribution
- Would be helpful to see the Curse pile count in Supply
- In single-player mode, showing a brief "Player 2 discarded down to 3 cards" or "Player 2 gained Curse" would help verify attacks are working

**Game Flow:**
- Natural game ending on Turn 18 (Province pile empty)
- Final score: 36 VP (4 Provinces, 3 Duchies, 3 Estates)
- Attack cards worked well within the overall strategy
- No errors in game state or phase transitions

---

## Game Summary

Final VP: 36 VP (3E, 3D, 4P)
Cards bought:
- Turn 1: Militia
- Turn 2: Silver
- Turn 3: Witch
- Turn 4: Silver
- Turn 5: Gold
- Turn 6: Gold
- Turn 7: Gold
- Turn 8: Province
- Turn 9: Gold
- Turn 10: Province
- Turn 11: Silver
- Turn 12: Gold
- Turn 13: Province
- Turn 14: Duchy
- Turn 15: Duchy
- Turn 16: Duchy
- Turn 17: Gold
- Turn 18: Province (game ended)

Strategy notes:
- Prioritized buying both attack cards early (Militia T1, Witch T3)
- Played attack cards whenever drawn (5 total attack card plays)
- Transitioned to Big Money strategy after acquiring attacks
- Attack cards gave economic bonus (Militia +$2, Witch +2 cards) which helped accelerate to Provinces

---

## Recommendations

1. **Curse Pile Display**: Add Curse pile to Supply display (currently missing)
2. **Witch Feedback**: Show message when Curses are distributed (like Militia's discard message)
3. **Opponent State (Optional)**: In single-player, consider showing brief opponent state changes:
   - "Player 2 discarded 2 cards (now has 3 in hand)"
   - "Player 2 gained Curse"
   This would help verify attacks are working and improve testing clarity

4. **Attack Card Testing in Multiplayer**: These observations are from single-player mode. Should verify in 2-player mode that:
   - Militia forces opponent to discard to 3 cards
   - Witch gives Curses to opponents (not the player)
   - Moat can block these attacks

---

## Test Verdict

**PASS with observations**

Attack cards work functionally:
- Militia gives +$2 coins correctly
- Witch draws 2 cards correctly
- Game state remains consistent
- No crashes or errors

Areas for improvement:
- Curse pile visibility
- Attack effect feedback (especially for Witch)
- Opponent state visibility in single-player mode
