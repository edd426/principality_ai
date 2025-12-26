---
name: cli-dominion-mechanics
description: Guide to playing Dominion via the CLI turn-based mode. Covers CLI output format, move syntax, and game rules. Use when confused about CLI output, getting errors, or unsure what move to make.
---

# CLI Dominion Mechanics Guide

This skill explains how to play Dominion through the command-line interface (CLI) in turn-based mode.

## Table of Contents

1. [Reading CLI Output](#reading-cli-output)
2. [Move Syntax](#move-syntax)
3. [Turn Structure](#turn-structure)
4. [Phase Rules](#phase-rules)
5. [Common Confusions](#common-confusions)
6. [When You're Stuck](#when-youre-stuck)

---

## Reading CLI Output

After each move, the CLI displays the game state. Here's how to read it:

```
============================================================
Turn 1 | Player 1 | VP: 3 VP (3E) | Action Phase
============================================================
Hand: Copper, Copper, Estate, Copper, Copper
Actions: 1  Buys: 1  Coins: $0

Supply:
  Treasures: Copper (60), Silver (40), Gold (30)
  Victory:   Estate (4), Duchy (4), Province (4)
  Kingdom:   [list of 10 kingdom cards]

Available Moves:
  [1] End Phase
```

### Key Elements

| Element | Meaning |
|---------|---------|
| `Turn 1` | Current turn number |
| `Player 1` | Which player's turn |
| `VP: 3 VP (3E)` | Victory points (3E = 3 Estates) |
| `Action Phase` | Current phase (Action, Buy, or Cleanup) |
| `Hand:` | Cards currently in your hand |
| `Actions: 1` | How many action cards you can play |
| `Buys: 1` | How many cards you can buy |
| `Coins: $0` | Coins available for buying (from played treasures) |
| `Available Moves:` | **THE ONLY MOVES YOU CAN MAKE** |

### Critical Rule: Available Moves

**You can ONLY execute moves listed in "Available Moves".**

If a move isn't listed, you cannot do it. The CLI tells you exactly what's legal.

---

## Move Syntax

### Method 1: By Index Number (Recommended)

Use the number shown in brackets:

```bash
node packages/cli/dist/index.js --state-file /tmp/game.json --move "1"
```

This executes whatever move is labeled `[1]` in Available Moves.

### Method 2: By Text Command

Use the text description:

```bash
node packages/cli/dist/index.js --state-file /tmp/game.json --move "buy Silver"
node packages/cli/dist/index.js --state-file /tmp/game.json --move "end"
```

### Valid Text Commands

| Command | When to Use |
|---------|-------------|
| `end` | End the current phase |
| `buy CardName` | Buy a card (e.g., `buy Silver`) |
| `play CardName` | Play a card from hand |

### Examples

If Available Moves shows:
```
Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Play Copper
  [4] Buy Copper ($0)
  [5] Buy Silver ($3)
  [6] End Phase
```

You can use:
- `--move "1"` → Plays the first Copper
- `--move "5"` → Buys Silver (if you have $3)
- `--move "end"` → Ends the phase
- `--move "buy Silver"` → Same as move 5

---

## Turn Structure

Every turn has three phases in order:

### 1. Action Phase
- Play action cards (Village, Smithy, etc.)
- You start with 1 action
- If no action cards in hand, just end the phase

**What you'll see:**
```
Action Phase
Actions: 1  Buys: 1  Coins: $0
Available Moves:
  [1] End Phase
```

If you have action cards, they'll appear as move options.

### 2. Buy Phase
- First: Play treasures to generate coins
- Then: Buy cards with your coins
- You start with 1 buy

**What you'll see:**
```
Buy Phase
Actions: 1  Buys: 1  Coins: $0
Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Buy Copper ($0)
  [4] End Phase
```

**Important:** Coins start at $0. You must PLAY treasures to get coins.

After playing treasures:
```
Buy Phase
Actions: 1  Buys: 1  Coins: $4
Available Moves:
  [1] Buy Copper ($0)
  [2] Buy Silver ($3)
  [3] Buy Smithy ($4)
  [4] End Phase
```

### 3. Cleanup Phase
- Automatic in CLI (just shows briefly)
- All cards discarded, draw 5 new cards
- Next turn begins

---

## Phase Rules

### Action Phase Rules

| You CAN do | You CANNOT do |
|------------|---------------|
| Play action cards | Play treasures |
| End the phase | Buy cards |

### Buy Phase Rules

| You CAN do | You CANNOT do |
|------------|---------------|
| Play treasures | Play action cards |
| Buy cards (if you have coins) | Buy cards you can't afford |
| End the phase | |

### Key Insight: Coins Come From Playing Treasures

Your hand might show: `Copper, Copper, Silver, Estate`

But `Coins: $0` until you PLAY the treasures.

After playing all treasures: `Coins: $4` (1+1+2)

---

## Common Confusions

### Confusion 1: "Why can't I buy anything?"

**Cause:** You haven't played your treasures yet.

**Solution:** In Buy Phase, play all treasures first (moves [1], [2], etc.), THEN buy.

### Confusion 2: "The turn number changed unexpectedly"

**Cause:** You completed a turn (went through all phases).

**What happened:**
1. Action Phase → you ended it
2. Buy Phase → you ended it
3. Cleanup Phase → automatic
4. New turn starts

**This is normal.** The turn advances after Cleanup.

### Confusion 3: "I can't play my action card"

**Cause:** You're in Buy Phase, not Action Phase.

**Solution:** Action cards can only be played in Action Phase. If you're in Buy Phase, you missed your chance this turn.

### Confusion 4: "The Available Moves changed"

**Cause:** After each move, valid moves update.

**Example:** After playing treasures, buy options appear that weren't there before (because now you have coins).

**This is normal.** Always read the NEW Available Moves after each command.

### Confusion 5: "Why does Buys show 0?"

**Cause:** You already bought something this turn.

**What to do:** End the phase. You get 1 buy per turn (unless a card gives +buy).

---

## When You're Stuck

### Step 1: Read the Header

Look at the phase: `Action Phase` or `Buy Phase`?

### Step 2: Read Available Moves

These are your ONLY options. Pick one.

### Step 3: If No Good Options

Use `--move "end"` to end the current phase and move forward.

### Step 4: If You Get an Error

The error message tells you what went wrong. Common fixes:
- "Invalid move" → Use a move from Available Moves
- "Card not found" → Check spelling (case-sensitive: `Silver` not `silver`)

### Step 5: If Truly Confused

**DO NOT RESTART THE GAME.**

Instead:
1. Read the current game state carefully
2. Look at Available Moves
3. Pick the simplest option (often just "end")
4. Continue playing

---

## Big Money Strategy (Simple)

When unsure what to buy, follow this priority:

1. **$8+ coins:** Buy Province (6 VP, wins the game)
2. **$6-7 coins:** Buy Gold (+3 coins future turns)
3. **$3-5 coins:** Buy Silver (+2 coins future turns)
4. **$0-2 coins:** Buy nothing or Copper, end phase

This simple strategy works for learning the CLI.

---

## Quick Reference

### Turn Flow
```
Action Phase → Buy Phase → Cleanup → Next Turn
```

### Move Commands
```bash
--move "1"           # Execute move [1]
--move "end"         # End current phase
--move "buy Silver"  # Buy Silver card
```

### Reading State
- `Coins: $X` = How much you can spend
- `Buys: X` = How many cards you can buy
- `Actions: X` = How many action cards you can play

### Golden Rules
1. **Only use moves from Available Moves**
2. **Play treasures BEFORE buying**
3. **Turn advances after Cleanup (this is normal)**
4. **When confused, use "end" to move forward**
5. **NEVER restart - play through confusion**
