# Bug Report: {Brief Bug Description}

**Status**: OPEN | IN_PROGRESS | RESOLVED | CLOSED
**Created**: {YYYY-MM-DD}
**Severity**: LOW | MEDIUM | HIGH | CRITICAL
**Reporter**: {agent-name} or {Human}
**Assignee**: {agent-name} or {Human}
**Phase**: {1, 1.5, 2, etc.}

---

**Updates Log**:
- {YYYY-MM-DD}: {Agent/Human} - {Status update or change}

---

## Summary

{One-sentence description of the bug}

---

## Reproduction Steps

1. {Step 1}
2. {Step 2}
3. {Step 3}

**Required Setup**:
{Any special setup, configuration, or environment needed}

---

## Expected Behavior

{What should happen when following the reproduction steps}

---

## Actual Behavior

{What actually happens}

**Error Messages** (if any):
```
{Copy exact error message}
```

**Screenshots/Logs** (if applicable):
{Attach or describe}

---

## Root Cause

{Analysis of why this bug occurs - can be filled in during investigation}

**Location**: {file path:line number}

**Technical Details**:
{Deep dive into the code causing the issue}

---

## Impact

**User Impact**:
- {Who is affected}
- {How often does this occur}
- {Workaround available?}

**System Impact**:
- {Does this affect other features}
- {Performance implications}
- {Data integrity concerns}

---

## Fix

### Solution Approach

{Description of how to fix this}

**Changes Required**:
- {File 1}: {What needs to change}
- {File 2}: {What needs to change}

### Alternative Solutions

{Other ways to fix this and why they weren't chosen}

---

## Tests Added

### Regression Test

```typescript
test('should {verify bug is fixed}', () => {
  // Test that reproduces the bug
  // Should pass after fix is applied
});
```

### Related Tests

{Other tests added or modified to prevent similar bugs}

---

## Verification

- [ ] Bug reproduced
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tests added
- [ ] Tests passing
- [ ] Manual verification complete
- [ ] No regression in related features

---

## Related Issues

- {Link to related bugs}
- {Link to feature requests}
- {Link to requirements}

---

## Notes

{Any additional context, discoveries, or information}
