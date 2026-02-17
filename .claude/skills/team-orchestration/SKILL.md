---
name: team-orchestration
description: >
  Coordinates multi-agent teams for parallel development tasks.
  Designs team composition, task dependencies, and file ownership.
  Use when spawning agent teams, coordinating parallel work, or
  planning multi-agent sessions. Triggers on requests involving
  "team", "agents", "parallel", "swarm", or "coordinate".
---

# Team Orchestration

Coordinate agent teams for parallel development on this project. Handles team composition, task design, dependency management, and agent lifecycle.

## Quick Start

```
1. Design team composition (match agents to work)
2. Create tasks with dependencies (TaskCreate + TaskUpdate)
3. Spawn teammates (Task tool with team_name)
4. Monitor, message, and shut down when done
```

## Team Design Workflow

### Step 1: Analyze the Work

Classify each unit of work:

| Work Type | Agent Type | Can Edit Code? | Can Write Tests? |
|-----------|-----------|----------------|------------------|
| Production code | `dev-agent` | Yes | **No** |
| Test specifications | `test-architect` | **No** | Yes |
| Game playtesting | `game-tester` | **No** | **No** (writes reports) |
| General/mixed work | `general-purpose` | Yes | Yes |

**Critical rule**: `dev-agent` cannot write tests. `test-architect` cannot write production code. If your plan needs both, spawn both.

### Step 2: Assign File Ownership

Each teammate should own distinct files. Two agents editing the same file causes conflicts and wasted work.

```
Teammate A ──► packages/api-server/src/services/ai-*.ts
Teammate B ──► packages/api-server/src/services/websocket-*.ts
Teammate C ──► docs/testing/mcp-playtests/reports/
                                     ▲
                               No overlap
```

**Shared files** (like `index.ts` re-exports or `package.json`) should only be touched by one agent, ideally last.

### Step 3: Size Tasks

Target **5-6 tasks per teammate**.

| Too Granular | Sweet Spot | Too Broad |
|-------------|------------|-----------|
| 15+ tiny tasks | 5-6 focused tasks | 1-2 huge tasks |
| Coordination overhead dominates | Clear deliverables per task | Context degrades, hard to recover |

Each task should produce a **verifiable deliverable**: a file, a passing test suite, a report.

### Step 4: Set Dependencies

Use `TaskUpdate` with `addBlockedBy` to encode the dependency graph. Common patterns:

**TDD chain** (most common for this project):
```
Plan (#1) → Write Tests (#2) → Implement (#3) → Integration Tests (#4)
```

**Parallel with shared blocker:**
```
API Contract (#1) ──► WebSocket impl (#2)
                  └──► AI impl (#3)
                  └──► CLI impl (#4)
```

### Step 5: Spawn Teammates

```typescript
Task(
  subagent_type: "dev-agent",
  name: "AI Player",
  team_name: "my-team",
  mode: "plan",              // Requires plan approval before coding
  run_in_background: true,
  prompt: "[detailed context about their tasks and file ownership]"
)
```

**Spawn prompt must include:**
- Which tasks are theirs (by ID)
- Which files they own (and which to avoid)
- How to claim tasks (`TaskUpdate` with owner and status)
- How to run tests (`npm test --workspace=...`)

## Agent Lifecycle

### Idle Notifications

Agents send idle notifications automatically after every turn. This is normal.

- **Idle after sending you a message** = waiting for response (normal)
- **Idle with no remaining tasks** = shut them down
- **Repeated idle spam** = known limitation, send shutdown request

### Shutting Down

Shut down agents **promptly** when their tasks are complete:

```typescript
SendMessage(type: "shutdown_request", recipient: "Agent Name", content: "All tasks done.")
```

Idle agents consume resources and spam notifications. Don't wait.

### Stale Agents Across Sessions

If a conversation ends with agents still running, they become orphaned entries in the team config. `TeamDelete` will refuse to run while they're listed.

**Fix**: Manually edit `~/.claude/teams/{name}/config.json` to remove the stale member from the `members` array (keep only the `team-lead` entry), then call `TeamDelete`.

### Communication

| Situation | Action |
|-----------|--------|
| Approve a plan | `SendMessage(type: "plan_approval_response", ...)` |
| Redirect work | `SendMessage(type: "message", recipient: "Name", ...)` |
| Urgent team-wide | `SendMessage(type: "broadcast", ...)` — use sparingly |
| Agent done | `SendMessage(type: "shutdown_request", ...)` |

## Common Patterns

### TDD Team (dev-agent + test-architect)

This project's standard pattern. See [PATTERNS.md](PATTERNS.md) for details.

```
test-architect writes tests → dev-agent implements against them
```

Spawn test-architect first or in parallel. Dev-agent tasks should be blocked by test tasks.

### Parallel Playtesting

One game per agent. Never ask a game-tester to play multiple games. See [PLAYTESTING.md](PLAYTESTING.md) for details.

```
Playtester-1: "Witch + Moat, seed X, validate Curse gaining"
Playtester-2: "Militia, seed Y, validate discard-to-3"
Playtester-3: "Spy + Thief, seed Z, validate reveal mechanics"
```

### Critical Path Awareness

After creating tasks, identify the bottleneck:

1. Which tasks have the most dependents?
2. Which agent type is blocking others?
3. Can you spawn additional agents to clear the bottleneck?

Example: If all dev-agents are blocked waiting for tests, the test-architect is the critical path. Consider spawning a second test-architect.

## Cleanup

When all tasks are complete:

1. Shut down all remaining teammates
2. Verify build passes: `npm run build`
3. Verify tests pass: `npm run test`
4. Review the task list: `TaskList`
5. Clean up team: `TeamDelete`

## Reference

**Detailed patterns**: [PATTERNS.md](PATTERNS.md) — TDD teams, file ownership, dependency graphs
**Playtesting guide**: [PLAYTESTING.md](PLAYTESTING.md) — parallel game testing, one-game-per-agent rule, Referee agent concept
