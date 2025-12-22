# MCP Playtest Methodology

Guidelines for using LLM agents (Haiku) to find bugs in the game engine via MCP tools.

---

## Trust Calibration

LLM agents can find real bugs but also report false positives due to confusion. Use these signals to calibrate trust:

### High-Trust Signals (Likely Real Bug)

| Signal | Why It's Trustworthy |
|--------|---------------------|
| Multiple agents (3+) report same issue | Convergence across independent runs |
| Exact error message quoted | Verifiable, not interpretation |
| Agent tried multiple syntax variations | Shows systematic exploration |
| Issue is parser/format related | Specific, mechanical failure |
| Claim is verifiable in code/logs | "validMoves contains X but X fails" |

### Low-Trust Signals (Likely Agent Confusion)

| Signal | Why It's Suspicious |
|--------|---------------------|
| Single agent reports issue | Could be one-off confusion |
| Vague claims ("game is broken") | Interpretation, not observation |
| Agent violated its own instructions | e.g., called `game_session new` twice |
| Phase transition complaints | Haiku commonly misunderstands phases |
| "Game skipped my turn" | Usually agent forgot to act |

### Trust Level Matrix

| Agents Reporting | Confidence | Action |
|-----------------|------------|--------|
| 0/3 | ~95% no bug | Move on |
| 1/3 | ~40% real bug | Verify in logs before investigating |
| 2/3 | ~75% real bug | Investigate, likely real |
| 3/3 | ~95% real bug | Almost certainly real, fix it |

---

## Verification Hierarchy

Before trusting an agent report, verify against more reliable sources:

```
1. MCP server logs (dominion-game-session.log)  ← Ground truth
2. Raw JSON in agent reports                     ← What agent claims to have received
3. Agent narrative                               ← Agent's interpretation (least reliable)
```

### Verification Steps

1. **Check the logs**: What moves were actually sent? What responses came back?
2. **Check the code**: Does the parser/formatter handle the reported case?
3. **Reproduce manually**: Can you trigger the same error with the MCP tools directly?

---

## Parallel Testing Strategy

Run multiple agents on the same scenario to leverage convergence:

```
Parallel Ensemble Approach:
├── Spawn 3+ agents for same scenario
├── Run in background (parallel execution)
├── Compare results:
│   ├── Agreement on success → No bug
│   ├── Agreement on specific error → Likely real bug
│   └── Disagreement → Agent confusion, investigate
└── Verify converged issues against logs/code
```

### Example Invocation

```typescript
// Spawn 3 agents for CARD-003 in parallel
Task(subagent_type: "game-tester", run_in_background: true, prompt: "Run CARD-003...")
Task(subagent_type: "game-tester", run_in_background: true, prompt: "Run CARD-003...")
Task(subagent_type: "game-tester", run_in_background: true, prompt: "Run CARD-003...")

// Wait for all to complete, compare results
```

---

## Common Haiku Mistakes (Not Bugs)

These are patterns we've observed where Haiku reports bugs that aren't real:

1. **Multiple game sessions**: Calling `game_session new` more than once
2. **Wrong phase actions**: Trying to play treasures in action phase
3. **Phase misinterpretation**: Thinking phase changed when it didn't
4. **Forgetting to buy**: Ending buy phase without purchasing, then claiming "phase was skipped"
5. **Misreading validMoves**: Sending moves not in the valid list

### Mitigation

The `game-tester` agent definition includes mechanical instructions to prevent these mistakes. See `.claude/agents/game-tester.md`.

---

## Cost-Benefit Analysis: Automated Integration

### Current Approach (Manual)

| Aspect | Value |
|--------|-------|
| Cost per test run | ~$0.01-0.05 (Haiku tokens) |
| Human time | ~5-10 min to review results |
| Coverage | Ad-hoc, developer-initiated |
| Confidence | High with parallel runs + verification |

### Potential Automated Integration

#### Option A: CI/CD Integration (Expensive)

```
On every PR:
├── Run 3 parallel game-tester agents
├── Parse reports for "BUG" mentions
├── Flag PR if 2+ agents report same issue
└── Cost: ~$0.15-0.30 per PR
```

**Pros**: Catches regressions early
**Cons**: High cost at scale, noisy (false positives need human review)

#### Option B: Nightly/Weekly Regression (Moderate)

```
Scheduled job:
├── Run full scenario suite (22 scenarios × 3 agents = 66 runs)
├── Generate summary report
├── Alert on convergent failures
└── Cost: ~$1-3 per run
```

**Pros**: Catches regressions before release, manageable cost
**Cons**: Delayed feedback, still needs human review

#### Option C: Release Gate (Targeted)

```
Before major releases:
├── Run comprehensive playtest suite
├── Human reviews all reports
├── Block release on unresolved critical issues
└── Cost: ~$5-10 per release
```

**Pros**: High confidence before shipping
**Cons**: Only catches issues at release time

#### Option D: Developer-Initiated (Current)

```
When working on card mechanics:
├── Developer spawns relevant card tests
├── Reviews results immediately
├── Fixes issues before committing
└── Cost: ~$0.05-0.20 per feature
```

**Pros**: Immediate feedback, low total cost, targeted
**Cons**: Relies on developer discipline, no automatic regression detection

### Recommendation

**Start with Option D** (current approach) and **add Option B** (weekly regression) once the pending effect parser bug is fixed. The weekly regression provides safety net without CI/CD cost explosion.

Key insight: LLM testing is best for **exploratory testing** (finding unexpected issues) rather than **regression testing** (verifying known behavior). Traditional unit tests are more cost-effective for regressions.

---

## MCP Server Restart Requirement

**After modifying MCP server or core code**, you must restart Claude Code:

1. Run `npm run build` to compile changes
2. Restart Claude Code session
3. MCP tools will load the new code

**Why**: The MCP server runs as a child process of Claude Code with code loaded in memory. Killing the process alone doesn't work - Claude Code won't auto-restart it.

**For testing**: Unit tests run against compiled code directly (no restart needed). Live MCP playtests require restart to pick up changes.

---

## Lessons Learned

### Session: 2025-12-21

1. **Real bug found**: `parseMove` doesn't handle pending effect commands like `select_treasure_to_trash`
2. **Detection method**: 3/3 parallel agents hit same parser error
3. **False positives filtered**: Earlier "phase skip" reports were Haiku confusion
4. **Key insight**: Mechanical agent instructions + parallel runs + log verification = high confidence

### What Worked

- Parallel agent execution for convergence
- Mechanical (not conceptual) agent instructions
- Verification against logs before trusting reports
- Checking actual code to confirm reported issues

### What Didn't Work

- Single agent reports (too many false positives)
- Conceptual instructions ("follow the rules")
- Trusting agent narrative without verification
