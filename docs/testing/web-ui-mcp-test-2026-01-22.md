# Web UI MCP Integration Test Session

**Date**: 2026-01-22
**Goal**: Play a game against yourself using Chrome MCP (human) + web_game MCP tools (AI)

---

## Prerequisites

Before starting, ensure both servers are running:

```bash
# Terminal 1: API Server
cd /Users/eddelord/Documents/Projects/principality_ai/packages/api-server
npm start

# Terminal 2: Web Dev Server
cd /Users/eddelord/Documents/Projects/principality_ai/packages/web
npm run dev
```

---

## Test Instructions for Claude

### Step 1: Set Up Browser Tab

1. Use `mcp__claude-in-chrome__tabs_context_mcp` to get browser context
2. Create a new tab with `mcp__claude-in-chrome__tabs_create_mcp`
3. Navigate to `http://localhost:5173` (web UI)

### Step 2: Create Game with Manual AI Mode

1. Take a screenshot to see the home page
2. Find and check the "Manual AI Mode" checkbox
3. Click "Start Game" button
4. Wait for navigation to game page
5. Note the gameId from the URL (e.g., `/game/game-1234567890-abc123`)

### Step 3: Play Human Turn (via Chrome MCP)

For each human turn:
1. Take a screenshot to see current game state
2. If in Action phase with no actions to play, click "End Phase" or use `end` command
3. If in Buy phase:
   - Click "Play All Treasures" button OR click individual treasure cards
   - Click a supply pile to buy a card (Silver/Gold early, Province late)
   - Click "End Turn" when done
4. Repeat until it shows "AI's Turn" or game state changes

### Step 4: Play AI Turn (via web_game MCP tools)

When it's the AI's turn (currentPlayer === 1):

1. **Observe the game state**:
   ```
   web_game_observe(gameId: "<gameId>", detail_level: "standard")
   ```

2. **Execute AI moves** using Big Money strategy:
   - Action phase: `web_game_execute(gameId: "<gameId>", move: "end")` (skip if no actions)
   - Buy phase: Play treasures and buy best affordable card:
     - Province (8 coins) > Gold (6 coins) > Silver (3 coins)
   - End turn: `web_game_execute(gameId: "<gameId>", move: "end")`

3. **Refresh browser** to see updated state (take screenshot or use read_page)

### Step 5: Repeat for 2-3 Full Rounds

Alternate between:
- Human turns via Chrome MCP (clicking cards/buttons)
- AI turns via web_game_execute MCP tool

### Step 6: Verify Everything Works

Confirm:
- [ ] Treasures can be clicked/played in buy phase (bug fix verified)
- [ ] "Play All Treasures" button works
- [ ] AI turns don't auto-play (manualAI mode works)
- [ ] web_game_execute successfully makes moves for AI
- [ ] Game state updates correctly after each move

---

## Quick Reference: MCP Tool Usage

### Chrome MCP (Human Player)
```
mcp__claude-in-chrome__tabs_context_mcp()
mcp__claude-in-chrome__navigate(tabId, url)
mcp__claude-in-chrome__computer(action: "screenshot", tabId)
mcp__claude-in-chrome__computer(action: "left_click", tabId, coordinate: [x, y])
mcp__claude-in-chrome__find(tabId, query: "Play All Treasures button")
```

### Web Game MCP (AI Player)
```
web_game_observe(gameId: "...", detail_level: "standard")
web_game_execute(gameId: "...", move: "play Copper")
web_game_execute(gameId: "...", move: "play_treasure all")
web_game_execute(gameId: "...", move: "buy Silver")
web_game_execute(gameId: "...", move: "end")
```

---

## Big Money Strategy Reference

**Buy Priority** (in order):
1. Province (cost 8) - if coins >= 8
2. Gold (cost 6) - if coins >= 6
3. Silver (cost 3) - if coins >= 3
4. Nothing - if coins < 3

**Action Phase**: Always skip (end phase) - no action cards in Big Money

---

## Expected Outcome

After 2-3 rounds, you should have:
- Verified treasure clicking works (Part 1 bug fix)
- Verified manualAI mode prevents auto-play (Part 2)
- Verified web_game MCP tools work (Part 3)
- Successfully played moves for both human and AI players
