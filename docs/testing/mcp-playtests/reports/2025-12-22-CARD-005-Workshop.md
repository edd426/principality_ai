# Playtest: CARD-005 Workshop Gaining

**Date**: 2025-12-22 | **Game ID**: game-1766375250585-j825wfckb | **Turns**: 3 | **Result**: Failed - Setup Issue

## Summary

CARD-005 test scenario requires Workshop card, but the game initialization does not include Workshop in the kingdom card selection. This is a critical setup bug that prevents the test from running.

## Test Strategy

The requested test strategy was:
- Turn 1-2: End action phase, play treasures, buy Silver
- Turn 3+: When you have 3+ coins, buy Workshop (cost 3)
- When Workshop in hand: Play Workshop, select card to gain (cost up to 4)
- Continue for 15 turns or until game ends

## Findings

### Critical Bug: Missing Workshop Card

**Issue**: Game initialization selected these kingdom cards:
```
Mine, Moat, Cellar, Throne Room, Adventurer, Moneylender, Spy, Remodel, Feast, Village
```

**Expected**: Workshop should be in the kingdom card selection for CARD-005 test.

**Impact**: Cannot execute test strategy. Workshop cannot be purchased because it's not in the supply.

### What Actually Happened

1. Game initialized with empty supply display initially
2. Full state revealed kingdom cards without Workshop
3. Turn 2 executed: Player played 4 Copper cards
4. Turn 3: Player bought Silver (3 coins)
5. Supply contains: Copper, Silver, Gold, Estate, Duchy, Province, Curse, Mine, Moat, Cellar, Throne Room, Adventurer, Moneylender, Spy, Remodel, Feast, Village

**Workshop is missing from supply**

## Turn Log

| Turn | Action | Result | Coins |
|------|--------|--------|-------|
| 1 | end → action phase auto-resolved | - | 0 |
| 2 | Play 4x Copper → end | - | 4 |
| 3 | Play 4x Copper → buy Silver | Silver purchased | 1 remaining |

## Root Cause Analysis

The MCP game session initialization is not respecting the CARD-005 scenario requirement. The scenario specification (from test runner request) expects Workshop to be available, but the actual kingdom card selection was randomized or misconfigured.

**Possible causes**:
1. Scenario mapper not translating CARD-005 → Workshop kingdom selection
2. MCP game session new() not accepting kingdom card parameters
3. Kingdom card selection is fully randomized with no scenario support

## Recommendation

Before CARD-005 can be tested:
1. Verify scenario mapping in game initialization
2. Ensure MCP game_session accepts kingdom card parameters
3. Create scenario-specific game setup that includes Workshop
4. Add validation: CARD-005 setup must include Workshop in kingdom cards

## Technical Notes

- Game State API: Working correctly (supply visibility confirmed)
- Phase transitions: Working correctly (auto-cleanup to turn 2)
- Card playing: Working correctly (Copper plays generate coins)
- Issue: Kingdom card selection not scenario-aware
