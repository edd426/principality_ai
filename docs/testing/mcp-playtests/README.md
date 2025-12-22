# MCP Playtest System

Automated game testing using AI subagents to find bugs and usability issues in the MCP game tools.

---

## Overview

This system spawns Haiku model subagents to play Dominion games via MCP tools. The goal is to:
1. **Find bugs** - Errors, crashes, incorrect behavior
2. **Test usability** - Can a naive model use the tools correctly?
3. **Cover edge cases** - Unusual game states and interactions

The agents intentionally do **NOT** use strategy documents, testing whether the tools are intuitive enough for any model.

---

## Quick Start

### Run a Single Test

From a Claude Code session:

```
Use the Task tool to spawn a game-tester agent:
- subagent_type: "game-tester"
- model: "haiku"
- prompt: "Run scenario STRAT-001 (Pure Big Money). Play a complete game buying only treasures and victory cards. Write report to docs/testing/mcp-playtests/reports/2025-12-21-STRAT-001-001.md"
```

### Run Multiple Tests in Background

```
Spawn multiple game-tester agents with run_in_background: true:
1. Task(subagent: game-tester, model: haiku, run_in_background: true, prompt: "Run CARD-001...")
2. Task(subagent: game-tester, model: haiku, run_in_background: true, prompt: "Run CARD-002...")
3. Task(subagent: game-tester, model: haiku, run_in_background: true, prompt: "Run EDGE-001...")

Later, use TaskOutput to collect results.
```

### Collect Results

```
TaskOutput(task_id: "agent-xxx", block: true) → Get full report
```

---

## Directory Structure

```
docs/testing/mcp-playtests/
├── README.md           # This file
├── SCENARIOS.md        # Test scenario definitions
├── REPORT_TEMPLATE.md  # Template for agent reports
└── reports/            # Agent-generated reports
    └── YYYY-MM-DD-SCENARIO-RUN.md
```

---

## Test Scenarios

See [SCENARIOS.md](./SCENARIOS.md) for full list. Categories:

| Category | Prefix | Purpose |
|----------|--------|---------|
| Card-focused | CARD-* | Test specific card mechanics |
| Strategy | STRAT-* | Test different play styles |
| Edge cases | EDGE-* | Test unusual game states |
| Usability | UX-* | Test tool discoverability |

### Recommended Test Suites

**Quick Validation** (5 min):
- STRAT-001 (Big Money - simple)
- EDGE-005 (No valid actions)

**Card Coverage** (30 min):
- CARD-001 through CARD-010

**Stress Test** (15 min):
- EDGE-004 (Large hands)
- STRAT-002 (Engine building)

**Full Suite** (1 hour):
- All scenarios

---

## Report Format

See [REPORT_TEMPLATE.md](./REPORT_TEMPLATE.md) for full template.

Key sections:
- **Summary**: Result, turns, VP, error/UX issue counts
- **Issues Found**: Errors and UX issues with details
- **Tool Feedback**: What worked, what could improve

### Naming Convention

```
YYYY-MM-DD-HHMMSS-SCENARIO.md

Examples:
- 2025-12-21-134523-CARD-001.md
- 2025-12-21-162045-STRAT-002.md
```

---

## Subagent Configuration

The `game-tester` agent is defined in `.claude/agents/game-tester.md`:

- **Model**: Haiku (fast, cheap, tests tool simplicity)
- **Tools**: MCP game tools only (game_session, game_observe, game_execute)
- **No strategy docs**: Tests raw usability

---

## Verifying Reports Against Server Logs

**IMPORTANT**: Haiku reports are the agent's *interpretation* of what happened. Always verify against the actual MCP server logs before filing bugs.

### Log File Location

The MCP server logs all requests and responses to:
```
dominion-game-session.log
```

Located in either:
- Current working directory, OR
- System temp directory (`/tmp/dominion-game-session.log`)

### What the Logs Contain

