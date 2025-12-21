# Google Documentation Best Practices - Full Reference

**Status**: GROUND-TRUTH SOURCE
**Created**: 2025-10-26
**Source**: https://google.github.io/styleguide/docguide/best_practices.html
**Last Accessed**: 2025-10-26
**Purpose**: Authoritative reference for documentation quality audits

---

## Introduction

Documentation is the story of your code. This guide presents Google's best practices for creating and maintaining high-quality documentation based on decades of experience with large-scale software projects.

---

## Core Best Practices

### 1. Minimum Viable Documentation

> "A small set of fresh and accurate docs are better than a large assembly of 'documentation' in various states of disrepair."

**Key Insight:** Quality over quantity. Documentation works best when it is "alive but frequently trimmed, like a bonsai tree."

**Practice:**
- Write only necessary documentation
- Focus on clarity and accuracy over comprehensiveness
- Regularly remove outdated or trivial content
- Maintain what you have before expanding

**Why This Matters:**
- Outdated docs are worse than no docs
- Maintenance burden grows with documentation size
- Readers trust smaller, curated sets more
- Engineers waste less time maintaining documentation

**How to Implement:**
1. Before writing new docs, ask: "Is this necessary?"
2. Remove obviously outdated material first
3. Consolidate redundant documentation
4. Focus on high-impact areas

---

### 2. Update Docs with Code

> "The remedy is to change the documentation in the same CL as the code change."

**Key Insight:** Documentation and code diverge when updated separately. The solution is simple: update both together.

**Practice:**
- Modify documentation in the same commit/PR as code changes
- Treat doc updates as part of "definition of done"
- Have reviewers verify documentation updates
- Make docs a required part of code review checklist

**Why This Matters:**
- Documentation stays accurate
- Changes are explained in context
- Reviewers understand code changes better
- Prevents documentation debt

**Example Workflow:**
```
1. Write code change
2. Update related documentation
3. Submit both in same PR
4. Reviewer checks both code and docs
5. Approve only when both are correct
```

**Red Flags:**
- ❌ "I'll update the docs later"
- ❌ PRs with code changes but no doc updates
- ❌ Separate "documentation sprint" after development
- ❌ Docs updated weeks after code changes

---

### 3. Delete Dead Documentation

> "Documents that aren't actively maintained should be killed. Any doc that refers to things that don't exist will make a new team member think they do."

**Key Insight:** Bad documentation is worse than no documentation. It spreads misinformation and creates confusion.

**Practice:**
- Actively seek and delete outdated docs
- Don't leave docs "just in case someone needs them"
- Mark deprecated docs clearly before deletion
- Create deletion workflow: identify → review → remove

**Why This Matters:**
- Outdated docs mislead engineers
- Bad docs lower quality standards
- Dead docs waste time (people read them)
- Incorrect docs cause bugs and delays

**Deletion Process:**
1. **Identify** dead docs:
   - Refers to removed features
   - Contains outdated instructions
   - Hasn't been updated in years
   - Written for old architecture

2. **Review** with team:
   - Is anyone still using this?
   - Does this need updating or deletion?
   - Can this be consolidated elsewhere?

3. **Delete** decisively:
   - Remove the file entirely
   - Don't leave "deprecated" docs lying around
   - Update links from other docs
   - Document the removal (git commit message)

**When in Doubt:**
- If you can't tell if a doc is current → it's probably dead
- If no one has looked at it in a year → delete it
- If it would take longer to update than rewrite → delete it

---

### 4. Prefer Good Over Perfect

> "Your documentation should be as good as possible within a reasonable time frame."

**Key Insight:** Pursuing perfection delays publication. Documentation that's "good enough" and published beats "perfect" documentation that never ships.

**Practice:**
- Ship documentation when it's useful, not when it's perfect
- Iterate and improve over time
- Get docs out to users quickly
- Refine based on feedback

**Why This Matters:**
- Perfect is the enemy of done
- Users benefit from good docs today vs. perfect docs never
- Documentation can evolve like code
- Feedback makes docs better than isolation

**Guidelines:**
- ✅ Clear and accurate → good enough to publish
- ✅ Covers critical paths → ship it
- ✅ Has obvious gaps → publish with "TODO" notes
- ❌ Grammatical perfection → don't wait for this
- ❌ Every edge case documented → don't wait for this

---

### 5. Documentation is the Story of Your Code

> "Code is a set of precise statements that tell a computer what to do. Prose is necessary for human understanding."

**Key Insight:** Code tells computers what to do. Documentation tells humans why and how.

**Documentation Hierarchy** (in order of preference):

#### Level 1: Meaningful Naming Conventions
Code that reads like prose is the best documentation.

```typescript
// ✅ Self-documenting
const isPlayerTurnComplete = checkAllActionsPlayed(player);

// ❌ Needs explanation
const x = chk(p);
```

#### Level 2: Inline Comments
Explain **why**, not **what**.

```typescript
// ✅ Explains why
// We shuffle before every game to prevent players from predicting card order
shuffle(deck, seed);

// ❌ States obvious
// Shuffle the deck
shuffle(deck, seed);
```

#### Level 3: Method/Class Documentation
Describe contracts, parameters, return values, and side effects.

