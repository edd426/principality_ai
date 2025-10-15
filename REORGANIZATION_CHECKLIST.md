# Documentation Reorganization Checklist

**Status**: NOT STARTED
**Estimated Time**: 2-3 hours
**Reference**: See [docs/DOCUMENTATION_SYSTEM.md](./docs/DOCUMENTATION_SYSTEM.md) Section 8 for details

## Prerequisites
- [ ] Read [docs/current/DOC_REORGANIZATION_SUMMARY.md](./docs/current/DOC_REORGANIZATION_SUMMARY.md)
- [ ] Read [docs/DOCUMENTATION_SYSTEM.md](./docs/DOCUMENTATION_SYSTEM.md) Section 8
- [ ] Understand the directory structure (Section 1)

---

## Step 1: Create Directory Structure (5 min)

```bash
# Create new directories
mkdir -p .claude/sessions
mkdir -p .claude/communication
mkdir -p .claude/templates
mkdir -p docs/guides
mkdir -p docs/reference/troubleshooting
```

**Checklist**:
- [ ] Created .claude/sessions/
- [ ] Created .claude/communication/
- [ ] Created .claude/templates/
- [ ] Created docs/guides/
- [ ] Created docs/reference/troubleshooting/
- [ ] Created .claude/sessions/README.md explaining structure

---

## Step 2: Consolidate Root Files (45 min)

**Goal**: Move 5 CLI_PHASE2_* files from root to docs/requirements/phase-1.5/

```bash
# Ensure target directory exists
mkdir -p docs/requirements/phase-1.5/

# Move and rename files
mv CLI_PHASE2_SUMMARY.md docs/requirements/phase-1.5/OVERVIEW.md
mv CLI_PHASE2_REQUIREMENTS.md docs/requirements/phase-1.5/FEATURES.md
mv CLI_PHASE2_TEST_SPEC.md docs/requirements/phase-1.5/TESTING.md
mv CLI_PHASE2_VISUAL_GUIDE.md docs/requirements/phase-1.5/UX_GUIDE.md

# Delete duplicate
rm CLI_PHASE2_1_REQUIREMENTS.md
```

**After moving, add metadata headers to each file**:
```markdown
# {Original Title}
**Status**: APPROVED
**Created**: 2025-10-14
**Phase**: 1.5
**Last Updated**: 2025-10-15 (moved during reorganization)
```

**Checklist**:
- [ ] Moved CLI_PHASE2_SUMMARY.md → docs/requirements/phase-1.5/OVERVIEW.md
- [ ] Moved CLI_PHASE2_REQUIREMENTS.md → docs/requirements/phase-1.5/FEATURES.md
- [ ] Moved CLI_PHASE2_TEST_SPEC.md → docs/requirements/phase-1.5/TESTING.md
- [ ] Moved CLI_PHASE2_VISUAL_GUIDE.md → docs/requirements/phase-1.5/UX_GUIDE.md
- [ ] Deleted CLI_PHASE2_1_REQUIREMENTS.md (duplicate)
- [ ] Added metadata headers to all 4 moved files
- [ ] Verified root now has only: README.md, CLAUDE.md, START_HERE.md, this checklist

---

## Step 3: Split Communication Log (20 min)

**Current**: .claude/communication-log.md (1,356 lines)
**Target**: Split into monthly rotation + active threads

### 3a: Extract Active Threads
- [ ] Create .claude/communication/ACTIVE_THREADS.md
- [ ] Review .claude/communication-log.md for UNRESOLVED items
- [ ] Copy unresolved threads to ACTIVE_THREADS.md
- [ ] Format each as:
  ```markdown
  ## Thread #{N}: {Title}
  - **Opened**: YYYY-MM-DD
  - **Agents**: agent1, agent2
  - **Status**: BLOCKED | IN_PROGRESS
  - **Description**: Brief summary
  - **Next Action**: What needs to happen
  ```

### 3b: Archive Resolved Items
- [ ] Create .claude/communication/2025-10.md
- [ ] Copy RESOLVED items from communication-log.md
- [ ] Keep only last 500 lines (most recent)
- [ ] Add header to 2025-10.md:
  ```markdown
  # Agent Communication Log - October 2025

  ## Format
  [YYYY-MM-DD HH:MM] FROM → TO | STATUS | Topic
  ```

