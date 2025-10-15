# Documentation Governance System
**Status**: ACTIVE PLAN | **Created**: 2025-10-15 | **Priority**: HIGH

## Problem Statement

The project suffers from documentation sprawl:
- **Root clutter**: 7 .md files at project root (should be 2-3)
- **Duplicate requirements**: Multiple CLI_PHASE2_* files covering same content
- **Oversized logs**: `.claude/communication-log.md` at 1,356 lines (52KB)
- **Unclear ownership**: Agents create files without checking for existing ones
- **No lifecycle**: Files never archived or cleaned up
- **No size limits**: Files grow unbounded

## Solution: Structured Documentation Hierarchy

### 1. Directory Structure (FINAL)

```
principality-ai/
├── README.md                    # Project overview, quick start (< 300 lines)
├── CLAUDE.md                    # Agent instructions, current phase (< 400 lines)
├── CONTRIBUTING.md              # Developer guide (create if needed)
│
├── docs/                        # ✅ All permanent documentation
│   ├── current/                 # Current phase working documents
│   │   └── PHASE_STATUS.md      # Active phase status (replaces multiple files)
│   │
│   ├── requirements/            # Phase requirements (immutable once approved)
│   │   ├── phase-1/
│   │   ├── phase-1.5/
│   │   │   ├── OVERVIEW.md      # Consolidate CLI_PHASE2_SUMMARY
│   │   │   ├── FEATURES.md      # Consolidate CLI_PHASE2_REQUIREMENTS
│   │   │   ├── TESTING.md       # Consolidate CLI_PHASE2_TEST_SPEC
│   │   │   └── UX_GUIDE.md      # Consolidate CLI_PHASE2_VISUAL_GUIDE
│   │   └── phase-2/
│   │
│   ├── reference/               # Technical reference docs
│   │   ├── API.md
│   │   ├── ARCHITECTURE.md
│   │   ├── PERFORMANCE.md
│   │   ├── cards/
│   │   │   ├── CATALOG.md
│   │   │   └── STABLE_NUMBERS.md
│   │   └── troubleshooting/     # NEW: Common issues & solutions
│   │       └── TEST_FAILURES.md
│   │
│   ├── guides/                  # How-to guides (NEW)
│   │   ├── DEVELOPMENT.md       # Setup, commands, workflows
│   │   ├── TESTING.md           # How to write/run tests
│   │   └── DEPLOYMENT.md        # Azure deployment guide (Phase 2+)
│   │
│   └── archive/                 # Completed phase documents
│       ├── 2025-09/
│       └── 2025-10/
│
├── .claude/                     # Agent workspace (ephemeral + config)
│   ├── agents/                  # Agent configurations
│   │   ├── dev-agent.md
│   │   ├── test-architect.md
│   │   └── requirements-architect.md
│   │
│   ├── sessions/                # ⚠️ NEW: Session-specific files (gitignored)
│   │   ├── 2025-10-15_reorganization/
│   │   ├── 2025-10-14_phase1_completion/
│   │   └── README.md            # Explains session structure
│   │
│   ├── communication/           # ⚠️ NEW: Split communication logs
│   │   ├── 2025-10.md           # Current month (< 500 lines)
│   │   ├── 2025-09.md           # Archived month
│   │   └── ACTIVE_THREADS.md    # Unresolved cross-agent issues only
│   │
│   └── templates/               # NEW: File templates for agents
│       ├── FEATURE_SPEC.md
│       ├── TEST_PLAN.md
│       └── SESSION_NOTES.md
│
└── packages/                    # Code packages (unchanged)
```

### 2. File Size Limits

| File Type | Max Size | Action When Exceeded |
|-----------|----------|---------------------|
| Root .md files | 400 lines | Split into docs/ subdirectories |
| Phase requirements | 800 lines | Split into multiple focused docs |
| Communication logs | 500 lines | Rotate to new monthly file |
| Session notes | 300 lines | Archive to sessions/{date}/ |
| Reference docs | 1000 lines | Split into subsections |

### 3. File Lifecycle Rules

