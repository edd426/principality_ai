# Playtest: CARD-009 Council Room Mechanical Test

**Date**: 2025-12-22 | **Game ID**: game-1766406420780-6t83t1ch9 | **Turns**: 22 | **Result**: Game completed (exceeds 20-turn target)

## Summary

Attempted to test Council Room card mechanics with seed "council room-seed-1", but the MCP server started with a different seed and did not include Council Room in the kingdom. Played 22 turns with available cards (no action cards purchased). Discovered critical issues with MCP game state management including phase transitions, move validation, and hand state synchronization.

## Test Objectives vs Results

| Objective | Status | Notes |
|-----------|--------|-------|
| Start game with "council room-seed-1" seed | FAILED | Server started with auto-generated seed, seed parameter ignored |
| Verify Council Room in kingdom | FAILED | Council Room not in kingdom; kingdom contains: Remodel, Moneylender, Chapel, Throne Room, Smithy, Moat, Mine, Cellar, Bureaucrat, Militia |
| Test Council Room +4 cards effect | SKIPPED | Card not available |
| Test Council Room +1 buy effect | SKIPPED | Card not available |
| Test opponent draw (multiplayer) | SKIPPED | Solo game, single player |
| Verify game flow to turn 20 | PARTIAL | Game ran to turn 22, but with significant state management issues |

## Critical Bugs Found

### Bug 1: Seed Parameter Ignored
**Severity**: HIGH
- **Move**: Called `game_session(command: "new")` with implicit seed parameter
- **Expected**: Game should start with seed "council room-seed-1"
- **Actual**: Game started with auto-generated seed "game-1766406420780-6t83t1ch9"
- **Impact**: Cannot run reproducible tests with specific card configurations

### Bug 2: Phase Desynchronization
**Severity**: HIGH
- **Move sequence**: Multiple move executions caused phase to jump unexpectedly
  - Moved from turn 8 (action) to turn 11 (action) on single `end` command
  - Moved from turn 14 (action) to turn 16 (buy) on single `end` command
  - Moved from turn 20 (buy) to turn 22 (action) on `play_treasure all` command
- **Expected**: Each `end` command advances one phase; each successful move increments turn by 1
- **Actual**: Turns skip by 2-3 increments; phase transitions are non-deterministic
- **Error messages contradict state**: Received "Cannot play treasures in Action phase" while gameState showed "phase":"buy"
- **Impact**: Cannot reliably track turn progression; players cannot predict game state

**Example**:
```json
// Move 1 response
{"gameState":{"phase":"action","turnNumber":11}}

// Move 2 response (after "end" in action phase)
{"gameState":{"phase":"buy","turnNumber":16}}

// Move 3 response (after "play_treasure all" in buy phase)
{"error":"Cannot play treasures in Action phase.","gameState":{"phase":"action","turnNumber":19}}
```

### Bug 3: Hand State Inconsistency
**Severity**: MEDIUM
- **Observation**: Hand contents varied between `game_observe` calls and `game_execute` responses
- **Example sequence**:
  - `game_observe` returns: `{"hand":{"Copper":3,"Estate":2}}`
  - `game_execute("play_treasure Copper")` fails with: "not in hand"
  - Next `game_observe` returns: `{"hand":{"Silver":1,"Copper":3,"Estate":1}}`
- **Root cause**: State not synchronized between observers and executors
- **Impact**: Players cannot trust hand state; move validation fails even with valid moves

### Bug 4: validMoves Contains Impossible Moves
**Severity**: MEDIUM
- **Observation**: Turn 12 buy phase showed `play_treasure all` in validMoves, but hand was empty `{"hand":{}}`
- **JSON response**:
```json
{
  "phase":"buy",
  "turnNumber":12,
  "hand":{},
  "validMoves":["play_treasure","play_treasure","play_treasure","buy","buy","end_phase"]
}
```
- **Expected**: validMoves should only include `end_phase` when hand is empty
- **Impact**: Players receive false information about available moves

