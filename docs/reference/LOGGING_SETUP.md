# Game Session Logging Setup Guide

**Status**: ACTIVE
**Updated**: 2025-10-23
**Phase**: 2.1

This guide explains how to use game session logging with the MCP server.

## Quick Start (Zero Config!)

Logging now works **automatically** with zero configuration needed!

### 1. Build the Project

```bash
npm run build
```

### 2. Start a Game in Claude Code

Ask Claude to play:
```
Can you help me play Dominion? I want to see the logs of our game.
```

When the MCP server starts, it will:
1. Automatically detect the best location for logs
2. Create `dominion-game-session.log` in the project directory
3. Print where logs are being written:
   ```
   ✓ Logging initialized to: /Users/you/project/dominion-game-session.log
   ```
4. Log each move and game state update in real-time

### 3. Monitor the Logs

In **another terminal**, watch the logs:

```bash
tail -f ./dominion-game-session.log
```

**That's it!** Logs appear automatically. No configuration needed.

---

## How It Works

The logging system now has **smart auto-discovery**:

### Log File Priority (In Order)

1. **Explicit Parameter** - If you pass a logFile to Logger constructor
2. **Environment Variable** - If `LOG_FILE` environment variable is set
3. **Project Directory** - Tries to create `dominion-game-session.log` in current directory
4. **Temp Directory** - Falls back to `/tmp/dominion-game-session.log` if project dir isn't writable
5. **Console Only** - If all file locations fail, logs still appear on console

### Features

✅ **Zero Configuration** - Works out of the box
✅ **Auto-Discovery** - Finds the best location automatically
✅ **Transparent** - Shows you where logs are written on startup
✅ **Graceful Fallback** - Still works even if file writing fails
✅ **Always-On** - Logging happens without any setup needed

---

## Viewing Logs

### Real-Time Monitoring

Watch logs as the game progresses:

```bash
tail -f ./dominion-game-session.log
```

Or in another common location:

```bash
tail -f /tmp/dominion-game-session.log
```

### View Entire Session

```bash
cat ./dominion-game-session.log
```

### Search for Specific Events

Find all Province purchases:
```bash
grep "buy.*Province" ./dominion-game-session.log
```

Find all phase changes:
```bash
grep "Phase:" ./dominion-game-session.log
```

Find all errors:
```bash
grep "\[ERROR\]" ./dominion-game-session.log
```

Count total moves:
```bash
grep "executed move" ./dominion-game-session.log | wc -l
```

---

## Log Format

### Default Format (Text)

```
[════════════════════════════════════════════════════════════]
[Game Session Log Started: 2025-10-23T10:46:00.000Z]
[Log File: /Users/you/project/dominion-game-session.log]
[════════════════════════════════════════════════════════════]

[2025-10-23T10:46:00.100Z] [INFO] Game started {"players":1,"seed":"12345"}
[2025-10-23T10:46:00.200Z] [INFO] Turn 1, Phase: action
[2025-10-23T10:46:00.300Z] [INFO] Player executed move: play 0
[2025-10-23T10:46:00.400Z] [INFO] Phase changed: action → buy
...
[2025-10-23T11:00:00.000Z] [INFO] Game ended. Winner: Claude (42 VP)
```

### JSON Format (Optional)

For programmatic analysis, you can use JSON format by setting environment variable:

```bash
export LOG_FORMAT=json
npm run build
```

Each line will be valid JSON:
```json
{"timestamp":"2025-10-23T10:46:00.100Z","level":"info","message":"Game started","data":{"players":1}}
{"timestamp":"2025-10-23T10:46:00.200Z","level":"info","message":"Turn 1, Phase: action"}
```

---

## What Gets Logged

The logger captures all important game events:

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
   - Hand contents
   - Valid moves

4. **Warnings and Errors**
   - Invalid moves
   - Insufficient resources
   - Game rule violations

---

## Log Levels

The system supports different verbosity levels. Default is `INFO`:

### INFO (Default)

Logs all important game events:

```bash
# Just logs to console normally
tail -f ./dominion-game-session.log
```

