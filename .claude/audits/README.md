# Claude Code Audits System

**Purpose**: Comprehensive auditing of project components (skills, code, documentation, etc.) against best practices and standards.

**Maintained**: Quarterly (Jan, Apr, Jul, Oct)

---

## Directory Structure

```
.claude/audits/
├── README.md                                    (this file)
├── best-practices/
│   └── anthropic-skills-guide.md               (authoritative reference - unmodified)
└── skills/
    ├── 2025-10-23-skills-audit.md              (latest audit)
    ├── 2025-07-23-skills-audit.md              (previous audits)
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
**Findings**: 3 skills audited; 85% compliance; 3 critical issues found
**Location**: `skills/2025-10-23-skills-audit.md`

**Summary**:
- ✅ All skills are functional and well-structured
- ⚠️ Missing YAML frontmatter in 2 skills
- ⚠️ Naming convention issue in 1 skill
- 💡 All issues are easily fixable

**Action Items**:
1. Fix YAML frontmatter in dominion-mechanics
2. Fix YAML frontmatter in dominion-strategy
3. Fix name casing in validating-tdd-workflow
4. Add TOC to both dominion skills

---

## Best Practices References

### Stored Authoritative Guides
- **Anthropic Skills Guide**: `best-practices/anthropic-skills-guide.md`
  - Source: Anthropic's official documentation
  - Status: Unmodified copy for reference
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
| 2025-10-23 | Skills | 85% | ✅ Complete | 10 | 1 | 4 | 5 |

---

## Tips for Effective Audits

1. **Use the checklist**: Don't audit from memory; use the best practices guide
2. **Be specific**: Document exact issues with line numbers when possible
3. **Provide solutions**: Include specific fixes, not just problems
4. **Track improvements**: Compare to previous audit to celebrate progress
5. **Prioritize**: Mark issues as critical/medium/minor
6. **Be constructive**: Focus on compliance, not criticism

---

## Questions?

Refer to the Anthropic Skills Best Practices guide for authoritative information:
`best-practices/anthropic-skills-guide.md`

---

**System Created**: 2025-10-23
**First Audit**: 2025-10-23 (Skills)
**Next Scheduled**: 2026-01-23 (Skills + Code review)
