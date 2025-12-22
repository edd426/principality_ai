# TDD Workflow

**Status**: ACTIVE
**Created**: 2025-12-20
**Phase**: All

---

This project follows Test-Driven Development (TDD). Tests are written **first**, implementation follows.

## Feature Development Workflow

```
1. Requirements defined (FEATURES.md, TESTING.md)
   ↓
2. Tests written (test-architect)
   ↓
3. All tests FAIL (red phase)
   ↓
4. Implementation written (dev-agent)
   ↓
5. All tests PASS (green phase)
   ↓
6. Refactoring if needed (tests still pass)
```

## Bug Fix Workflow

```
1. Bug discovered / reported
   ↓
2. Test written that reproduces bug (test-architect)
   ↓
3. Test FAILS (validates bug exists)
   ↓
4. Bug fix implemented (dev-agent)
   ↓
5. Test PASSES (validates fix works)
   ↓
6. Test stays in suite forever (prevents regression)
```

## Agent Responsibilities

**test-architect** (owns specification):
- Gather and clarify requirements
- Write tests with @req tags (tests ARE the requirements)
- Ensure edge cases are covered
- Target 95%+ coverage

**dev-agent** (owns implementation):
- Implement code to PASS existing tests
- Refuse code-only requests (push back with reason)
- Verify no regressions
- Never modify test files

## When Tests Are Missing

**If dev-agent receives code without tests**:
> "Tests required before implementation. Per project TDD standard:
> - For features: Requirements → Tests → Implementation
> - For bugs: Tests → Bug Fix
>
> Please submit tests first."

**If test-architect receives implementation request**:
> "Implementation cannot proceed without tests. Submit test specifications first."

## Quality Metrics

- **All tests must pass** before PR submission
- **Coverage must be 95%+** (enforced by CI)
- **Zero regressions** (existing tests continue passing)
- **Performance targets met** (as defined in tests)

## Test Locations

- Test specifications: `docs/requirements/phase-X/TESTING.md`
- Test files: `packages/{core,cli,mcp-server}/tests/`
- Coverage report: `npm run test -- --coverage`
