# Game Session Logging Setup Guide

**Status**: ACTIVE
**Created**: 2025-10-23
**Phase**: 2.1

This guide explains how to enable and use game session logging with the MCP server.

## Quick Start

### 1. Update `.mcp.json` Configuration

Set the `LOG_FILE` environment variable in your `.mcp.json`:

```json
{
  "mcpServers": {
    "principality": {
      "command": "node",
      "args": [
        "packages/mcp-server/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "INFO",
        "LOG_FORMAT": "text",
        "LOG_FILE": "./game-session.log"
      }
    }
  }
}
```

### 2. Build the Project

```bash
npm run build
```

### 3. Start a Game in Claude Code

Ask Claude to play a game:
```
Can you help me play Dominion? I want to see the logs of our game.
```

Claude will:
1. Call `game_session(command="new")` to start the game
2. Each move and game state update is logged to `./game-session.log`
3. All logs appear in real-time

### 4. Monitor the Logs

In another terminal, watch the logs in real-time:

```bash
tail -f ./game-session.log
```

Or view the complete log:

```bash
cat ./game-session.log
```

## Environment Variables

| Variable | Values | Default | Purpose |
|----------|--------|---------|---------|
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARN`, `ERROR` | `INFO` | What to log |
| `LOG_FORMAT` | `text`, `json` | `json` | Log format |
| `LOG_FILE` | Path to file | (unset = console only) | Where to write logs |

## Log Formats

### Text Format (Recommended for Humans)

```
[════════════════════════════════════════════════════════════]
[Game Session Log Started: 2025-10-23T10:45:55.301Z]
[════════════════════════════════════════════════════════════]

[2025-10-23T10:45:55.303Z] [INFO] Game started {"players":1,"seed":"12345"}
[2025-10-23T10:45:55.308Z] [INFO] Player took turn {"turn":1,"phase":"action"}
[2025-10-23T10:45:55.309Z] [WARN] Low supply {"card":"Province","remaining":2}
[2025-10-23T10:45:55.309Z] [INFO] Game ended {"winner":"Player 1","score":42}
```

### JSON Format (Recommended for Analysis)

```json
{"timestamp":"2025-10-23T10:45:55.303Z","level":"info","message":"Game started","data":{"players":1,"seed":"12345"}}
{"timestamp":"2025-10-23T10:45:55.308Z","level":"info","message":"Player took turn","data":{"turn":1,"phase":"action"}}
{"timestamp":"2025-10-23T10:45:55.309Z","level":"warn","message":"Low supply","data":{"card":"Province","remaining":2}}
```

## What Gets Logged

The logger captures:

1. **Game Lifecycle**
   - Game started
   - Game ended
   - Winner information

2. **Player Actions**
   - Moves executed
   - Coins generated
   - Cards bought
   - Phases changed

3. **Game State**
   - Current turn
   - Current phase
   - Supply pile status
   - Hand contents

4. **Warnings and Errors**
   - Invalid moves
   - Insufficient resources
   - Game rule violations

## Analyzing Logs

### Search for Specific Events

Find all Province purchases:
```bash
grep "buy.*Province" ./game-session.log
```

Find all phase changes:
```bash
grep "phase.*buy\|phase.*action\|phase.*cleanup" ./game-session.log
```

Find all errors:
```bash
grep "\[ERROR\]" ./game-session.log
```

### Extract Turn Sequence

See the exact sequence of moves:
```bash
grep "executed\|play\|buy" ./game-session.log
```

### Get Game Statistics

Find final game state:
```bash
grep "Game ended\|winner\|score" ./game-session.log
```

## Multiple Games

Each game creates a new log entry in the same file. To separate games, use unique filenames:

**For manual separation:**
```bash
export LOG_FILE="./games/game-$(date +%s).log"
```

**Or in `.mcp.json`, use a template:**
```json
{
  "env": {
    "LOG_FILE": "./logs/dominion-$(date +%Y-%m-%d).log"
  }
}
```

## Log Levels

### INFO (Default)
Logs all important game events. Good for gameplay analysis.

```
export LOG_LEVEL=INFO
```

Output:
```
[2025-10-23T10:45:55.303Z] [INFO] Game started
[2025-10-23T10:45:55.308Z] [INFO] Player executed move
```

### DEBUG
Logs everything including internal operations. Use for troubleshooting.

```
export LOG_LEVEL=DEBUG
```

Output includes all above PLUS:
```
[2025-10-23T10:45:55.299Z] [DEBUG] Initializing game engine
[2025-10-23T10:45:55.300Z] [DEBUG] Loading card definitions
```

### WARN
Logs only warnings and errors. Use for quick issue spotting.

```
export LOG_LEVEL=WARN
```

Output:
```
[2025-10-23T10:45:55.309Z] [WARN] Low supply
[2025-10-23T10:45:55.400Z] [ERROR] Invalid move attempted
```

## Troubleshooting

### Logs Not Appearing

**Problem**: I set LOG_FILE but no logs appear.

**Solution**:
1. Verify `npm run build` was run after updating `.mcp.json`
2. Check that the directory exists: `mkdir -p $(dirname ./game-session.log)`
3. Verify file permissions: `touch ./game-session.log` (should succeed)
4. Check that Claude Code is running the latest build

### File Gets Too Large

**Problem**: Log file is growing too large.

**Solution**:
1. Rotate logs by game: `LOG_FILE="./logs/game-$(date +%s).log"`
2. Archive old logs: `gzip ./game-session.log.1`
3. Delete old logs: `find ./logs -mtime +7 -delete` (keep 7 days)

### Permission Denied

**Problem**: Cannot write to log file.

**Solution**:
```bash
# Check permissions
ls -la ./game-session.log

