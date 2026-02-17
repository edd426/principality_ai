# Phase 5: Web UI & API Server

**Status**: In Progress
**Package**: `@principality/api-server`

---

## Overview

Phase 5 adds a web-based interface for playing Dominion against Claude AI. This document defines the API contracts and requirements for the HTTP/WebSocket server.

---

## Requirements

### API-001: HTTP REST Endpoints

| ID | Requirement | Status |
|----|-------------|--------|
| @req API-001.1 | `POST /api/games` creates a new human vs AI game | Implemented |
| @req API-001.2 | `GET /api/games/:gameId` returns filtered game state and valid moves | Implemented |
| @req API-001.3 | `POST /api/games/:gameId/move` executes a human player move | Implemented |
| @req API-001.4 | `DELETE /api/games/:gameId` ends a game early | Implemented |

### API-002: WebSocket Events

| ID | Requirement | Status |
|----|-------------|--------|
| @req API-002.1 | `game_state_update` sent when state changes | Implemented |
| @req API-002.2 | `ai_turn_start` sent when AI begins thinking | Implemented |
| @req API-002.3 | `ai_move` sent when AI executes a move | Implemented |
| @req API-002.4 | `narration` sent for optional game commentary | Implemented |
| @req API-002.5 | `game_over` sent when game ends | Implemented |
| @req API-002.6 | `subscribe` client event to join game channel | Implemented |
| @req API-002.7 | `set_narration` client event to toggle commentary | Implemented |

### API-003: State Filtering

| ID | Requirement | Status |
|----|-------------|--------|
| @req API-003 | ClientGameState hides opponent's hand contents | Implemented |

### AI-001: AI Model Selection

| ID | Requirement | Status |
|----|-------------|--------|
| @req AI-001 | Support Haiku, Sonnet, and Opus model selection | Implemented |

### AI-002: AI Decision Making

| ID | Requirement | Status |
|----|-------------|--------|
| @req AI-002.1 | AI receives full game context for decision making | Implemented |
| @req AI-002.2 | AI decisions include optional reasoning | Implemented |

### AI-003: Fallback Strategy

| ID | Requirement | Status |
|----|-------------|--------|
| @req AI-003 | Big Money fallback when Claude API unavailable | Implemented |

---

## API Contract

### Create Game

```
POST /api/games
Content-Type: application/json

{
  "aiModel": "haiku" | "sonnet" | "opus",
  "seed": "optional-seed",
  "kingdomCards": ["Village", "Smithy", ...],
  "enableNarration": true
}

Response:
{
  "gameId": "uuid",
  "gameState": ClientGameState,
  "wsUrl": "ws://host/games/uuid"
}
```

### Get Game State

```
GET /api/games/:gameId

Response:
{
  "gameId": "uuid",
  "gameState": ClientGameState,
  "validMoves": ValidMove[],
  "isGameOver": false,
  "winner": null,
  "scores": null
}
```

### Execute Move

```
POST /api/games/:gameId/move
Content-Type: application/json

{
  "move": {
    "type": "play_action",
    "card": "Village"
  }
}

Response:
{
  "success": true,
  "gameState": ClientGameState,
  "validMoves": ValidMove[],
  "isGameOver": false
}
```

### End Game

```
DELETE /api/games/:gameId

Response:
{
  "success": true,
  "message": "Game ended"
}
```

---

## WebSocket Protocol

### Connection

```
ws://host/games/:gameId
```

### Server Events

```typescript
// State changed
{ type: "game_state_update", payload: GameStateUpdateEvent }

// AI starting turn
{ type: "ai_turn_start", payload: AITurnStartEvent }

// AI made move
{ type: "ai_move", payload: AIMoveEvent }

// Commentary
{ type: "narration", payload: NarrationEvent }

// Game ended
{ type: "game_over", payload: GameOverEvent }

// Error
{ type: "error", payload: ErrorEvent }
```

### Client Events

```typescript
// Subscribe to game
{ type: "subscribe", payload: { gameId: "uuid" } }

// Toggle narration
{ type: "set_narration", payload: { enabled: true } }
```

---

## State Filtering

The `ClientGameState` provides different visibility levels:

| Data | Human Player | AI Opponent |
|------|--------------|-------------|
| Hand contents | Full visibility | Hidden (count only) |
| Draw pile | Count only | Count only |
| Discard pile | Full visibility | Full visibility |
| In play | Full visibility | Full visibility |
| Resources | Full visibility | Full visibility |

This prevents the human from seeing the AI's hand while maintaining game integrity.

---

## AI Strategy Pattern

```typescript
interface AIStrategy {
  name: string;
  decideMove(context: AIDecisionContext): Promise<AIDecision>;
  canHandle(context: AIDecisionContext): boolean;
}
```

**Strategy Chain:**
1. Claude API (primary) - Uses selected model
2. Big Money (fallback) - Deterministic fallback

If Claude API fails or times out, the Big Money strategy ensures the game continues.

---

## Type Definitions

All types are defined in `packages/api-server/src/types/`:
- `api.ts` - HTTP/WebSocket types
- `ai.ts` - AI strategy types
- `index.ts` - Re-exports

---

## Implementation Status

| Phase | Scope | Status |
|-------|-------|--------|
| 5.1 | HTTP endpoints (Hono) | Implemented |
| 5.2 | WebSocket server | Implemented |
| 5.3 | Claude AI strategy | Implemented |
| 5.4 | Big Money fallback | Implemented |
| 5.5 | Web UI (React/Vite) | In Progress |

## Remaining Work

- Wire WebSocket server into HTTP dev server (upgrade handler)
- Hook turn coordinator into game routes for auto AI turns
- End-to-end human vs Claude AI game flow via web UI
