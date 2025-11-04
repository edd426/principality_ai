# Dominion Mechanics Skill

## Purpose

This skill provides comprehensive documentation of Dominion card game mechanics, specifically designed for Claude to understand and play the game correctly.

Use this skill when you're:
- Confused about how a phase works (action/buy/cleanup)
- Unsure if a move is valid
- Getting error messages
- Asking questions about game rules
- Trying to understand card effects

## Contents

1. **SKILL.md** (Main reference)
   - Complete game flow explanation
   - Core mechanics (coin generation, actions, phases)
   - Command syntax and examples
   - Common mistakes and recovery strategies
   - Quick reference tables

2. **EXAMPLES.md** (Learning scenarios)
   - 15+ real-world examples from actual gameplay
   - Problem → Solution → Explanation format
   - Covers common confusion points
   - Shows phase transitions and card interactions

## Who Should Use This

You should reference this skill if:
- You receive an error message (invalid move, insufficient coins, etc.)
- You're confused about what phase you're in
- You're unsure how many coins you have
- You're asking "Can I play this?" or "What does this do?"
- You've never played Dominion before

## Key Concepts

1. **Treasures must be PLAYED** - Not automatic coin generation
2. **Three phases**: Action → Buy → Cleanup (always in this order)
3. **Resource limits**: 1 action, 1 buy per turn (cards can modify)
4. **Supply driven**: Only cards in supply can be bought
5. **Deck building**: Your deck improves over multiple turns

## Quick Links

- Game Flow: See SKILL.md "Game Flow" section
- Coin Generation: See SKILL.md "Core Misconception" section
- Commands: See SKILL.md "Command Reference" section
- Examples: See EXAMPLES.md for 15+ scenarios

## Common Questions Answered

**Q: How do I get coins?**
A: Play treasure cards in Buy phase. See EXAMPLES.md "EXAMPLE-2".

**Q: What's an action card?**
A: Cards like Village or Smithy that have effects. See SKILL.md "Action Economy".

**Q: How do I know what cards I can buy?**
A: Check the supply pile list. See EXAMPLES.md "EXAMPLE-8".

**Q: When does the game end?**
A: Province pile empty OR any 3 piles empty. See SKILL.md "Supply Piles".

**Q: What's the error "Invalid move"?**
A: Syntax error. See SKILL.md "Common Syntax Errors" table.

## Error Recovery Guide

| Error | Solution |
|-------|----------|
| Invalid move | Use index: `play 0` not `play CardName` |
| Card not found | Check exact name: `buy Silver` not `buy silver` |
| Insufficient coins | Play more treasures or buy cheaper card |
| Index out of range | You don't have that many cards in hand |
| Cannot play in phase | Check current phase, might need `end` first |

See SKILL.md "Common Syntax Errors" for more details.
