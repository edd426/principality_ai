# Interactive Dominion Gameplay with Claude Code & MCP Server

**Quick Start**: Play Dominion with Haiku through Claude Code, controlling the pace and seeing Claude's reasoning at each step.

---

## Setup Instructions

### Step 1: Build the MCP Server

```bash
cd packages/mcp-server
npm run build
```

This compiles TypeScript to JavaScript. You should see no errors.

### Step 2: Start the MCP Server

Keep this terminal open while you play:

```bash
cd packages/mcp-server
npm start
```

Expected output:
```
MCP Server ready (stdio, 3 tools)
```

The server is now listening for tool calls via stdio.

### Step 3: Configure Claude Code to Use the MCP Server

Claude Code reads MCP configuration from `.mcp.json` in your project root.

**Create or update `.mcp.json`**:

```json
{
  "mcpServers": {
    "principality": {
      "command": "node",
      "args": [
        "/Users/eddelord/Documents/Projects/principality_ai/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Replace the path** with your actual path to the MCP server dist file.

### Step 4: Restart Claude Code

```bash
# In Claude Code terminal, reload the MCP servers
/mcp
```

You should see `principality` listed as available.

If you see errors, check:
- MCP server is still running in the other terminal
- Path in `.mcp.json` is correct
- `/mcp` shows the server connected

---

## Playing the Game: Step-by-Step

### Start a New Game

**You**: "Let's play a game of Dominion. Start a new game and tell me the initial state."

Claude will:
1. Call `game_session(command="new")`
2. Get back initial game state
3. Show you:
   - Current phase: "action"
   - Starting hand: 7 Copper, 3 Estate
   - Available moves

**Example Claude Response**:
```
I've started a new game (ID: game-1729607...).

Starting hand:
- 7 Copper (treasure)
- 3 Estate (victory)

Current state:
- Phase: Action
- Turn: 1
- Actions available: 1
- Coins: 0 (no treasures played yet)
```

### Check Current State (Any Time)

**You**: "What's my current state? Show me everything."

Claude will:
1. Call `game_observe(detail_level="full")`
2. Show you:
   - Hand (with indices for reference)
   - Valid moves available
   - Supply pile remaining
   - Your VP count

**Example Claude Response**:
```
Current Game State (Full Detail):

Phase: ACTION
Turn 3, Player 1

Hand (5 cards):
- [0] Village (action)
- [1] Smithy (action)
- [2] Copper (treasure)
- [3] Copper (treasure)
- [4] Estate (victory)

Valid Moves:
- play 0 (Village) → +1 card, +2 actions
- play 1 (Smithy) → +3 cards
- play 2 (Copper) → +1 coin
- play 3 (Copper) → +1 coin
- end (end action phase)

Supply: (showing available cards to buy)
...
```

### Ask for Claude's Analysis

**You**: "Analyze the current state. What's the optimal move?"

Claude will:
1. Call `game_observe(detail_level="standard")` to get current state
2. Analyze options:
   - "I should play Village first for +2 actions"
   - "Then play Smithy for +3 cards"
   - "Then play treasures in buy phase"
3. Suggest a sequence of moves

**Example Claude Response**:
```
Analysis of current position:

Best action sequence:
1. Play Village first (+1 card, +2 actions)
   Reasoning: Need actions before playing Smithy

2. Play Smithy next (+3 cards)
   Reasoning: With 2 actions, I can play both

3. Play both Copper treasures
   Reasoning: Maximize coins for buying

This gives me: 1 draw + 3 draws + 2 coins = ready for buy phase

Want me to execute this sequence?
```

### Execute a Move

**You**: "Execute: play Village"

Claude will:
1. Call `game_execute(move="play Village")`
2. Report result:
   - Move succeeded
   - Cards drawn
   - New state

**Example Claude Response**:
```
✓ Executed: play Village

Effect:
- Drew 1 card from deck
- +2 actions remaining (now have 2)
- Hand updated

New hand: [Smithy, Copper, Copper, Estate, ... (new card)]
```

### Continue Turn

**You**: "Now what moves are available?"

Claude will:
1. Call `game_observe(detail_level="standard")`
2. Show updated hand and valid moves
3. Continue the conversation naturally

---

## Common Command Patterns

### Get Minimal Info (Quick Checks)

**You**: "Quick status"

Claude:
```
game_observe(detail_level="minimal")
↓
Phase: action
Turn: 5
Actions: 1
Coins: 0
```

### Get Standard Info (Decision Making)

**You**: "What can I do now?"

Claude:
```
game_observe(detail_level="standard")
↓
Current actions: Village, Smithy
Current treasures: 3 Copper, 1 Silver
Valid moves: play these cards or end phase
```

### Get Full Info (Strategic Analysis)

**You**: "Show me everything - I need to plan ahead"

Claude:
```
game_observe(detail_level="full")
↓
Complete hand with indices
Full supply remaining
Your VP total
Deck/discard counts
Everything!
```

### End a Phase

**You**: "End action phase, move to buy"

Claude:
```
game_execute(move="end")
↓
Phase transitioned: action → buy
You now have X coins to spend
```

### Buy a Card

**You**: "Buy a Silver"

Claude:
```
game_execute(move="buy Silver")
↓
Silver purchased and added to discard
Coins remaining: X
```

### End Turn (Move to Cleanup)

**You**: "End buy phase"

Claude:
```
game_execute(move="end")
↓
Phase: cleanup
Hand discarded, deck shuffled
Next turn starts...
```

### Start New Game

**You**: "New game"

Claude:
```
game_session(command="new")
↓
Fresh game started
Starting hand ready
```

---

## Playing Multiple Turns

**Example Multi-Turn Conversation**:

```
You: "Start a new game"
Claude: [initializes, shows state]