#### Creation Phase
```
1. Agent needs to write documentation
2. Check: Does existing file cover this topic?
   YES → Update existing file (append/edit)
   NO  → Proceed to step 3
3. Check: Is this temporary (session-specific)?
   YES → Create in .claude/sessions/{session_id}/
   NO  → Proceed to step 4
4. Check: What type of document?
   - Requirements → docs/requirements/phase-X/
   - Reference → docs/reference/
   - Guide → docs/guides/
   - Current work → docs/current/
5. Use template from .claude/templates/
6. Add metadata header (see section 5)
```

#### Update Phase
```
1. Check file status in metadata header
   - DRAFT → Anyone can edit
   - ACTIVE → Only session owner or with permission
   - APPROVED → Read-only (requirements only)
   - ARCHIVED → Read-only
2. Add update entry to metadata header
3. Check file size after edit
4. If over limit → Split or rotate
```

#### Archival Phase
```
Trigger: Phase completion or session end
1. Move session notes → .claude/sessions/{date}/
2. Move completed requirements → docs/archive/YYYY-MM/
3. Update PHASE_STATUS.md
4. Clear stale items from communication logs
```

### 4. Agent Guidelines

#### Before Creating New File
```markdown
CHECKLIST:
☐ Searched for existing file with similar purpose
☐ Checked docs/current/ for active documents
☐ Confirmed this isn't temporary (use sessions/ if so)
☐ Verified file will be < size limit for type
☐ Selected correct directory from structure above
☐ Using template from .claude/templates/ if available
```

#### File Naming Conventions
```
✅ GOOD:
- docs/requirements/phase-1.5/FEATURES.md
- .claude/sessions/2025-10-15_cli-ux/analysis.md
- docs/reference/cards/CATALOG.md

❌ BAD:
- CLI_PHASE2_REQUIREMENTS.md (redundant prefix)
- FINAL_FINAL_v3.md (versioning in name)
- temp_notes.md (unclear purpose)
```

#### Metadata Header (Required)
```markdown
# {Document Title}
**Status**: DRAFT | ACTIVE | APPROVED | ARCHIVED
**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Owner**: {Agent role or human}
**Phase**: {1, 1.5, 2, etc.}
**Size Check**: {current_lines}/{max_lines} lines

---
**Updates Log**:
- YYYY-MM-DD: {Agent/Human} - {Brief change description}
---
```

### 5. Communication Log System

#### Problem with Current System
- Single `communication-log.md` at 1,356 lines
- Mixes resolved and unresolved threads
- No easy way to find active issues
- Never cleaned up

#### New System: Monthly Rotation + Active Threads

**File: `.claude/communication/2025-10.md`** (< 500 lines)
```markdown
# Agent Communication Log - October 2025

## Format
Each entry: [YYYY-MM-DD HH:MM] FROM → TO | STATUS | Topic

## Log Entries
[2025-10-15 14:30] dev-agent → test-architect | RESOLVED | Test coverage for auto-play treasures
...
```

**File: `.claude/communication/ACTIVE_THREADS.md`** (< 100 lines)
```markdown
# Active Cross-Agent Issues

## Thread #1: Test Failure in Multi-Card Submission
- **Opened**: 2025-10-15
- **Agents**: dev-agent, test-architect
- **Status**: BLOCKED
- **Description**: Transaction rollback not working for chained moves
- **Next Action**: dev-agent to review transaction.ts:45-67

## Thread #2: VP Calculation Performance
- **Opened**: 2025-10-14
- **Agents**: dev-agent, requirements-architect
- **Status**: IN_PROGRESS
- **Description**: VP calculation taking > 10ms on large decks
- **Next Action**: requirements-architect to confirm if < 10ms is hard requirement
```

**Rotation Rule**: When `2025-10.md` hits 500 lines, archive unchanged and start `2025-11.md`.

### 6. Human Readability Features

