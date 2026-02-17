# Team Patterns

Detailed patterns for agent team composition on this project.

## TDD Team Pattern

The standard pattern for implementation work. Two agent types with strict separation.

### Composition

```
test-architect ──► writes test files (src/__tests__/*.test.ts)
dev-agent      ──► writes production code (src/services/*.ts, src/routes/*.ts)
```

### Rules

- `dev-agent` **refuses** to write or modify test files
- `test-architect` **refuses** to write or modify production code
- Both read each other's files for context

### Task Dependency Template

```
#1 [test-architect] Plan and read existing code
#2 [test-architect] Write unit tests           ← blocked by #1
#3 [dev-agent]      Implement feature           ← blocked by #2
#4 [test-architect] Write integration tests     ← blocked by #3
```

### Spawning Order

Spawn test-architect first (or simultaneously). Dev-agent tasks must be blocked until tests exist.

```typescript
// Spawn both, but dev-agent's tasks are blocked by test tasks
Task(subagent_type: "general-purpose",  // for test-architect work
     name: "Test Writer", team_name: "team", run_in_background: true, ...)
Task(subagent_type: "dev-agent",
     name: "Implementer", team_name: "team", mode: "plan", run_in_background: true, ...)
```

### Jest Config Note

In `packages/api-server`, jest roots to `<rootDir>/src`. Tests go in `src/__tests__/`, **not** `tests/unit/`. Other packages may differ — check `jest.config.js` before creating test tasks.

## File Ownership Pattern

### Principle

Every file should have exactly one owner during a team session. Two agents editing the same file wastes work and creates conflicts.

### How to Assign

Map each agent to a set of files in the spawn prompt:

```
YOUR FILES (only you touch these):
- packages/api-server/src/services/websocket-server.ts (create)
- packages/api-server/src/services/turn-coordinator.ts (create)

DO NOT MODIFY:
- packages/core/**
- packages/cli/**
- packages/web/**
```

### Shared Files

Some files need multiple agents' changes (e.g., `index.ts` exports, `package.json` deps). Assign one agent as the sole modifier. Others request changes via messages.

## Dependency Graph Patterns

### Linear Chain

```
#1 → #2 → #3 → #4
```
Use for: Sequential work where each step depends on the previous.

### Fan-Out

```
     #1
    / | \
  #2  #3  #4
```
Use for: One blocker (API contract, planning) followed by parallel implementation. Most common pattern for this project.

### Fan-In

```
  #2  #3  #4
    \ | /
     #5
```
Use for: Integration/E2E testing that depends on multiple implementations completing.

### Diamond

```
     #1
    / \
  #2   #3
    \ /
     #4
```
Use for: Two parallel tracks that must merge (e.g., WebSocket + AI both needed for turn sync).

## Handling Blockers

When a teammate reports a blocker:

1. **Can another teammate resolve it?** → Message them directly
2. **Is it a missing dependency?** → Spawn a new agent or do it yourself
3. **Is it a design question?** → Decide and message back
4. **Is it an agent capability mismatch?** → Reassign to correct agent type (e.g., test task assigned to dev-agent needs reassignment to test-architect)

## Model Selection

| Agent Role | Recommended Model | Rationale |
|-----------|-------------------|-----------|
| Dev implementation | sonnet or opus | Needs strong coding |
| Test writing | sonnet | Good balance |
| Playtesting | haiku | Low cost, mechanical task |
| Code review | opus | Deep reasoning |
| Research/exploration | sonnet | Efficient |

Specify with `model` parameter on the Task tool. Default inherits from parent session.
