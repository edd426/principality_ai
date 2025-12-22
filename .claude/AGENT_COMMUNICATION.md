# Code Documentation Tags

**Status**: ACTIVE
**Created**: 2025-10-21
**Updated**: 2025-12-20

---

Use `@` tags to document requirements and decisions in code. These provide permanent, searchable documentation embedded where it matters.

## Tags

### In Tests (test-architect)

```typescript
// @req: Playing Village gives +1 card and +2 actions
// @why: Official Dominion rules - actions resolve before drawing
// @edge: Empty deck | No actions remaining | Hand limit
test('should apply Village effects correctly', () => {
  // ...
});
```

| Tag | Purpose | Example |
|-----|---------|---------|
| `@req:` | Requirement being tested | `@req: Mine upgrades treasure by up to +3 cost` |
| `@why:` | Rationale for non-obvious behavior | `@why: Throne Room doubles effects, not card plays` |
| `@edge:` | Edge cases (separate with `\|`) | `@edge: empty deck \| no valid targets` |

### In Source Code (dev-agent)

```typescript
// @decision: Using structuredClone for deep copy - handles Maps natively
const snapshot = structuredClone(gameState);
```

| Tag | Purpose | Example |
|-----|---------|---------|
| `@decision:` | Explains implementation choice | `@decision: Iterating backwards to allow splice during loop` |
| `@why:` | Rationale (same as in tests) | `@why: Supply must be checked before discard` |

## Search

```bash
grep -r "@req:" packages/*/tests/    # Find all requirements
grep -r "@decision:" packages/*/src/ # Find implementation decisions
grep -r "@edge:" packages/*/tests/   # Find edge cases
```

## Guidelines

- `@req:` should map to a testable behavior
- `@why:` explains things that aren't obvious from the code
- `@edge:` lists boundary conditions the test covers
- `@decision:` documents choices where alternatives existed

Keep tags concise. If you need more than one line, the code might need a regular comment block instead.
