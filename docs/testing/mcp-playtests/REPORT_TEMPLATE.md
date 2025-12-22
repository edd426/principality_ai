# Playtest Report Template

Use this template when writing playtest reports. Copy the structure below.

---

```markdown
# Playtest Report: [SCENARIO-ID]

**Date**: YYYY-MM-DD
**Scenario**: [Scenario name from SCENARIOS.md]
**Model**: [haiku/sonnet/opus]
**Game ID**: [from game_session response]

---

## Summary

| Metric | Value |
|--------|-------|
| Result | [completed/crashed/stuck] |
| Turns | [number] |
| Final VP | [number or N/A] |
| Errors Found | [number] |
| UX Issues | [number] |

### One-Line Summary
[Brief description of what happened]

---

## Game Log

### Key Turns
[List notable turns with brief descriptions]

| Turn | Action | Observation |
|------|--------|-------------|
| 1 | Bought X | Normal |
| 5 | Played Y | Unexpected behavior: ... |

---

## Issues Found

### Errors (Tool/Game failures)

#### [ERROR-001]: [Brief title]
- **Turn**: [when it occurred]
- **Move attempted**: [what was tried]
- **Response**: [what happened]
- **Expected**: [what should have happened]
- **Severity**: [blocker/major/minor]

### UX Issues (Confusion, unclear feedback)

#### [UX-001]: [Brief title]
- **Context**: [what was happening]
- **Problem**: [what was confusing]
- **Suggestion**: [how to improve]
- **Severity**: [high/medium/low]

---

## Scenario-Specific Observations

### [Scenario Focus Area]
[Observations related to the specific scenario goal]

- Did the tested feature work correctly?
- Any edge cases discovered?
- Recommendations for follow-up testing?

---

## Tool Feedback

### What Worked Well
- [Positive observations about MCP tools]

### What Could Improve
- [Suggestions for tool improvements]

---

## Raw Data (Optional)

<details>
<summary>Full move sequence</summary>

```
Turn 1: end (action phase, no actions)
Turn 1: play_treasure all → 4 coins
Turn 1: buy Silver
...
```

</details>

<details>
<summary>Final game state</summary>

```json
{
  "phase": "...",
  "turnNumber": ...,
  "gameOver": true,
  ...
}
```

</details>
```

---

## Report Naming Convention

Save reports as:
```
docs/testing/mcp-playtests/reports/YYYY-MM-DD-HHMMSS-[SCENARIO-ID].md
```

Examples:
- `2025-12-21-134523-CARD-001.md` (Chapel test at 13:45:23)
- `2025-12-21-162045-STRAT-002.md` (Engine strategy test at 16:20:45)
- `2025-12-21-091512-UX-001.md` (UX discovery test at 09:15:12)

---

## Severity Definitions

### Errors
| Severity | Definition |
|----------|------------|
| Blocker | Game cannot continue, crash, or infinite loop |
| Major | Wrong behavior but game continues |
| Minor | Cosmetic or edge case issue |

### UX Issues
| Severity | Definition |
|----------|------------|
| High | Model consistently confused, likely to fail |
| Medium | Occasional confusion, recoverable |
| Low | Minor friction, suggestions for polish |
