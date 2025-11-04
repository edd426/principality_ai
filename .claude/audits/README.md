# Claude Code Audits System

**Purpose**: Comprehensive auditing of project components (skills, code, documentation, etc.) against best practices and standards.

**Maintained**: Quarterly (Jan, Apr, Jul, Oct)

---

## Directory Structure

```
.claude/audits/
├── README.md                                    (this file)
├── best-practices/
│   ├── anthropic-skills-guide.md               (authoritative reference - unmodified)
│   ├── google-unit-testing-principles.md       (Google's unit testing best practices)
│   ├── software-testing-antipatterns.md        (Catalog of testing anti-patterns)
│   └── [future best practices guides...]
├── skills/
│   ├── 2025-10-23-skills-audit.md              (latest audit)
│   ├── 2025-07-23-skills-audit.md              (previous audits)
│   └── [future audits...]
└── tests/
    ├── TEST_AUDIT_CHECKLIST.md                 (actionable test audit criteria)
    ├── 2025-10-23-test-audit.md                (latest audit)
    └── [future audits...]
```

---

## How to Conduct an Audit

### 1. Schedule
Audits are conducted quarterly on:
- **Jan 23**: Q1 Audit
- **Apr 23**: Q2 Audit
- **Jul 23**: Q3 Audit
- **Oct 23**: Q4 Audit

### 2. Reference Standards
- **Skills Audits**: Use `best-practices/anthropic-skills-guide.md`
- **Test Audits**: Use `best-practices/google-unit-testing-principles.md` + `best-practices/software-testing-antipatterns.md` with `tests/TEST_AUDIT_CHECKLIST.md`
- **Code Audits** (future): Use project coding standards
- **Docs Audits** (future): Use project documentation guidelines

### 3. Create Audit Report
1. Copy latest audit report as template
2. Update date in filename: `YYYY-MM-DD-skills-audit.md`
3. Update Executive Summary metrics
4. Conduct fresh evaluation of each item
5. Compare to previous audit to track improvements
6. Document critical vs. recommended changes

### 4. Action Items
After audit:
1. Create tasks for critical issues (must fix)
2. Prioritize recommended improvements (should fix)
3. Plan implementation for next development cycle
4. Verify fixes in next audit

---

## Current Audits

### Skills Audit (2025-10-23)
**Status**: ✅ Complete
**Findings**: 3 skills audited; 100% compliance (improved from 85%)
**Location**: `skills/2025-10-23-skills-audit.md`

**Summary**:
- ✅ All skills are functional and well-structured
- ✅ All YAML frontmatter corrected
- ✅ All naming conventions fixed
- ✅ All TOCs added

**Action Items**: All completed ✅
1. ✅ Fixed YAML frontmatter in dominion-mechanics
2. ✅ Fixed YAML frontmatter in dominion-strategy
3. ✅ Fixed name casing in validating-tdd-workflow
4. ✅ Added TOC to both dominion skills

---

### Test Audit (2025-10-23)
**Status**: 🔄 In Progress
**Purpose**: Identify dummy tests, brittle tests, and missing coverage
**Location**: `tests/2025-10-23-test-audit.md`
**Checklist**: `tests/TEST_AUDIT_CHECKLIST.md`

**Phase**: Reference documents created, conducting audit...

---

## Best Practices References

### Stored Authoritative Guides

#### Skills Audits
- **Anthropic Skills Guide**: `best-practices/anthropic-skills-guide.md`
  - Source: Anthropic's official documentation
  - Status: Unmodified copy for reference
  - Last Updated: 2025-10-23

#### Test Audits
- **Google's Unit Testing Principles**: `best-practices/google-unit-testing-principles.md`
  - Source: Software Engineering at Google, Chapter 12
  - Authority: Google's battle-tested practices at massive scale
  - Focus: Maintainability, behavior testing, stability
  - Last Updated: 2025-10-23

- **Software Testing Anti-patterns**: `best-practices/software-testing-antipatterns.md`
  - Source: Kostis Kapelonis' comprehensive anti-patterns catalog
  - Authority: 13 major patterns that undermine quality
  - Focus: Identifying meaningless tests, false confidence
  - Last Updated: 2025-10-23

### Future References
As additional audit types are created, best practices will be stored:
- **Code Audit Standards** (planned)
- **Documentation Standards** (planned)
- **Architecture Guidelines** (planned)

---

## Audit Compliance Tracking

| Date | Type | Compliance | Status | Issues Found | Critical | Medium | Minor |
|------|------|-----------|--------|--------------|----------|--------|-------|
| 2025-10-23 | Skills | 100% | ✅ Complete | 6 | 1 | 4 | 1 |
| 2025-10-23 | Tests | TBD | 🔄 In Progress | TBD | TBD | TBD | TBD |

---

## Tips for Effective Audits

1. **Use the checklist**: Don't audit from memory; use the best practices guide
2. **Be specific**: Document exact issues with line numbers when possible
3. **Provide solutions**: Include specific fixes, not just problems
4. **Track improvements**: Compare to previous audit to celebrate progress
5. **Prioritize**: Mark issues as critical/medium/minor
6. **Be constructive**: Focus on compliance, not criticism

---

## How to Use the Test Audit References

### For Conductors
1. Read `google-unit-testing-principles.md` to understand what makes tests valuable
2. Read `software-testing-antipatterns.md` to understand what makes tests problematic
3. Use `tests/TEST_AUDIT_CHECKLIST.md` to evaluate each test file systematically

### For Test Authors
1. Review `google-unit-testing-principles.md` before writing tests
2. Check your tests against anti-patterns in `software-testing-antipatterns.md`
3. Use the checklist to validate test quality

---

## Questions?

Refer to:
- **Test Audits**: `best-practices/google-unit-testing-principles.md` and `software-testing-antipatterns.md`
- **Skills Audits**: `best-practices/anthropic-skills-guide.md`

---

**System Created**: 2025-10-23
**First Audit**: 2025-10-23 (Skills - Complete, 100% compliance)
**Current Audit**: 2025-10-23 (Tests - In Progress)
**Next Scheduled**: 2026-01-23 (All audits + Code review)
