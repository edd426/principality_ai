# Parallel Playtesting

Patterns for running multiple game-tester agents in parallel.

## Core Rule: One Game Per Agent

The `game-tester` agent is designed for **one game per invocation**. Its prompt enforces "call `game_session new` EXACTLY ONCE." Asking for multiple games per task causes:

- Confusion about the single-session rule
- Turn-20 limit restarting the same setup repeatedly
- Wasted context on game setup overhead

**Always**: one task = one game = one agent.

## Parallel Playtesting Workflow

### Step 1: Define Scenarios

Each scenario targets a specific card or mechanic with a known seed:

```
Scenario A: Witch + Moat interaction, seed "mixed-test-0", edition "mixed"
Scenario B: Militia discard-to-3, seed "mixed-test-4", edition "mixed"
Scenario C: Throne Room + Chapel double-trash, seed "mixed-test-4", edition "mixed"
```

See `docs/testing/mcp-playtests/SCENARIOS.md` for seed-to-card mappings.

### Step 2: Create One Task Per Scenario

```typescript
TaskCreate(subject: "Playtest: Witch + Moat interaction",
  description: "Play 1 game with seed mixed-test-0, edition mixed. Focus on Witch giving Curses and Moat blocking. 2-player mode. Report to docs/testing/mcp-playtests/reports/.")

TaskCreate(subject: "Playtest: Militia discard mechanics",
  description: "Play 1 game with seed mixed-test-4, edition mixed. Focus on Militia forcing discard to 3 cards. 2-player mode. Report to docs/testing/mcp-playtests/reports/.")
```

### Step 3: Spawn Parallel Agents

Spawn all playtesters simultaneously:

```typescript
Task(subagent_type: "game-tester", name: "Tester-Witch", team_name: "playtest",
     run_in_background: true, prompt: "[scenario A details]")
Task(subagent_type: "game-tester", name: "Tester-Militia", team_name: "playtest",
     run_in_background: true, prompt: "[scenario B details]")
Task(subagent_type: "game-tester", name: "Tester-ThroneRoom", team_name: "playtest",
     run_in_background: true, prompt: "[scenario C details]")
```

### Step 4: Collect and Compare

After all agents complete, compare reports for convergence (same approach as the `playtest` skill's trust calibration).

## Spawn Prompt Template

```
You are a playtester on the [team-name] team.

YOUR TASK: Play ONE game testing [CARD/MECHANIC].

Game setup:
- Seed: [seed]
- Edition: [edition]
- Players: [1 or 2]
- Kingdom must include: [card list]

Focus areas:
- [specific mechanic to validate]
- [expected behavior to verify]
- [edge case to watch for]

After the game, mark your task as completed and write your report.
Report path: docs/testing/mcp-playtests/reports/[filename].md
```

## Referee Agent (Future)

For Claude-vs-Claude matchups, a Referee agent observes games and validates state transitions against expected card effects. This requires:

1. A comprehensive card mechanics reference covering all 25 kingdom cards (the current `dominion-mechanics` skill only covers 15)
2. State transition validation logic (e.g., "after Witch is played, opponent should gain a Curse if Curses remain in supply")
3. Access to game state via `game_observe` with `detail_level: "full"`

The Referee would not play — only observe, validate, and report discrepancies between expected and actual game behavior.

### Referee Composition

```
Player A (game-tester) ──► plays via MCP tools
Player B (game-tester) ──► plays via MCP tools (or Big Money AI)
Referee (general-purpose) ──► observes via game_observe, validates rules, writes analysis
```

This is not yet implemented. The expanded card reference is a prerequisite.

## Known Limitations

- **game-tester uses Haiku by default** — fast and cheap but less strategic play
- **Turn-20 limit** may prevent reaching late-game mechanics (Province pile depletion)
- **Solo mode** cannot test attack/reaction interactions — use `numPlayers: 2` for those
- **Playtester validates protocol, not deep rules** — it checks "did the API error?" not "did Witch correctly give a Curse." See Referee Agent section for the deeper validation approach.