# Fix permissions
chmod 666 ./game-session.log

# Or use a different directory
export LOG_FILE="/tmp/game-session.log"
```

## Example: Complete Game with Logging

### Setup

```bash
# 1. Update .mcp.json with LOG_FILE setting (see above)
# 2. Build
npm run build

# 3. Monitor logs in another terminal
tail -f ./game-session.log
```

### Play Game

```
# In Claude Code / chat
You: "Let's play Dominion! I want to see detailed logs of the game."

Claude will:
1. Use game_session(command="new") → Logged: "Game started"
2. Use game_observe(detail_level="standard") → Logs game state
3. Use game_execute(move="play 0") → Logs: "Player executed move"
4. ... continue for each turn ...
5. Use game_session(command="end") → Logs: "Game ended"
```

### Monitor Logs

In your second terminal, you see in real-time:
```
[2025-10-23T10:46:00.000Z] [INFO] Game started
[2025-10-23T10:46:00.100Z] [INFO] Turn 1, Phase: action
[2025-10-23T10:46:00.200Z] [INFO] Player executed move: play 0 (Village)
[2025-10-23T10:46:00.300Z] [INFO] Phase changed: action → buy
...
[2025-10-23T11:00:00.000Z] [INFO] Game ended. Winner: Claude (42 VP)
```

### Analyze Results

```bash
# See all purchases
grep "buy" ./game-session.log

# See all Province purchases
grep "buy.*Province" ./game-session.log

# Count moves per turn
grep "executed move" ./game-session.log | wc -l

# Extract final score
grep "Winner" ./game-session.log
```

## Performance Impact

- File writing is **asynchronous and non-blocking**
- Each log entry appends ~100-500 bytes to disk
- Typical game generates 50-200 log entries (~10KB)
- No measurable impact on game performance
- Disk I/O is the limiting factor (not CPU)

## Next Steps

Now that logging is enabled, you can:

1. **Play games and capture logs** for analysis
2. **Compare different strategies** by looking at move sequences
3. **Debug AI decision-making** by reviewing game progression
4. **Identify patterns** in successful vs. failed games
5. **Export data** to spreadsheet/analysis tools (especially JSON format)

Enjoy your logged gameplay! 🎮📊