### 3c: Create September Archive (if needed)
- [ ] Create .claude/communication/2025-09.md
- [ ] Move older entries (before October) to this file

### 3d: Add Final Entry to New Log
- [ ] Add entry to 2025-10.md:
  ```
  [2025-10-15 XX:XX] requirements-architect → ALL | ACTIVE | Documentation system created, reorganization in progress
  ```

### 3e: Cleanup
- [ ] Delete old .claude/communication-log.md
- [ ] Verify new structure works

**Checklist Summary**:
- [ ] ACTIVE_THREADS.md created with unresolved items only
- [ ] 2025-10.md created with last 500 lines of resolved items
- [ ] 2025-09.md created if needed for older entries
- [ ] Old communication-log.md deleted

---

## Step 4: Move Test Analysis (10 min)

```bash
mv .claude/TEST_FAILURE_ANALYSIS.md docs/reference/troubleshooting/TEST_FAILURES.md
```

**Add metadata header**:
```markdown
# Test Failure Analysis
**Status**: ACTIVE (living document)
**Created**: 2025-10-15
**Phase**: 1.5
**Last Updated**: 2025-10-15
```

**Checklist**:
- [ ] Moved .claude/TEST_FAILURE_ANALYSIS.md → docs/reference/troubleshooting/TEST_FAILURES.md
- [ ] Added metadata header
- [ ] File is < 600 lines (troubleshooting limit)

---

## Step 5: Update .gitignore (5 min)

Add these lines to .gitignore:
```
# Agent session files (ephemeral)
.claude/sessions/

# Optional: Keep active threads private
.claude/communication/ACTIVE_THREADS.md
```

**Checklist**:
- [ ] Added .claude/sessions/ to .gitignore
- [ ] Optionally added ACTIVE_THREADS.md to .gitignore
- [ ] Verified .gitignore syntax is correct

---

## Step 6: Create Templates (30 min)

Create 5 template files in .claude/templates/:

### Template 1: FEATURE_SPEC.md
- [ ] Create .claude/templates/FEATURE_SPEC.md
- [ ] Include sections: Problem, Solution, Acceptance Criteria, Technical Details, Test Plan, Dependencies
- [ ] Add metadata header template
- [ ] Add size check reminder (< 800 lines)

### Template 2: TEST_PLAN.md
- [ ] Create .claude/templates/TEST_PLAN.md
- [ ] Include sections: Scope, Test Cases, Edge Cases, Performance Tests, Coverage Target
- [ ] Add metadata header template

### Template 3: SESSION_NOTES.md
- [ ] Create .claude/templates/SESSION_NOTES.md
- [ ] Include sections: Goals, What Was Done, Blockers, Next Steps, Handoff Notes
- [ ] Add size limit reminder (< 300 lines)

### Template 4: BUG_REPORT.md
- [ ] Create .claude/templates/BUG_REPORT.md
- [ ] Include sections: Reproduction Steps, Expected vs Actual, Root Cause, Fix, Tests Added
- [ ] Add severity levels: LOW | MEDIUM | HIGH | CRITICAL

### Template 5: DECISION_RECORD.md
- [ ] Create .claude/templates/DECISION_RECORD.md
- [ ] Include sections: Context, Decision, Alternatives Considered, Consequences
- [ ] Add status options: PROPOSED | ACCEPTED | SUPERSEDED

**Checklist Summary**:
- [ ] All 5 templates created in .claude/templates/
- [ ] Each template has consistent metadata header
- [ ] Each template includes all required sections
- [ ] Size limits noted where applicable

---

## Step 7: Create docs/README.md (15 min)

Create navigation landing page for documentation.

**Checklist**:
- [ ] Create docs/README.md
- [ ] Include "Quick Links" section (Current Phase Status, API Reference, Dev Guide, Testing Guide)
- [ ] Include "By Phase" section (links to phase-1/, phase-1.5/, phase-2/)
- [ ] Include "By Task" section (task-based navigation)
- [ ] Verify all links work

