# Documentation Guidelines

**Status**: ACTIVE
**Created**: 2025-12-20
**Phase**: All

---

## Root Directory Policy

Root accepts ONLY these files:
- `README.md` (project overview)
- `CLAUDE.md` (developer instructions)
- `CONTRIBUTING.md` (optional)

Any other .md at root violates project policy.

## File Placement

| Content Type | Location |
|--------------|----------|
| Permanent docs | `docs/` (reference, guides, requirements) |
| Session notes | `docs/sessions/YYYY-MM-DD/` |
| Agent communication | @ tags in code/tests |
| Requirements | `docs/requirements/phase-X/` |

## Session Report Naming

Session reports use a folder-per-date structure:
```
docs/sessions/
├── 2025-11-07/
│   └── sorting-fix-and-quick-game-removal.md
├── 2025-11-08/
│   └── getvalidmoves-bug-test-summary.md
└── 2025-12-20/
    └── project-review-critique.md
```

**Convention**: `docs/sessions/YYYY-MM-DD/<descriptive-name>.md`

## Before Creating New Files

1. Search for existing similar content first
2. Check [docs/DOCUMENTATION_SYSTEM.md](./DOCUMENTATION_SYSTEM.md) for structure
3. Verify root policy compliance
4. Use correct location per table above

## Preventing Duplication

Single source of truth:
- Game installation → `README.md`
- Development setup → `docs/reference/DEVELOPMENT_GUIDE.md`
- E2E testing setup → `docs/testing/E2E_TESTING_GUIDE.md`

**Rule**: If instructions exist elsewhere, LINK to them. Do NOT copy-paste.

## File Size Limits

| Type | Max Lines |
|------|-----------|
| Root .md files | 400 |
| Requirements docs | 800 |
| Session notes | 300 |
| Reference docs | 1000 |

## Required Metadata Header

```markdown
# {Title}
**Status**: DRAFT | ACTIVE | APPROVED | ARCHIVED
**Created**: YYYY-MM-DD
**Phase**: {1, 1.5, 2, etc.}
```

## Agent Communication

test-architect and dev-agent communicate via **@ tags in code/tests**.
See `.claude/AGENT_COMMUNICATION.md` for protocol.

## Full Documentation System

See [docs/DOCUMENTATION_SYSTEM.md](./DOCUMENTATION_SYSTEM.md) for complete structure.