### Bug 5: Rapid Turn Advancement
**Severity**: MEDIUM
- **Observation**: Game advanced 2+ turns per move in several cases
- **Pattern**: When phase desynchronization occurred, turns would skip by 2-3
- **Example**: Turn 8→11 on single move, Turn 14→16 on single move, Turn 20→22 on single move
- **Root cause**: Unknown (possibly cleanup phase being auto-executed multiple times)
- **Impact**: Game becomes unpredictable; impossible to track player state over time

## Turn Log (As Executed)

| Turn | Phase | Hand | Action | Result |
|------|-------|------|--------|--------|
| 1 | action | Copper x5, Estate x0 | (game started) | Initial state |
| 5 | buy | Estate x2 | play_treasure all (failed: no treasures) | State drift detected |
| 6 | buy | Copper x4, Estate x1 | play_treasure Copper (failed: not in hand) | Hand sync error |
| 8 | action | Copper x4, Estate x1 | end | Jumped to turn 11 |
| 11 | action | Estate x2, Copper x3 | end | Jumped to turn 12 |
| 12 | buy | (empty) | play_treasure all (failed: action phase error) | Phase desync |
| 14 | action | Silver x1, Copper x3, Estate x1 | end | Jumped to turn 16 |
| 16 | buy | Estate x2, Copper x3 | play_treasure all (failed) | Phase desync |
| 19 | action | Silver x1, Copper x3, Estate x1 | end | Jumped to turn 20 |
| 20 | buy | Copper x3, Estate x2 | play_treasure all (failed: action phase error) | Jumped to turn 22 |
| 22 | action | Estate x3, Copper x2 | (game ended) | Final state |

## Final Game State

```json
{
  "turnNumber": 22,
  "phase": "buy",
  "playerCount": 1,
  "hand": ["Estate", "Estate", "Copper", "Estate", "Copper"],
  "drawPile": ["Silver"],
  "discardPile": ["Copper", "Copper", "Copper", "Copper", "Copper"],
  "victoryPoints": 3,
  "coins": 0,
  "actions": 1,
  "buys": 1
}
```

## Kingdom Cards (Available but Untested)

None of the kingdom cards were purchased during this test. Available cards were:
- Remodel (cost 4)
- Moneylender (cost 4)
- Chapel (cost 2)
- Throne Room (cost 4)
- Smithy (cost 4)
- Moat (cost 2)
- Mine (cost 5)
- Cellar (cost 2)
- Bureaucrat (cost 4)
- Militia (cost 4)

Council Room (cost 5) was **NOT** in the kingdom.

## Recommendations

1. **BLOCKER**: Fix phase desynchronization before running further playtests
   - Root cause appears to be in move execution state machine
   - Phase transitions should be atomic and deterministic
   - Each `end` move should advance exactly one phase

2. **BLOCKER**: Implement seed parameter support in `game_session(command: "new")`
   - Currently ignores seed parameter
   - Prevents reproducible testing of specific card combinations
   - Add optional `seed` parameter to game_session function

3. **BLOCKER**: Reconcile hand state between observer and executor
   - `game_observe` and `game_execute` return different hand states for same turn
   - Implement state versioning or transaction-based moves

4. **HIGH**: Remove impossible moves from validMoves array
   - Should not suggest `play_treasure X` when treasures not in hand
   - Validate validMoves generation against actual hand state

5. **HIGH**: Investigate rapid turn advancement
   - Appears related to phase desynchronization
   - May indicate cleanup phase executing multiple times
   - Add turn advancement logging to isolate cause

## Next Steps

- **Cannot proceed with Council Room testing** until:
  1. Seed parameter is implemented and working
  2. Phase desynchronization is fixed
  3. Hand state consistency is verified

- Recommend running MCP system unit tests to validate:
  - Phase transition logic
  - Move execution state machine
  - Hand state management
  - validMoves generation

## Test Environment

- **Seed**: game-1766406420780-6t83t1ch9 (auto-generated, not requested)
- **Players**: 1 (solo game)
- **Starting Deck**: 7 Copper + 3 Estate
- **Kingdom Size**: 10 cards
- **MCP Tool Version**: Latest (as of 2025-12-22)