**Content structure**:
```markdown
# Principality AI Documentation

**Quick Links**: (most common destinations)
**By Phase**: (phase-specific requirements)
**By Task**: (task-based navigation for humans)
```

---

## Step 8: Update Old References (15 min)

Find and fix old file path references in CLAUDE.md and other docs.

### 8a: Update CLAUDE.md
- [ ] Update "See Also" section in Phase 1.5 (lines ~121-126)
- [ ] Change CLI_PHASE2_* references to docs/requirements/phase-1.5/* paths
- [ ] Verify all internal links work

### 8b: Update Other Files
- [ ] Search for CLI_PHASE2_* references in all .md files
- [ ] Update to new paths
- [ ] Check README.md for broken links

**Commands to help**:
```bash
# Find references to old file names
grep -r "CLI_PHASE2" *.md docs/**/*.md

# Find references to old communication-log path
grep -r "communication-log.md" *.md docs/**/*.md .claude/**/*.md
```

**Checklist Summary**:
- [ ] Updated all CLI_PHASE2_* references in CLAUDE.md
- [ ] Updated all old path references in other docs
- [ ] Verified no broken links remain
- [ ] All internal documentation links work

---

## Final Verification (10 min)

### Root Directory Check
```bash
ls -1 *.md
```
**Expected output (3-4 files only)**:
- README.md
- CLAUDE.md
- CONTRIBUTING.md (if exists)
- START_HERE.md (delete after done)
- REORGANIZATION_CHECKLIST.md (delete after done)

**Checklist**:
- [ ] Root has ≤ 4 .md files (3 after cleanup)
- [ ] No CLI_PHASE2_* files in root
- [ ] No orphaned .md files

### File Size Check
```bash
wc -l .claude/communication/*.md docs/**/*.md | sort -rn
```

**Checklist**:
- [ ] No .claude/communication/*.md file > 500 lines
- [ ] No docs/requirements/*.md file > 800 lines
- [ ] No docs/reference/*.md file > 1000 lines

### Structure Verification
- [ ] .claude/sessions/ exists and is gitignored
- [ ] .claude/communication/ contains 2025-10.md and ACTIVE_THREADS.md
- [ ] .claude/templates/ contains 5 template files
- [ ] docs/requirements/phase-1.5/ contains 4 consolidated files
- [ ] docs/reference/troubleshooting/ exists with TEST_FAILURES.md
- [ ] docs/README.md exists and links work

---

## Git Commit (10 min)

**Checklist**:
- [ ] Run: `git add -A`
- [ ] Run: `git status` (review changes)
- [ ] Commit with message:
  ```
  Documentation System Reorganization Complete

  - Consolidated 5 root files → docs/requirements/phase-1.5/
  - Split communication log (1,356 lines → monthly rotation)
  - Created 5 agent templates in .claude/templates/
  - Established file size limits and lifecycle rules
  - Created docs/README.md navigation landing page

  Root directory: 7 files → 3 files
  All requirements: docs/requirements/phase-1.5/
  Communication: .claude/communication/ (< 500 lines/month)

  See docs/DOCUMENTATION_SYSTEM.md for full system spec.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- [ ] Verify commit includes all moved/created files
- [ ] Push to remote if applicable

---

## Post-Reorganization Cleanup

**Delete temporary files**:
- [ ] Delete START_HERE.md
- [ ] Delete REORGANIZATION_CHECKLIST.md (this file)

**Update CLAUDE.md**:
- [ ] Remove 🚨 "NEXT PRIORITY" section (reorganization complete)
- [ ] Update Phase 1.5 status to "READY FOR IMPLEMENTATION"

**Final commit**:
- [ ] Commit cleanup changes
- [ ] Push to remote

---

## Success! ✅

**You've completed the documentation reorganization!**

**Next Steps**:
1. Review docs/requirements/phase-1.5/FEATURES.md
2. Begin Phase 1.5 implementation (5 CLI UX features)
3. Use templates from .claude/templates/ for new documentation

**Time Tracking**:
- Actual time spent: _______ hours
- Any blockers encountered: _______
- Notes for future: _______

---

**Document Version**: 1.0
**Created**: 2025-10-15
**For**: Next agent session