```
[2025-12-21T14:05:23.456Z] [INFO] Move executed {"move":"end","phase":"action","result":"success"}
[2025-12-21T14:05:23.789Z] [INFO] Phase changed {"from":"action","to":"buy"}
[2025-12-21T14:05:24.012Z] [WARN] Invalid move attempted {"move":"play_treasure Copper","phase":"action"}
```

### Verification Process

1. **Run the playtest** → Agent generates report
2. **Check the log file** → See actual requests/responses
3. **Compare** → Does Haiku's report match reality?

| If Haiku Says... | Check Log For... | Likely Cause |
|------------------|------------------|--------------|
| "Phase jumped unexpectedly" | Phase change sequence | Agent confusion or real bug |
| "Move rejected incorrectly" | WARN entries with move details | Agent sent wrong move |
| "Started 2 games" | Multiple "New game started" entries | Agent error (not a bug) |

### Trust Hierarchy

1. **MCP Server Logs** (ground truth) - What actually happened
2. **Raw JSON in report** - What agent claims it received
3. **Agent narrative** - Agent's interpretation (least reliable)

### Common Haiku Mistakes (Not Bugs)

- Starting multiple game sessions
- Not reading `validMoves` before moving
- Spamming "end" without checking phase
- Misinterpreting phase transition messages

---

## Interpreting Results

### Success Indicators
- Game completed without errors
- Agent understood moves from validMoves
- No confusion about phase transitions
- Log file shows clean request/response flow

### Failure Indicators
- Tool call errors
- Agent got stuck or confused
- Incorrect game state after moves
- Game crashed or hung
- Log shows unexpected errors

### Actionable Feedback
- **Confirmed bugs** (verified in logs) → Fix in game engine or MCP server
- **Agent confusion** (logs show correct responses) → Improve agent instructions
- **UX issues** (logs show unclear messages) → Improve tool responses

---

## Best Practices

### For Test Design
1. Keep scenarios focused (test one thing)
2. Include expected behavior in instructions
3. Specify edge cases to try

### For Running Tests
1. Run in background for parallel execution
2. Use unique run numbers per scenario
3. Collect all reports before analyzing

### For Analyzing Results
1. Look for patterns across multiple runs
2. Prioritize blockers over minor issues
3. File bugs for confirmed errors

---

## Adding New Scenarios

1. Add to [SCENARIOS.md](./SCENARIOS.md) with:
   - Unique ID (e.g., CARD-011)
   - Focus area
   - Instructions
   - What to watch for

2. Test manually first to verify feasibility

3. Run with Haiku to validate

---

## Troubleshooting

### Agent Gets Stuck
- Check if game is in unexpected state
- Look at validMoves in last response
- May indicate tool bug

### Agent Writes Invalid Moves
- Check move syntax against validMoves
- May indicate UX issue with tool responses

### No Report Generated
- Agent may have crashed
- Check TaskOutput for error messages
- Consider increasing timeout

---

## Using the /playtest Skill

For semi-automated testing with built-in convergence analysis, use the `/playtest` skill:

```
/playtest CARD-003        # Run specific scenario
/playtest Mine            # Test a specific card
```

The skill automates:
1. Spawning 3 parallel agents
2. Crafting mechanical prompts
3. Comparing results for convergence
4. Applying trust calibration

See [/.claude/skills/playtest/SKILL.md](/.claude/skills/playtest/SKILL.md) for details.

---

## Methodology

For guidance on when to trust agent reports vs. verify against logs, see [METHODOLOGY.md](./METHODOLOGY.md).

Key principles:
- **Convergence**: 3/3 agents reporting same issue = high confidence
- **Verification**: Always check logs before trusting single-agent reports
- **Mechanical instructions**: Step-by-step procedures work better than conceptual guidance

---

## Related Documentation

- [Methodology](./METHODOLOGY.md) - Trust calibration and verification process
- [Playtest Skill](/.claude/skills/playtest/SKILL.md) - Semi-automated testing
- [Game-tester agent](/.claude/agents/game-tester.md) - Agent definition
- [MCP Server code](../../packages/mcp-server/)
- [Session reports](../sessions/)
