# Agent Communication Protocol

**Status**: ACTIVE
**Created**: 2025-10-21
**Scope**: test-architect ↔ dev-agent communication

## Core Principle

Communication happens IN artifacts (code/tests/commits), not alongside them.

## Minimal Token Format

### Test Comments (test-architect → dev-agent)

Use `@` tags for machine-readable, minimal-token documentation:

```typescript
// @req: Atomic chain execution - "1,2,3" runs all or none
// @rollback: Any move fails → entire chain reverts
// @edge: empty supply → rollback | invalid syntax → reject pre-exec
// @hint: transaction/savepoint pattern
it('should rollback entire chain on any invalid move', () => {
  // test
});
```

**Tags:**
- `@req:` - Core requirement
- `@rollback:` - Rollback behavior
- `@edge:` - Edge case (use `|` to separate multiple)
- `@hint:` - Implementation suggestion
- `@why:` - Rationale for non-obvious behavior

### Code Comments (dev-agent → test-architect)

```typescript
// @blocker: Transaction doesn't include supply state (test:145,178)
// Options: A) Include supply in snapshot B) Track supply changes separately
// Need: test-architect clarify if supply part of transaction
function executeChain(moves: string[]): GameResult {
  // implementation
}
```

**Tags:**
- `@blocker:` - Cannot proceed without clarification (include test line refs)
- `@decision:` - Architectural choice made (document why)
- `@resolved:` - Former blocker, now fixed (include commit hash)
- `@workaround:` - Temporary solution (explain limitation)

### Git Commits (both agents)

```
Subject: Brief summary (tests passing: X/Y)

Changes:
- Bullet points

Tests passing: ✓ test1 ✓ test2
Tests failing: ✗ test3 (reason)

Blocker: [if blocked, explain]
Next: [what should happen next]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Tag Reference

### Test-Architect Tags
| Tag | Purpose | Example |
|-----|---------|---------|
| `@req:` | Core requirement | `@req: Chains execute atomically` |
| `@rollback:` | Rollback behavior | `@rollback: Full chain on any failure` |
| `@edge:` | Edge cases | `@edge: empty supply \| timeout \| invalid input` |
| `@hint:` | Impl suggestion | `@hint: use transaction pattern` |
| `@why:` | Rationale | `@why: Prevents partial state corruption` |

### Dev-Agent Tags
| Tag | Purpose | Example |
|-----|---------|---------|
| `@blocker:` | Blocked, need help | `@blocker: Supply not in snapshot (test:145)` |
| `@decision:` | Choice made | `@decision: Using structuredClone for Map support` |
| `@resolved:` | Blocker fixed | `@resolved(fa80f5d): Used option A` |
| `@workaround:` | Temp solution | `@workaround: Manual Map clone until Node 18` |

## Search Patterns

Find agent communication:
```bash
# Active blockers
grep -r "@blocker:" packages/

# Test requirements
grep -r "@req:" packages/*/tests/

# Resolved issues (for cleanup)
grep -r "@resolved:" packages/

# Edge cases
grep -r "@edge:" packages/*/tests/
```

## Cleanup Rules

**Keep:**
- `@req:`, `@why:` for complex business logic
- `@decision:` for architectural choices
- `@edge:` for non-obvious edge cases

**Remove after merge:**
- `@blocker:` (replace with `@resolved:` during dev)
- `@resolved:` (after 1-2 commits, info is in git)
- `@hint:` (after implementation complete)
- `@workaround:` (after permanent fix)

## Example Workflow

1. **test-architect writes test:**
```typescript
// @req: Multi-card chains execute atomically
// @rollback: Any failure reverts entire chain
// @edge: empty supply → rollback | syntax error → reject
it('should rollback chain on invalid move', () => {});
```

2. **dev-agent implements, hits blocker:**
```typescript
// @blocker: Snapshot missing supply state (test:145,178)
// Options: A) Include supply in snapshot B) Track supply separately
// Need: Is supply part of transaction scope?
function executeChain(moves: string[]): GameResult {}
```

3. **test-architect clarifies in test:**
```typescript
// @req: Multi-card chains execute atomically
// @rollback: Any failure reverts entire chain (including supply)
// @clarify: Supply IS part of gameState, should be in snapshot
it('should rollback supply on chain failure', () => {});
```

4. **dev-agent fixes, marks resolved:**
```typescript
// @resolved(fa80f5d): Used structuredClone for Map deep copy
// @decision: structuredClone handles Map natively vs manual clone
function executeChain(moves: string[]): GameResult {
  const snapshot = structuredClone(gameState);
}
```

5. **After merge, cleanup:**
```typescript
// @decision: structuredClone handles Map natively vs manual clone
function executeChain(moves: string[]): GameResult {
  const snapshot = structuredClone(gameState);
}
```

## Token Efficiency

Old format example: ~200 tokens
```typescript
// ══════════════════════════════════════════════════════════════
// REQUIREMENT: Atomic chain execution
// ══════════════════════════════════════════════════════════════
// BEHAVIOR: Chain "1,2,3" executes all moves atomically
// ROLLBACK: If ANY move fails, entire chain reverts (not just failed move)
// RATIONALE: Prevents partial execution leaving game in inconsistent state
```

New format: ~50 tokens
```typescript
// @req: Atomic chain - "1,2,3" runs all or none
// @rollback: Any failure reverts entire chain
// @why: Prevents partial state corruption
```

**Savings: 75% token reduction**
