# Dominion Mechanics Examples

15+ scenarios showing Dominion mechanics in practice.

---

## EXAMPLE-1: Basic Opening Hand

**Problem**: You start your first turn. Your hand shows:
```
Phase: action
Actions: 1
Hand: [Copper, Copper, Estate, Estate, Estate]
```

What do you do?

**Solution**:
1. You have no action cards, so you should end the action phase immediately
2. Use: `end`
3. Now you're in Buy phase

**Explanation**: Action cards like Village or Smithy would give you +card or +action effects. But Copper and Estate are not action cards. Copper is a treasure (buy phase), Estate is a victory card (no phase). So you skip action and move to buying.

---

## EXAMPLE-2: Coin Generation - The Critical Mistake

**Problem**: You're in Buy phase with this hand:
```
Phase: buy
Coins: 0
Buys: 1
Hand: [Copper, Copper, Silver]
Supply available: Copper (cost 0), Silver (cost 3), Gold (cost 6)
```

You think: "I have Copper and Silver in my hand, so I have 3 coins worth of stuff. Let me buy Gold!"

**Solution**: STOP. You have 0 coins right now. You must PLAY treasures first:
1. `play 0` (play first Copper)
2. `play 0` (play second Copper - now first index is Copper)
3. `play 0` (play Silver)
4. Now your coins show: 1+1+2 = 4 coins total
5. Then you can buy Silver for 3 coins
6. You cannot buy Gold (costs 6, you have 4)

**Explanation**: Treasures in hand do NOT give you coins. You must explicitly play them. This is the #1 mistake in Dominion.

---

## EXAMPLE-3: Phase Transition

**Problem**: You're in Action phase with this hand:
```
Phase: action
Actions: 1
Hand: [Village, Smithy, Copper, Estate, Estate]
```

You want to play Village first.

**Solution**:
1. Village is at index 0: `play 0`
2. Village resolves: "You get +1 card and +2 actions"
3. Your hand now has 6 cards (5 original + 1 from Village)
4. Your actions now show: 2 (because Village gave +2 but you spent 1 playing it)
5. You can play Smithy now: `play 0` (check hand first to find Smithy index)
6. Smithy resolves: "You get +3 cards"
7. When done with actions, say `end`
8. You enter Buy phase

**Explanation**: Action cards let you chain plays. Village + Smithy gets you 4 extra cards (1 from Village + 3 from Smithy) and gives you more actions to work with.

---

## EXAMPLE-4: Insufficient Coins Error

**Problem**: You're in Buy phase:
```
Phase: buy
Coins: 4 (played 1 Silver + 2 Copper = 2+1+1)
Buys: 1
Supply: Province (cost 8) available
```

You try: `buy Province`

**Result**: Error - "Insufficient coins to buy Province (need 8, have 4)"

**Recovery**:
1. You only have 4 coins
2. Look for a card you CAN buy: Silver (3 cost)
3. Try: `buy Silver`
4. Success! Now you have a Silver in your deck

**Explanation**: Buying power is limited. You need exactly enough coins. If you need more expensive cards, build up your treasure deck first.

---

## EXAMPLE-5: Invalid Move Error - Wrong Phase

**Problem**: You're in Action phase:
```
Phase: action
Hand: [Copper, Copper, Estate, Estate, Estate]
```

You're confused and try: `play Copper`

**Result**: Error - "Invalid move - use index number"

**Recovery**:
1. The error tells you: use index, not card name
2. Copper is at index 0: `play 0`
3. But wait - Copper isn't an ACTION card anyway!
4. Better solution: Just `end` the action phase since you have no action cards

