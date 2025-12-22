---
name: playtest
description: Run exploratory MCP game tests using parallel Haiku agents. Spawns 3 agents for convergence-based bug detection. Use when testing card mechanics, finding bugs, or validating MCP tools. Invoke with scenario ID or card name.
---

# Playtest Skill

Automated exploratory testing using parallel Haiku agents to find bugs in the MCP game tools.

## Quick Start

```
/playtest CARD-003        # Run specific scenario
/playtest Mine            # Test a specific card
/playtest --all-cards     # Run all card scenarios
```

## How It Works

1. **Spawn 3 parallel agents** running the same scenario
2. **Compare results** for convergence
3. **Apply trust calibration** based on agreement
4. **Verify against logs** if issues found

## Trust Calibration

| Agreement | Confidence | Action |
|-----------|------------|--------|
| 0/3 report issue | ~95% no bug | Move on |
| 1/3 report issue | ~40% real | Verify in logs |
| 2/3 report issue | ~75% real | Investigate |
| 3/3 report issue | ~95% real | Fix it |

## Execution Steps

### Step 1: Identify Scenario

Map input to scenario ID:
- `CARD-001` through `CARD-010` → Card-specific tests
- `STRAT-001` through `STRAT-004` → Strategy tests
- `EDGE-001` through `EDGE-007` → Edge case tests
- Card name (e.g., "Mine") → Map to relevant CARD-* scenario

See [docs/testing/mcp-playtests/SCENARIOS.md] for full list.

### Step 2: Craft Mechanical Prompt

Convert conceptual scenario to mechanical instructions:

**Template:**
```
Run [SCENARIO-ID]: [Card Name]

STRATEGY (follow this exactly):
- Turn 1-N: [Specific buy order]
- When [Card] in hand: [Exact action sequence]
- After [condition]: [Next phase strategy]

Play for 15 turns or until game ends.
Report any bugs with exact error messages.
```

**Example for Mine (CARD-003):**
```
Run CARD-003: Mine Treasure Upgrading

STRATEGY (follow this exactly):
- First: Buy Silver until you have 5+ coins
- Then: Buy Mine (cost 5)
- When Mine is in hand during action phase:
  1. Play Mine
  2. When prompted, choose a treasure to trash
  3. Pick Copper (to gain Silver) or Silver (to gain Gold)
- Continue buying Silver/Gold/Province as coins allow

Play for 15 turns or until game ends.
Report any bugs with the pending effect flow.
```

### Step 3: Spawn Parallel Agents

```typescript
// Spawn 3 agents in background
Task(subagent_type: "game-tester", run_in_background: true, prompt: "[mechanical prompt]")
Task(subagent_type: "game-tester", run_in_background: true, prompt: "[mechanical prompt]")
Task(subagent_type: "game-tester", run_in_background: true, prompt: "[mechanical prompt]")
```

### Step 4: Collect Results

Wait for all agents to complete, then retrieve results:

```typescript
TaskOutput(task_id: "[id1]", block: true)
TaskOutput(task_id: "[id2]", block: true)
TaskOutput(task_id: "[id3]", block: true)
```

### Step 5: Analyze Convergence

Compare results across agents:

1. **Count issues reported** - How many agents hit the same problem?
2. **Check error specificity** - Exact error messages quoted?
3. **Assess agent behavior** - Did they follow instructions?

### Step 6: Verify if Needed

If 2+ agents report same issue:

1. Check `dominion-game-session.log` for ground truth
2. Grep codebase for relevant parser/handler
3. Confirm bug exists before fixing

## Report Format

Present results as:

```markdown
## Playtest Results: [SCENARIO-ID]

| Agent | Result | Issue Reported |
|-------|--------|----------------|
| 1 | Completed/Stuck | [description or "None"] |
| 2 | Completed/Stuck | [description or "None"] |
| 3 | Completed/Stuck | [description or "None"] |

### Convergence Analysis
- **Agreement**: X/3 agents report [issue]
- **Confidence**: [High/Medium/Low] based on trust matrix
- **Recommendation**: [Investigate/Verify/Dismiss]

### Verification (if needed)
- Log check: [findings]
- Code check: [findings]
```

## Scenario Quick Reference

| ID | Card/Focus | Key Mechanic |
|----|------------|--------------|
| CARD-001 | Chapel | Trash up to 4 cards |
| CARD-002 | Throne Room | Play action twice |
| CARD-003 | Mine | Trash treasure → gain better |
| CARD-004 | Cellar | Discard and draw |
| CARD-005 | Workshop | Gain card up to $4 |
| CARD-006 | Witch | Give curse to opponent |
| CARD-007 | Militia | Opponent discards to 3 |
| CARD-008 | Council Room | +4 cards, +1 buy |
| CARD-009 | Laboratory | +2 cards, +1 action |
| CARD-010 | Festival | +2 coins, +2 actions, +1 buy |

## Cost Estimate

- Per scenario: ~$0.05-0.15 (3 Haiku runs)
- Full card suite (10 scenarios): ~$0.50-1.50
- With verification: Add ~5 min human time

## When to Use

- **Before merging** card mechanic changes
- **After implementing** new pending effects
- **Weekly** regression sweep
- **When investigating** reported issues