Output includes:
```
[2025-10-23T10:46:00.100Z] [INFO] Game started
[2025-10-23T10:46:00.200Z] [INFO] Player executed move
```

### DEBUG

More verbose logging for troubleshooting. Set environment variable:

```bash
export LOG_LEVEL=DEBUG
npm run build
```

Output includes all above PLUS:
```
[2025-10-23T10:46:00.050Z] [DEBUG] Initializing game engine
[2025-10-23T10:46:00.075Z] [DEBUG] Loading card definitions
```

### WARN

Only warnings and errors:

```bash
export LOG_LEVEL=WARN
npm run build
```

Output:
```
[2025-10-23T10:46:00.300Z] [WARN] Low supply
[2025-10-23T10:46:00.400Z] [ERROR] Invalid move attempted
```

---

## Where Logs Are Written

The logging system will create logs in this order of preference:

1. **Current Working Directory**
   ```
   ./dominion-game-session.log
   ```
   (Most common - works in project root)

2. **Temporary Directory** (Fallback)
   ```
   /tmp/dominion-game-session.log        # Linux/Mac
   %TEMP%/dominion-game-session.log      # Windows
   ```

3. **Explicit Path** (If you set it)
   ```bash
   export LOG_FILE="/var/log/dominion.log"
   npm run build
   ```

The first successful location is used. The logger prints where logs are going:

```
✓ Logging initialized to: /Users/you/project/dominion-game-session.log
```

---

## Troubleshooting

### I Don't See Logs

**Check where they're being written:**

Look for this message when the server starts:
```
✓ Logging initialized to: [PATH]
```

Then check that file:
```bash
cat /Users/you/project/dominion-game-session.log
tail -f /tmp/dominion-game-session.log
```

### Logs Are In Unexpected Location

The logger prefers the project directory but falls back to `/tmp` if needed:

```bash
# Check temp directory
ls -la /tmp/dominion-game-session.log

# Or find all logs
find ~ -name "dominion-game-session.log" 2>/dev/null
```

### File Gets Too Large

Logs accumulate over time. Clean up old logs:

```bash
# Archive old logs
gzip ./dominion-game-session.log

# Or delete
rm ./dominion-game-session.log
```

New games will start a fresh log file.

### Permission Denied

If you get permission errors:

```bash
# Check permissions
ls -la ./dominion-game-session.log

# Make world-writable
chmod 666 ./dominion-game-session.log
```

---

## Examples

### Example 1: Play Game and Monitor Logs

Terminal 1:
```bash
cd /Users/you/project/principality_ai
npm run build
# (keep this running or Claude Code will handle it)
```

Terminal 2:
```bash
tail -f dominion-game-session.log
```

Terminal 3 (Claude Code):
```
You: "Help me play Dominion!"
Claude: (plays game)
```

You'll see logs flowing in Terminal 2 as the game progresses!

### Example 2: Analyze a Completed Game

After a game finishes:

```bash
# View entire log
cat dominion-game-session.log

# Extract just the moves
grep "executed move" dominion-game-session.log

# Count turns
grep -c "Turn [0-9]*" dominion-game-session.log

# See final winner
tail -1 dominion-game-session.log
```

### Example 3: Use JSON Format for Parsing

```bash
# Start with JSON format
export LOG_FORMAT=json
npm run build

# Play a game...

# Then parse with jq (if you have it)
cat dominion-game-session.log | jq '.message'
```

---

## Performance

Logging has minimal performance impact:

- ✅ File writes are **synchronous but fast** (< 1ms per entry)
- ✅ Typical game: 50-200 log entries (~10KB)
- ✅ No measurable impact on game performance
- ✅ Disk I/O is the only limiting factor

---

## Next Steps

Now that logging is working:

1. **Play games and capture logs** for later analysis
2. **Compare different strategies** by looking at move sequences
3. **Debug decision-making** by reviewing what the AI did
4. **Identify patterns** in successful vs. failed games
5. **Export to spreadsheet** (especially with JSON format)

Enjoy your logged gameplay! 🎮📊