```typescript
/**
 * Executes a player's move and returns updated game state.
 *
 * @param gameState - Current game state (immutable)
 * @param move - Move to execute
 * @returns {MoveResult} - Success status and new state
 * @throws {InvalidMoveError} - If move is invalid for current phase
 */
function executeMove(gameState: GameState, move: Move): MoveResult
```

#### Level 4: README.md Files
Orient readers to what's in a directory.

**Good README.md contains:**
- What this code does
- How to build/run it
- Dependencies and setup
- Links to more detailed docs

#### Level 5: `docs/` Directories
Implementation guides, architecture decisions, and deep dives.

**When to create `docs/` content:**
- Complex architecture needs explanation
- Multiple components interact
- Design decisions need justification
- Onboarding takes >1 hour

#### Level 6: Design Documents
Record major decisions and their rationale.

**Design docs should capture:**
- Problem statement
- Considered alternatives
- Chosen approach and why
- Trade-offs and limitations

#### Level 7: External Documentation
Published guides, API references, and tutorials.

**Link from code to external docs** when relevant.

---

### 6. Eliminate Duplication

> "Duplication is the root of all evil in documentation."

**Key Insight:** When information exists in multiple places, it becomes impossible to keep synchronized.

**Practice:**
- Define each concept once in an authoritative location
- Link from other docs to the primary source
- Use transclusion (embedding) for truly reusable content
- Never copy-paste documentation content

**Why This Matters:**
- Updates must be synchronized across files (they won't be)
- Inconsistencies appear between versions
- Maintenance becomes exponentially harder
- Users find contradictory information

**The Pattern: Topic-Based Authoring**

```
Single Source of Truth:
docs/setup/INSTALLATION.md (comprehensive setup guide)

Links from everywhere else:
README.md: "See [Installation Guide](docs/setup/INSTALLATION.md)"
CONTRIBUTING.md: "Follow [Installation Guide](docs/setup/INSTALLATION.md)"
docs/tutorials/: "Complete [Installation](docs/setup/INSTALLATION.md) first"
```

**Warning Signs of Duplication:**
- ❌ Same instructions in 3 different files
- ❌ Copy-pasted content across documentation
- ❌ Slightly different versions of same explanation
- ❌ Users ask "which guide should I follow?"

**How to Fix:**
1. Identify the best version (most accurate, most complete)
2. Designate it as the single source of truth
3. Replace duplicates with links
4. Maintain only the authoritative version

---

### 7. Documentation as Bonsai Tree

> "Docs work best when they are alive but frequently trimmed, like a bonsai tree."

**Key Insight:** Documentation requires ongoing care like a living plant.

**Practice:**
- Schedule regular reviews (quarterly, biannually)
- Assign ownership to specific people
- Prune dead branches (outdated content)
- Water living parts (update active content)
- Shape growth (guide documentation direction)

**Maintenance Schedule:**

**Weekly:**
- Update docs with code changes (as they happen)
- Fix errors reported by users

**Monthly:**
- Review most-accessed docs for accuracy
- Check for broken links

**Quarterly:**
- Audit documentation set for gaps
- Remove outdated material
- Consolidate redundant docs

**Annually:**
- Full documentation review
- Major reorganization if needed
- Archive historical content

**Signs of Healthy Documentation:**
- Recent update timestamps
- Few user-reported errors
- Clear ownership
- Organized structure
- No dead links

**Signs of Dying Documentation:**
- Last updated years ago
- Refers to removed features
- Broken links
- No clear owner
- Users complain it's wrong

---

## Summary: The Documentation Quality Formula

**High-quality documentation =**
1. ✅ Minimum viable (not comprehensive)
2. ✅ Updated with code (not separately)
3. ✅ Dead docs deleted (not archived "just in case")
4. ✅ Good enough > perfect (ship and iterate)
5. ✅ Story of code (explains why, not just what)
6. ✅ No duplication (single source of truth)
7. ✅ Maintained like bonsai (regular pruning and care)

**Bad documentation =**
- ❌ Comprehensive but outdated
- ❌ Updated separately from code
- ❌ Keeps everything forever
- ❌ Waits for perfection before shipping
- ❌ Only describes what code does
- ❌ Copy-pasted everywhere
- ❌ Write once, forget forever

---

## Implementation Checklist

### For New Projects
- [ ] Create README.md with project overview
- [ ] Set up `docs/` structure (if needed)
- [ ] Define documentation ownership
- [ ] Include docs in code review checklist
- [ ] Schedule first quarterly review

### For Existing Projects
- [ ] Audit current documentation set
- [ ] Delete obviously outdated material
- [ ] Identify duplication and consolidate
- [ ] Assign documentation ownership
- [ ] Update most critical docs first
- [ ] Set up maintenance schedule

### For Every Code Change
- [ ] Update relevant documentation in same PR
- [ ] Check for newly outdated content
- [ ] Fix broken links
- [ ] Update examples with new API
- [ ] Have reviewer verify docs

---

**Last Updated**: 2025-10-26 (source date not specified)
**Saved as Ground Truth**: 2025-10-26
**Use Case**: Reference for documentation quality audits and best practices
