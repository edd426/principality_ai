# 🚨 START HERE - Next Agent Instructions

**Date**: 2025-10-15
**Status**: Documentation reorganization required before Phase 1.5 implementation

## Quick Context

This project has documentation sprawl that needs cleanup before continuing with Phase 1.5 feature implementation. A complete reorganization plan has been created and is ready for execution.

## What You Need To Do

### ⚠️ PRIORITY: Execute Documentation Reorganization (~3 hours)

**DO NOT** start Phase 1.5 implementation until this is complete.

**Read These Files (in order)**:
1. **[docs/current/DOC_REORGANIZATION_SUMMARY.md](./docs/current/DOC_REORGANIZATION_SUMMARY.md)** - Executive summary (5 min read)
2. **[docs/DOCUMENTATION_SYSTEM.md](./docs/DOCUMENTATION_SYSTEM.md)** - Complete system spec (15 min read)
3. **[REORGANIZATION_CHECKLIST.md](./REORGANIZATION_CHECKLIST.md)** - 8-step execution checklist (use this!)

### Why This Matters

**Current Problem**:
- 7 .md files cluttering root (should be 2-3)
- Communication log at 1,356 lines (should be < 500)
- 4 duplicate Phase 1.5 requirement docs
- No sustainable documentation system

**After Reorganization**:
- Clean project structure
- Clear file hierarchy
- Size limits enforced
- Easy navigation for humans and agents
- Sustainable system that scales to Phase 5+

### Success Criteria

When you're done:
- ✅ Root directory has ≤ 3 .md files (README, CLAUDE, CONTRIBUTING)
- ✅ All Phase 1.5 docs consolidated in docs/requirements/phase-1.5/
- ✅ Communication log split into monthly files (< 500 lines each)
- ✅ 5 templates created in .claude/templates/
- ✅ docs/README.md navigation page exists
- ✅ All changes committed to git

**Time to Complete**: 2-3 hours
**After Completion**: Delete this START_HERE.md file and proceed with Phase 1.5

---

## After Reorganization: Phase 1.5 Implementation

Once documentation is clean, implement these 5 CLI UX features (25 hours total):

1. **Auto-Play Treasures** (4h) - Command to play all treasures at once
2. **Stable Card Numbers** (6h) - Fixed card numbers for AI agents
3. **Multi-Card Chained Submission** (8h) - Submit multiple moves: `1, 2, 3`
4. **Reduced Supply Piles** (2h) - `--quick-game` flag for faster testing
5. **Victory Points Display** (5h) - Show VP in game header

**Requirements**: See docs/requirements/phase-1.5/ (after Step 2 of reorganization)

---

## Quick Links

- **Executive Summary**: [docs/current/DOC_REORGANIZATION_SUMMARY.md](./docs/current/DOC_REORGANIZATION_SUMMARY.md)
- **Full System Spec**: [docs/DOCUMENTATION_SYSTEM.md](./docs/DOCUMENTATION_SYSTEM.md)
- **Execution Checklist**: [REORGANIZATION_CHECKLIST.md](./REORGANIZATION_CHECKLIST.md)
- **Project Instructions**: [CLAUDE.md](./CLAUDE.md)

---

**Note**: This file should be deleted after reorganization is complete.