**Explanation**: Two mistakes here - syntax (name vs index) and logic (treasures aren't played in action phase).

---

## EXAMPLE-6: Market Card Combo

**Problem**: You're in Action phase with Market:
```
Phase: action
Actions: 1
Buys: 1
Coins: 0
Hand: [Market, Copper, Silver, Estate, Estate]
```

You play Market: `play 0`

**Result**: Market resolves "+1 card, +1 action, +1 buy, +1 coin"

Your new state:
```
Actions: 1 (spent 1, got 1 back)
Buys: 2 (started with 1, got +1)
Coins: 1
Hand: 6 cards (started with 5, got +1)
```

**Continuation**: Now you can end action phase and go to Buy phase where you have 2 buys and 1 coin.

**Explanation**: Market is a utility card that improves multiple resources. +1 buy means you can buy 2 cards instead of 1.

---

## EXAMPLE-7: Smithy Draw Action

**Problem**: You're in Action phase:
```
Phase: action
Actions: 1
Hand: [Village, Smithy, Copper, Estate, Copper]
```

You play Village first: `play 0`
- Village gives: +1 card, +2 actions
- New actions: 2 (spent 1, got 2)
- New hand size: 6 cards

Now play Smithy: `play 0` (assuming Smithy is now at index 0)
- Smithy gives: +3 cards
- New hand size: 9 cards
- New actions: 1 (spent 1 playing Smithy)

**Result**: You've drawn 4 extra cards and still have 1 action left (if needed).

**Explanation**: Action cards synergize. Village + Smithy gets you more cards to work with in Buy phase.

---

## EXAMPLE-8: Supply Pile Visibility

**Problem**: You're in Buy phase:
```
Phase: buy
Coins: 5
Buys: 1
Supply:
  - Copper (8 left)
  - Silver (4 left)
  - Gold (3 left) ← Getting low
  - Estate (8 left)
  - Duchy (8 left)
  - Province (7 left)
  - Village (5 left)
  - Smithy (8 left)
  - Market (8 left)
```

**Decision**: Gold only has 3 left. Should I buy it?

**Solution**: Depends on game state and strategy:
1. If lots of turns left: Yes, buy Gold to improve your deck
2. If game ending soon (Province pile low): Maybe buy Duchy or Estate instead
3. Early game: Usually buy Silver to improve treasures first

**Explanation**: Supply management matters. If a valuable card is running low, buying it might be strategically important.

---

## EXAMPLE-9: Game End Condition - Province Empty

**Problem**: You're in your 10th turn. Current state:
```
Province pile: 1 card left (was at 8 start)
Your coins: 8
Buy phase, ready to buy
```

You buy: `buy Province`

**Result**: You got the last Province. The Province pile is now empty.

**Immediate**: The game ends immediately. Everyone counts VP in their decks. Highest wins.

**Explanation**: When Province pile reaches 0 cards, game ends. This is the primary win condition.

---

## EXAMPLE-10: Game End Condition - Three Piles Empty

**Problem**: After several turns, this supply state:
```
Copper pile: 0 left (emptied) ← EMPTY
Silver pile: 2 left
Gold pile: 5 left
Estate pile: 0 left (emptied) ← EMPTY
Duchy pile: 3 left
Village pile: 0 left (emptied) ← EMPTY
Smithy pile: 4 left
Market pile: 6 left
Province pile: 3 left
```

**Result**: Three piles are now empty (Copper, Estate, Village). The game ends immediately.

**Explanation**: Alternative end condition. If any 3 piles empty before Province, game still ends.

---

## EXAMPLE-11: Turn Summary - Complete Turn

**Scenario**: You have a deck with Copper, Silver, and an Estate.

**Turn breakdown**:

**Action phase** (1 action available):
- No action cards in hand
- `end` to go to Buy phase

**Buy phase** (1 buy available):
- Current hand: Copper, Copper, Silver, Estate, Estate
- Play treasures: `play 0`, `play 0`, `play 0` (all three treasures)
- Coins available: 1+1+2 = 4
- Buy: `buy Silver` (costs 3, leaves 1 coin unused)
- Can only buy 1 card per turn
- `end` to cleanup

**Cleanup phase** (automatic):
- All cards discarded (Copper, Copper, Silver, Estate, Estate, Silver bought)
- Draw 5 new cards from deck
- Turn ends

**New turn begins**: Back to Action phase with new 5 cards

**Explanation**: Complete turn cycle shows the flow. Note: You can't carry over unused coins to next turn.

---

## EXAMPLE-12: Building Your Deck Over Time

**Scenario**: First 3 turns, what's happening?

**Turn 1**:
- Start deck: 7 Copper + 3 Estate
- Draw: 5 Copper, 2 Estate (hand)
- Action phase: skip (no action cards)
- Buy phase: play treasures → 5 coins → `buy Silver`
- Deck now has: 7 Copper + 3 Estate + 1 Silver (10 cards total)

**Turn 2**:
- You might draw: 4 Copper, 1 Estate
- Play them: 4 coins
- `buy Copper` (can't afford Silver yet)
- Deck now: 8 Copper + 3 Estate + 1 Silver

**Turn 3**:
- You might draw: 3 Copper, 1 Silver, 1 Estate
- Play treasures: 3+2 = 5 coins
- `buy Silver` (costs 3)
- Deck now: 8 Copper + 3 Estate + 2 Silver

**Pattern**: Your deck improves gradually. Each Silver makes future turns better (2 coins vs 1 for Copper).

**Explanation**: Deck building is incremental. Small improvements compound over 20-30 turns.

---

## EXAMPLE-13: Confusion Recovery - Invalid Syntax

**Scenario**: You're unsure about commands

**Attempt 1**: `buy silver` (lowercase)
- Error: "Card not found"
- Fix: Use exact name → `buy Silver`

**Attempt 2**: `play Smithy` (use name instead of index)
- Error: "Invalid move - use index"
- Fix: Check hand, find Smithy at index X → `play 2` (if Smithy at index 2)

**Attempt 3**: `play 5` (index out of bounds)
- Error: "Index out of range"
- Fix: Your hand only has 5 cards (indices 0-4) → `play 4` instead

**Recovery pattern**: Each error tells you what went wrong. Read it carefully and adjust.

**Explanation**: The game gives good error messages. Use them to learn correct syntax.

---

## EXAMPLE-14: When to Buy Victory Cards

**Scenario**: You're in midgame (turn 15), state:
```
Province pile: 3 cards left
Your coins available: 6
Your deck contains: mostly Copper + Silver, some Gold
Current VP: 3 (from starting Estates)
```

**Decision**: Should I buy a Duchy (3 VP, costs 5) or another Gold (improves treasures)?

**Analysis**:
- Game will probably last 10-15 more turns
- If you buy Gold: Future turns will have better treasures → more coins
- If you buy Duchy: You get 3 VP now but deck doesn't improve

**Answer**: Buy Gold (improve deck economy) because game has many turns left

**Explanation**: VP cards are for endgame when you run out of improvement options.

---

## EXAMPLE-15: Endgame VP Transition

**Scenario**: You're near endgame (turn 25), state:
```
Province pile: 1 card left (was 8 start)
Your coins available: 8
Your deck contains: mostly Copper + Silver + Gold
Current VP: 5 (from Estates + other cards)
Supply has: Many Provinces left
```

**Decision**: Buy Province (8 VP) or buy another Gold?

**Answer**: Buy Province (costs 8, gives 6 VP immediately)

**Explanation**: Late game shifts to VP strategy. Your treasure deck is "mature" (has Gold, Silver mix). The optimal sequence for the play-out: maximize VP before game ends. This is the end-game optimal strategy and gameplay sequence that wins games.