#### Landing Page: docs/README.md
```markdown
# Principality AI Documentation

**Quick Links**:
- [Current Phase Status](./current/PHASE_STATUS.md) ⭐ START HERE
- [API Reference](./reference/API.md)
- [Development Guide](./guides/DEVELOPMENT.md)
- [Testing Guide](./guides/TESTING.md)

**By Phase**:
- [Phase 1 Requirements](./requirements/phase-1/)
- [Phase 1.5 Requirements](./requirements/phase-1.5/)
- [Phase 2 Requirements](./requirements/phase-2/)

**By Task**:
- I want to implement a feature → [Development Guide](./guides/DEVELOPMENT.md)
- I want to run tests → [Testing Guide](./guides/TESTING.md)
- I want to deploy → [Deployment Guide](./guides/DEPLOYMENT.md)
- I hit an error → [Troubleshooting](./reference/troubleshooting/)
```

#### Project Root Clarity
Only 3 files at root:
1. **README.md**: Project overview, quickstart commands
2. **CLAUDE.md**: Agent instructions, current phase pointer
3. **CONTRIBUTING.md**: How to contribute (for humans)

All other documentation → `docs/`

### 7. Agent-Specific Features

#### Session Management
Each agent session gets isolated workspace:
```
.claude/sessions/2025-10-15_cli-ux-improvements/
├── analysis.md          # Initial analysis
├── implementation.md    # Implementation notes
├── blockers.md          # Issues encountered
└── completion.md        # Handoff summary
```

**Benefits**:
- No pollution of main docs
- Easy to find recent work
- Can be gitignored for privacy
- Natural cleanup (delete old sessions)

#### Template System
Agents use templates for consistency:

**.claude/templates/FEATURE_SPEC.md**:
```markdown
# Feature: {Name}
**Status**: DRAFT
**Created**: {DATE}
**Phase**: {X}
**Estimated Hours**: {N}

## Problem
{What problem does this solve?}

## Solution
{High-level approach}

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Details
{Implementation notes}

## Test Plan
{How to verify}

## Dependencies
{Blocking issues or required features}
```

### 8. Immediate Action Plan

#### Step 1: Create New Structure (30 min)
```bash
# Create new directories
mkdir -p .claude/sessions
mkdir -p .claude/communication
mkdir -p .claude/templates
mkdir -p docs/current
mkdir -p docs/guides
mkdir -p docs/reference/troubleshooting

# Create README files
# (Agent creates these with explanations)
```

#### Step 2: Consolidate Root Files (45 min)
```bash
# Consolidate Phase 1.5 docs
Move CLI_PHASE2_SUMMARY.md → docs/requirements/phase-1.5/OVERVIEW.md
Move CLI_PHASE2_REQUIREMENTS.md → docs/requirements/phase-1.5/FEATURES.md
Move CLI_PHASE2_TEST_SPEC.md → docs/requirements/phase-1.5/TESTING.md
Move CLI_PHASE2_VISUAL_GUIDE.md → docs/requirements/phase-1.5/UX_GUIDE.md
Delete CLI_PHASE2_1_REQUIREMENTS.md (duplicate of FEATURES.md)

# Result: Root now has README.md, CLAUDE.md only (2 files)
```

#### Step 3: Split Communication Log (20 min)
```bash
# Extract unresolved items
.claude/communication-log.md → filter → ACTIVE_THREADS.md

# Archive resolved items
.claude/communication-log.md → 2025-10.md (keep last 500 lines)
                             → 2025-09.md (older entries)
```

#### Step 4: Move Test Analysis (10 min)
```bash
.claude/TEST_FAILURE_ANALYSIS.md → docs/reference/troubleshooting/TEST_FAILURES.md
```

#### Step 5: Update .gitignore (5 min)
```bash
# Add to .gitignore
.claude/sessions/
.claude/communication/ACTIVE_THREADS.md  # Optional: keep private
```

#### Step 6: Create Templates (30 min)
Create 5 templates in `.claude/templates/`:
- FEATURE_SPEC.md
- TEST_PLAN.md
- SESSION_NOTES.md
- BUG_REPORT.md
- DECISION_RECORD.md

#### Step 7: Update CLAUDE.md (15 min)
Add "Documentation Guidelines" section referencing this system.

#### Step 8: Create docs/README.md (15 min)
Landing page with navigation for humans and agents.

**Total Time**: ~3 hours

### 9. Maintenance Schedule