You: "What should I play?"
Claude: [analyzes, suggests moves]

You: "Make those moves"
Claude: [executes play Village, play Smithy, etc.]

You: "I have 5 coins now, what should I buy?"
Claude: [calls game_observe, analyzes supply, suggests]

You: "Buy a Duchy"
Claude: [executes buy, shows new state]

You: "End turn"
Claude: [executes end, shows next turn starting]

You: "What's my hand now?"
Claude: [calls game_observe, shows new hand]

You: "Analyze this hand and play optimally"
Claude: [analyzes new hand, suggests moves, executes]

[Repeat until game ends]

You: "Did we win?"
Claude: [Calls game_observe, determines if game-over, shows winner]
```

---

## Tips for Best Experience

### 1. **Control the Pace**
- Ask for analysis before executing moves
- Review Claude's reasoning
- You decide when to execute

### 2. **Use Detail Levels Wisely**
- **Minimal**: Quick status checks
- **Standard**: Normal decision-making (most common)
- **Full**: When you need complete context

### 3. **Ask for Reasoning**
- "Why did you choose that move?"
- "What's the strategy here?"
- Claude will explain its thinking

### 4. **Give Direction**
- "Play aggressively" - Claude adjusts strategy
- "Focus on economy" - Claude prioritizes treasures
- "Rush for victory" - Claude buys expensive victory cards

### 5. **Follow Along**
- Keep track of your deck composition
- Notice patterns in Claude's decisions
- See how strategy evolves over turns

---

## Troubleshooting

### "Cannot find tool: game_observe"
- MCP server not running
- Check terminal: `npm start` should show "MCP Server ready"
- Or: Path in `.mcp.json` is incorrect

### "Connection timeout"
- MCP server crashed
- Restart with: `npm start`
- Check for errors in server terminal

### "Move not found" or execution errors
- Card doesn't exist in supply
- Move format wrong (should be "play 0" or "buy CardName")
- Not enough resources (coins, actions)
- Claude will see error message and suggest correction

### Claude doesn't offer to use tools
- Make sure you enabled MCP in Claude Code: `/mcp`
- Reload Claude Code settings
- Try asking explicitly: "Use the game_observe tool to check state"

---

## Example: Complete Game Session

Here's what a full interactive session might look like:

```
YOU: "Start a new Dominion game"

CLAUDE: I'll start a new game for you!
[Calls game_session(command="new")]
✓ Game started (ID: game-xyz)

Starting configuration:
- Hand: 7 Copper, 3 Estate
- Phase: Action phase, Turn 1
- Actions available: 1
- Coins: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU: "What's my optimal play?"

CLAUDE: Let me analyze your hand...
[Calls game_observe(detail_level="standard")]

Your hand: 7 Copper (all treasures/base cards)
No action cards available yet

In action phase with 0 treasures played yet.

Best move:
→ End action phase immediately
→ Move to buy phase with 1 buy, 0 coins
→ Can't afford anything yet
→ Turn ends naturally

First turn is typically just a setup turn. Should I proceed?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU: "Yes, play through it"

CLAUDE: Executing full first turn...
[Calls game_execute(move="end")]
✓ Action phase ended

Now in buy phase with:
- 1 buy available
- 0 coins to spend

I can't afford anything, so I'll end the buy phase.
[Calls game_execute(move="end")]
✓ Buy phase ended

Turn 1 complete. Deck shuffled, new hand drawn.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU: "What's my new hand?"

CLAUDE: Checking...
[Calls game_observe(detail_level="standard")]

Turn 2 hand:
- 3 Copper (treasure)
- 2 Estate (victory)

Action phase, 1 action available, 0 coins

Since I have no action cards and only treasures:
1. Play all 3 Copper → 3 coins
2. Move to buy phase
3. Buy a Silver (costs 3 coins)

Should I execute this sequence?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU: "Do it"

CLAUDE: Executing...
[Calls game_execute(move="play Copper")] ✓
[Calls game_execute(move="play Copper")] ✓
[Calls game_execute(move="play Copper")] ✓
[Calls game_execute(move="end")] → Phase: buy, coins: 3

Now buying...
[Calls game_execute(move="buy Silver")] ✓
Silver purchased!

[Calls game_execute(move="end")] ✓
Turn 2 complete.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU: "Continue playing until we can buy a Province"

CLAUDE: [Plays multiple turns autonomously, reporting after each]
Turn 3: Bought a Silver (now have 2 Silver, 3 Copper)
Turn 4: Bought a Gold (now have strong economy)
Turn 5: Can afford Province! Buying now...
✓ Bought Province (6 VP)

Game continues...

[Eventually game reaches victory condition]

YOU: "Did we win?"

CLAUDE: Checking game state...
[Calls game_observe(detail_level="full")]

Game Over!
- You: 8 VP total (1 Province + 3 Estates = 8)
- Winner: Player (You)

Congratulations! 🎉
```

---

## Playing Again

To play another game in the same Claude Code session:

**You**: "New game, let's try again"

Claude will:
```
game_session(command="new")
↓
Fresh game ready
Starting state displayed
Ready for new game!
```

All tool calls work across multiple games. Just keep conversing naturally!

---

## Next Steps

1. **Start MCP server** in one terminal
2. **Open Claude Code**
3. **Configure `.mcp.json`** with server path
4. **Type**: "Start a new Dominion game"
5. **Enjoy!** Step through gameplay with Claude, controlling pace and seeing reasoning

Have fun playing! 🎮
