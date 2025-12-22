# MCP Playtest Verification Log

Log of verified playtest results comparing agent reports against MCP server logs.

---

## 2025-12-21 Proof of Concept #1

### Tests Run
| Test ID | Agent | Status | Report Written |
|---------|-------|--------|----------------|
| STRAT-001 | Haiku | Stuck (8M+ tokens) | Yes |
| EDGE-005 | Haiku | Completed | Yes |
| UX-001 | Haiku | Unknown | No |

### Verification Summary

**Verified by**: Opus (main session)
**Method**: Cross-referenced agent reports with `dominion-game-session.log`

#### STRAT-001 Report Claims vs Reality

| Claim | Verified | Explanation |
|-------|----------|-------------|
| "Phase management bug" | ❌ FALSE | Agent started multiple games, causing state resets |
| "115 turns without buying" | ❌ AGENT ERROR | Agent spammed "end" without playing treasures first |
| "Game never terminated" | ❌ AGENT ERROR | Agent didn't buy enough cards to trigger end condition |

#### EDGE-005 Report Claims vs Reality

| Claim | Verified | Explanation |
|-------|----------|-------------|
| "Only 'end' available with no actions" | ✅ TRUE | Correct behavior - starting hand has no action cards |
| "Phase transition instability" | ❌ FALSE | Agent confusion about phase structure |
| "Turn jumps" | ❌ FALSE | Agent started multiple game sessions |

### Actual Bugs Found
**None confirmed.** All reported issues were agent confusion, not game engine bugs.

### Actual UX Issues Found
1. **"Cleanup auto-skipped" messaging** - Could be clearer (minor)
2. **phaseChanged field format** - "buy → cleanup" when result is action phase is confusing

---

## 2025-12-21 Proof of Concept #2 (Improved Instructions)

### Tests Run
| Test ID | Agent | Status | Report Written |
|---------|-------|--------|----------------|
| STRAT-001 v2 | Haiku | Completed | No |
| CARD-009 | Haiku | Completed | No |
| UX-002 | Haiku | Completed | Yes |

### Verification Summary

**Verified by**: Opus (main session)
**Method**: Cross-referenced with `dominion-game-session.log` (tail -200)

#### UX-002 Report Claims vs Reality

| Claim | Verified | Explanation |
|-------|----------|-------------|
| "Phase state contradictions" | ❌ FALSE | Agent started multiple games |
| "Turn jumps 3→5, 11→13" | ❌ FALSE | Multiple `game_session new` calls reset state |
| "Cannot play treasure in action phase" | ✅ CORRECT BEHAVIOR | Treasures are buy-phase only |
| "Cleanup handling opaque" | ⚠️ PARTIAL | Messaging could be clearer, but not a bug |

#### CARD-009 (Laboratory) Results

| Action | Result | Verified |
|--------|--------|----------|
| Buy Laboratory (turn 8) | Success | ✅ Confirmed in logs |
| Play Laboratory (turn 10) | Success | ✅ Confirmed in logs |

**Lab chaining not fully tested** - agent ended game early.

### Actual Bugs Found
**None confirmed.**

### Actual UX Issues Found (Legitimate)
1. **phaseChanged message format** - Says "buy → cleanup" but player lands in action phase next turn. Could show full transition: "buy → cleanup → action (turn N+1)"
2. **Cleanup explanation** - "auto-skipped" is confusing. Better: "Cleanup phase completed automatically (no player choices in single-player)"

### Agent Behavior Issues (Not Bugs)
1. **Multiple game sessions** - Despite "ONE GAME ONLY" rule, agents still called `game_session new` multiple times
2. **Phase checking** - Agents don't consistently check `gameState.phase` before moves
3. **Duplicate tool calls** - TaskOutput shows many moves called twice

---

## Cumulative Bug Count

| Category | Count | Details |
|----------|-------|---------|
| **Confirmed Bugs** | 0 | None found |
| **Confirmed UX Issues** | 2 | Phase transition messaging |
| **Agent Confusion** | 8+ | Various misinterpretations |

---

---

## 2025-12-21 Proof of Concept #3 (Mechanical Instructions)

### Tests Run
| Test ID | Agent | Status | Report Written |
|---------|-------|--------|----------------|
| STRAT-001 v3 | Haiku (general-purpose) | ✅ PASS | Yes |

### Verification Summary

**Verified by**: Opus (main session)
**Method**: Cross-referenced with `dominion-game-session.log`

#### What Changed
- Rewrote agent instructions to be mechanical (step-by-step procedure)
- Added real JSON examples with actual request/response pairs
- Added turn template to copy
- Added "Bug vs Mistake" distinction
- Reduced turn limit from 30 to 10-20

#### Results

| Metric | Value |
|--------|-------|
| Turns Completed | 10 |
| Cards Bought | 4 Silver, 4 Gold, 1 Province |
| Bugs Found | 0 |
| Agent Errors | 0 |

**Key Improvement**: Agent followed the turn pattern correctly:
1. `end` (action phase)
2. `play_treasure all` (buy phase)
3. `buy [Card]` (buy phase)
4. `end` (buy phase)

**No phase confusion, no multiple game sessions, no spamming "end".**

### Conclusion

Haiku IS capable of testing when given:
- Mechanical step-by-step instructions
- Real JSON examples to follow
- Clear turn templates
- Explicit "what is a bug vs your mistake" criteria

---

## Cumulative Bug Count

| Category | Count | Details |
|----------|-------|---------|
| **Confirmed Bugs** | 0 | None found |
| **Confirmed UX Issues** | 2 | Phase transition messaging |
| **Agent Confusion (POC 1-2)** | 8+ | Various misinterpretations |
| **Agent Confusion (POC 3)** | 0 | Improved instructions worked |

---

## Recommendations

### For Future Playtests
1. Verify ALL agent claims against server logs before filing bugs
2. Focus on agent issues that are consistent across multiple runs
3. Run same scenario 3+ times to distinguish bugs from agent errors

### For Agent Improvement
1. ✅ Add explicit worked examples to agent instructions
2. ✅ Give agent the `dominion-mechanics` skill
3. ✅ Use simpler, more mechanical turn template
4. ⚠️ Custom agent requires session restart to be recognized

### Agent Setup Note
The `game-tester` agent file exists at `.claude/agents/game-tester.md` but requires a Claude Code session restart to be discovered. Until then, use `general-purpose` agent with embedded instructions.