#### Weekly
- [ ] Check file sizes against limits
- [ ] Archive completed session notes
- [ ] Rotate communication log if > 500 lines
- [ ] Update ACTIVE_THREADS.md (close resolved)

#### Monthly
- [ ] Archive previous month's communication log
- [ ] Review docs/current/ (move completed to archive/)
- [ ] Clean .claude/sessions/ (delete > 30 days old)

#### Per Phase Completion
- [ ] Move phase requirements to docs/archive/YYYY-MM/
- [ ] Update docs/current/PHASE_STATUS.md
- [ ] Create new phase directory in docs/requirements/

### 10. Enforcement Mechanisms

#### Pre-commit Hook (Optional)
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check file sizes
for file in *.md docs/**/*.md; do
  lines=$(wc -l < "$file")
  # Warn if over limits (don't block)
  if [ $lines -gt 1000 ]; then
    echo "⚠️  Warning: $file is $lines lines (consider splitting)"
  fi
done

# Ensure no new root .md files (except allowed list)
allowed="README.md CLAUDE.md CONTRIBUTING.md"
for file in *.md; do
  if ! echo "$allowed" | grep -q "$file"; then
    echo "❌ Error: New root .md file detected: $file"
    echo "   → Move to docs/ directory"
    exit 1
  fi
done
```

#### Agent Reminder in CLAUDE.md
```markdown
## Documentation Guidelines
⚠️ **IMPORTANT**: Before creating any .md file, consult docs/DOCUMENTATION_SYSTEM.md
- Check for existing files first
- Use correct directory structure
- Add metadata header
- Follow size limits
```

## Success Metrics

✅ **Goal State**:
- Root directory: ≤ 3 .md files
- No .md file > 1000 lines
- All phase docs in docs/requirements/phase-X/
- Communication log < 500 lines/month
- Session notes isolated in .claude/sessions/
- Humans can navigate docs in < 30 seconds
- Agents can find templates in < 10 seconds

## Next Steps

**Immediate**:
1. Requirements-architect agent executes Steps 1-8 above
2. Test system with next feature implementation
3. Iterate based on agent feedback

**Future Enhancements**:
- Automated file size checker (CI/CD)
- Documentation linter for metadata headers
- Search tool for documentation (grep wrapper)
- Visual documentation map (generated diagram)

---

## Appendix A: Agent Decision Tree

```
Agent needs to write information
│
├─ Is it temporary/session-specific?
│  ├─ YES → .claude/sessions/{session-id}/notes.md
│  └─ NO  → Continue
│
├─ Is it communication with another agent?
│  ├─ YES → .claude/communication/{YYYY-MM}.md
│  └─ NO  → Continue
│
├─ Does existing file cover this?
│  ├─ YES → Update existing file
│  └─ NO  → Continue
│
├─ What type?
│  ├─ Feature spec → docs/requirements/phase-X/
│  ├─ API reference → docs/reference/
│  ├─ How-to guide → docs/guides/
│  ├─ Current work → docs/current/
│  └─ Troubleshooting → docs/reference/troubleshooting/
│
└─ Create file with metadata header
```

## Appendix B: File Type Matrix

| Information Type | Location | Example | Max Size |
|-----------------|----------|---------|----------|
| Project overview | Root | README.md | 300 |
| Agent instructions | Root | CLAUDE.md | 400 |
| Phase requirements | docs/requirements/phase-X/ | FEATURES.md | 800 |
| API reference | docs/reference/ | API.md | 1000 |
| Development guide | docs/guides/ | DEVELOPMENT.md | 600 |
| Current status | docs/current/ | PHASE_STATUS.md | 400 |
| Session notes | .claude/sessions/{date}/ | analysis.md | 300 |
| Communication | .claude/communication/ | 2025-10.md | 500 |
| Test failures | docs/reference/troubleshooting/ | TEST_FAILURES.md | 600 |
| Architecture | docs/reference/ | ARCHITECTURE.md | 1000 |

---

**Document Status**: Ready for implementation
**Assigned To**: requirements-architect agent (or any available agent)
**Blockers**: None
**Dependencies**: None
