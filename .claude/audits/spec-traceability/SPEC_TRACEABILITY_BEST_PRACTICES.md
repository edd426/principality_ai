# Specification Traceability & Requirements Compliance Best Practices

**Status**: AUTHORITATIVE FRAMEWORK
**Created**: 2025-10-26
**Sources**: Red Hat Spec-Driven Development, Craig Larman AT

TD, IEEE Standards, Industry RTM Best Practices
**Last Updated**: 2025-10-26
**Purpose**: Framework for auditing requirements traceability and spec-driven development compliance

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Specification Layers](#specification-layers)
3. [Requirements Traceability Matrix](#requirements-traceability-matrix)
4. [TDD as Specification](#tdd-as-specification)
5. [Quality Dimensions](#quality-dimensions)
6. [Evaluation Framework](#evaluation-framework)
7. [References](#references)

---

## Core Principles

### 1. Specifications Define Success Criteria

**Principle:** Before writing any code, define what "done" means.

**Spec-Driven Development:**
```
Specifications → Tests → Implementation
(95%+ first-pass accuracy)
```

**Traditional Vibe Coding:**
```
Rough idea → Implementation → Iteration → Maybe works
(60-70% first-pass accuracy)
```

**Key Insight:** Comprehensive specifications enable AI/developers to generate production-ready code on first attempt.

---

### 2. Requirements Must Be Traceable

**Principle:** Every requirement must trace to implementation and tests.

**Bidirectional Traceability:**
- **Forward:** Requirements → Design → Code → Tests
- **Backward:** Tests → Code → Design → Requirements

**Purpose:**
- Forward ensures all requirements implemented
- Backward prevents scope creep

---

### 3. Tests ARE Executable Specifications

**Principle:** Tests and specifications are unified artifacts.

**ATDD Paradigm:**
```
Traditional: Requirements → Tests (separate, drift)
ATDD: Requirements ≡ Tests (unified, cannot drift)
```

**Benefit:** When requirements ARE tests, they stay synchronized automatically.

---

### 4. Specifications Evolve with Code

**Principle:** Update specifications in same commit as code changes.

**Why:** Separate updates cause drift and outdated specs.

**Practice:**
```bash
# ✅ Good
git commit -m "Add Village card
- Updated: docs/requirements/phase-1/cards.md
- Updated: tests with @req tags
- Implemented: VillageCard class"

# ❌ Bad
git commit -m "Add Village card"
# (specs updated separately 3 days later, now inconsistent)
```

---

## Specification Layers

### Layer 1: Functional Specifications ("What")

**Purpose:** Define desired outcomes in user/stakeholder language.

**Format:** User stories with acceptance criteria.

**Example:**
```markdown
# Feature: Village Card

## User Story
As a player, I want to play Village card during my turn to draw a card and gain actions.

## Acceptance Criteria
- Player can play Village during action phase
- Playing Village draws 1 card from deck
- Playing Village grants +2 actions
- Village moves to discard pile after play
- Action count decreases by 1 (net +1 from Village effect)
```

**Quality Standards:**
- Written in natural language (non-technical)
- Testable and verifiable
- Includes "Given-When-Then" or acceptance criteria
- No implementation details

---

### Layer 2: Technical Specifications ("How" - Language-Agnostic)

**Purpose:** Define architecture and contracts independent of language.

**Format:** Data structures, interfaces, API contracts.

**Example:**
```markdown
# Game State Contract

## Data Structure
```
GameState {
  players: Player[]
  currentPlayerIndex: number
  phase: "action" | "buy" | "cleanup"
  supply: Map<CardName, number>
  turn: number
}
```

## Card Effect Interface
```
interface CardEffect {
  validate(state: GameState): ValidationResult
  execute(state: GameState): GameState
  rollback(state: GameState, snapshot: GameState): GameState
}
```

## Move Execution Contract
Input: (GameState, Move)
Output: { success: boolean, gameState: GameState, error?: string }
```

**Quality Standards:**
- Platform/language agnostic
- Clear input/output contracts
- Component interaction patterns defined
- REST/API specifications where applicable

---

### Layer 3: Implementation Specifications (Language-Specific)

**Purpose:** Define technology choices and coding standards.

**Example:**
```markdown
# TypeScript Implementation Requirements

## Technology Stack
- TypeScript 5.0+
- Node.js 18+
- Jest for testing
- ESLint + Prettier

## Coding Standards
- Immutable data patterns (no mutations)
- Functional programming style
- 95%+ test coverage required
- JSDoc comments for public APIs

## Architecture Patterns
- Pure functions for game logic
- Seed-based deterministic randomness
- Result objects (not throwing exceptions)
```

**Quality Standards:**
- Specific version requirements
- Testing framework specified
- Code style defined
- Documentation requirements clear

---

### Layer 4: Test Specifications (Executable Requirements)

**Purpose:** Define requirements as executable tests.

**Format:** Test files with @req tags (this project's pattern).

**Example:**
```typescript
// @req: Village draws exactly 1 card from deck
// @edge: Empty deck → game ends
// @why: Village is fundamental +card mechanism
describe('Village card behavior', () => {
  it('should draw 1 card when played', () => {
    // Given: Player has Village in hand, 4 cards in deck
    const state = setupGame({ hand: ['Village'], deck: 4 });

    // When: Player plays Village
    const result = engine.executeMove(state, 'play Village');

    // Then: Player draws 1 card (deck now 3)
    expect(result.success).toBe(true);
    expect(result.gameState.players[0].deck.length).toBe(3);
    expect(result.gameState.players[0].hand.length).toBe(1); // Drew 1 card
  });
});
```

**Quality Standards:**
- Tests document requirements with @req tags
- Edge cases marked with @edge tags
- Rationale captured with @why tags
- Tests serve as executable specifications

---

## Requirements Traceability Matrix (RTM)

### RTM Structure

**Basic Format:**
```
| Req ID | Requirement | Design | Code | Tests | Status | Notes |
|--------|-------------|--------|------|-------|--------|-------|
```

**Enhanced Format (Bidirectional):**
```
| Req ID | Requirement | Phase | Design | Implementation | Tests | Status | Owner |
|--------|-------------|-------|--------|----------------|-------|--------|-------|
| R-001  | Village draws 1 card | 1.0 | ARCH-02 | cards/village.ts:45 | TC-101, TC-102 | Verified | dev-agent |
| R-002  | Village grants +2 actions | 1.0 | ARCH-02 | cards/village.ts:50 | TC-103 | Verified | dev-agent |
```

---

### Traceability Types

**1. Forward Traceability**

Direction: Requirements → Design → Code → Tests

Purpose: Ensure all requirements implemented and tested.

**Example Chain:**
```
REQ-101: "Player can play Village card"
  ↓
DESIGN: CardEffect interface with execute() method
  ↓
CODE: packages/core/src/cards/village.ts
  ↓
TESTS: packages/core/tests/village.test.ts (TC-101, TC-102, TC-103)
```

**Questions Answered:**
- Is every requirement implemented?
- Which code implements this requirement?
- Which tests verify this requirement?

---

**2. Backward Traceability**

Direction: Tests → Code → Design → Requirements

Purpose: Verify no unnecessary work.

**Example Chain:**
```
TEST: test_chain_rollback()
  ↓
CODE: packages/mcp-server/src/tools/game-execute.ts (chain validation)
  ↓
DESIGN: Transaction/savepoint pattern
  ↓
REQ: Phase 1.5 - Multi-card chain with atomic rollback
```

**Questions Answered:**
- Does this code serve a requirement?
- Why are we building this?
- Is this test necessary?

---

### RTM Best Practices

**1. Start Early**
- Create RTM during requirements phase
- Update with every requirement change
- Review in sprint planning

**2. Maintain Continuously**
- Update RTM with every code commit
- Link tests to requirements immediately
- Keep status current

**3. Keep Simple**
- RTM is a MAP (points to artifacts)
- Don't duplicate full requirement text
- Only essential columns

**4. Automate Where Possible**
- Use tools to auto-update traces
- Generate coverage reports automatically
- Alert on broken traces

---

## TDD as Specification

### TDD ≡ Executable Specifications

**Key Insight:** Tests written first define "what" system must do.

**TDD Process:**
```
1. Write test (specification of behavior)
2. Test fails (RED - specification not met)
3. Implement code (to satisfy specification)
4. Test passes (GREEN - specification satisfied)
5. Refactor (improve while maintaining specification)
```

**Connection to Specifications:**
- Test = Executable specification
- Test failure = Specification not met
- Test pass = Specification verified
- Test suite = Complete specification set

---

### ATDD (Acceptance Test-Driven Development)

**Extends TDD to system level:**

**ATDD Process:**
```
1. Collaborative workshop (define acceptance criteria)
2. Write acceptance tests (executable requirements)
3. Tests fail (requirements not met)
4. TDD inner loop (implement components)
5. Acceptance tests pass (requirements satisfied)
```

**Integration:**
```
ATDD (Outer Loop): System-level acceptance tests
   ↓
TDD (Inner Loop): Component-level unit tests
   ↓
Implementation: Code to pass tests
```

---

### Specification by Example

**Concept:** Use concrete examples instead of abstract requirements.

**Abstract (traditional):**
```
"System shall validate input correctly"
```

**Concrete (specification by example):**
```
Given: User enters "abc" in phone field
When: User submits form
Then: System displays "Phone must be digits only"

Given: User enters "5551234567"
When: User submits form
Then: System accepts and proceeds
```

**Benefits:**
- Unambiguous (concrete, not interpretable)
- Testable (directly executable)
- Complete (examples reveal edge cases)
- Understandable (stakeholders grasp immediately)

---

## Quality Dimensions

### Dimension 1: Completeness (0-25 points)

**Definition:** All requirements have specifications at all layers.

**Evaluation:**
- [ ] Functional spec exists (user story + acceptance criteria)
- [ ] Technical spec exists (architecture + contracts)
- [ ] Implementation spec exists (language + standards)
- [ ] Test spec exists (executable tests with @req tags)

**Scoring:**
- 25: All four layers complete for all requirements
- 20: Most requirements have all layers, minor gaps
- 15: Significant gaps in one layer
- 10: Missing multiple layers for many requirements
- 0: Most requirements lack specifications

---

### Dimension 2: Traceability (0-25 points)

**Definition:** Clear bidirectional traces from requirements to tests.

**Evaluation:**
- [ ] Forward traces complete (req → design → code → tests)
- [ ] Backward traces complete (tests → code → design → req)
- [ ] No orphaned requirements (requirements without implementation)
- [ ] No orphaned code (code without requirement justification)
- [ ] Traces documented in RTM or tooling

**Scoring:**
- 25: Complete bidirectional traceability, 0 orphans
- 20: Mostly complete traces, <5% orphans
- 15: Some broken traces, 5-10% orphans
- 10: Many broken traces, >10% orphans
- 0: No traceability system

---

### Dimension 3: Correctness (0-20 points)

**Definition:** Specifications accurately reflect intended behavior.

**Evaluation:**
- [ ] Functional specs match stakeholder intent
- [ ] Technical specs align with functional specs
- [ ] Implementation matches technical specs
- [ ] Tests verify actual requirements (not wrong things)
- [ ] No contradictions between spec layers

**Scoring:**
- 20: All specifications accurate and aligned
- 15: Minor inaccuracies, mostly correct
- 10: Some significant mismatches
- 5: Major correctness issues
- 0: Specifications don't match intent

---

### Dimension 4: Currency (0-15 points)

**Definition:** Specifications stay updated with code changes.

**Evaluation:**
- [ ] Specs updated in same commit as code
- [ ] No outdated specifications
- [ ] Recent update timestamps
- [ ] @req tags current
- [ ] RTM status reflects reality

**Scoring:**
- 15: All specs current, updated with code
- 12: Mostly current, minor lag
- 10: Some outdated specs
- 5: Many outdated specs
- 0: Specs rarely updated

---

### Dimension 5: TDD Compliance (0-15 points)

**Definition:** Tests written before implementation (TDD workflow).

**Evaluation:**
- [ ] Tests exist before feature implemented
- [ ] Tests document requirements (not just verify)
- [ ] Git history shows test-first pattern
- [ ] RED-GREEN-REFACTOR cycle followed
- [ ] Acceptance criteria as tests

**Scoring:**
- 15: Strict TDD compliance, tests always first
- 12: Mostly TDD, occasional violations
- 10: Mixed approach
- 5: Tests usually after code
- 0: No TDD practice

---

## Evaluation Framework

### Overall Scoring

```
Total Score = Completeness (0-25) + Traceability (0-25) +
              Correctness (0-20) + Currency (0-15) + TDD Compliance (0-15)

90-100: EXCELLENT - Exemplary spec-driven development
80-89:  GOOD      - Strong practices, minor improvements needed
70-79:  FAIR      - Adequate but needs improvement
60-69:  POOR      - Significant gaps to address
<60:    CRITICAL  - Fundamental issues, major rework needed
```

---

### Audit Process

**Step 1: Inventory**
- List all requirements documents
- Identify all test files
- Map implementation files
- Create RTM if doesn't exist

**Step 2: Evaluate Completeness**
- Check each requirement has all 4 spec layers
- Identify gaps
- Score completeness dimension

**Step 3: Evaluate Traceability**
- Verify forward traces (req → tests)
- Verify backward traces (tests → req)
- Identify orphans
- Score traceability dimension

**Step 4: Evaluate Correctness**
- Review specs against implementation
- Check for contradictions
- Verify tests validate right things
- Score correctness dimension

**Step 5: Evaluate Currency**
- Check update timestamps
- Review git history (specs updated with code?)
- Identify outdated specs
- Score currency dimension

**Step 6: Evaluate TDD Compliance**
- Review git history (tests before code?)
- Check test documentation (@req tags)
- Verify RED-GREEN-REFACTOR pattern
- Score TDD dimension

**Step 7: Report**
- Calculate total score
- Identify priority improvements
- Create remediation plan

---

## References

**Ground-Truth Sources:**

All principles derive from these saved sources:

1. **Red Hat: Spec-Driven Development**
   - Source: `.claude/audits/source-documents/spec-traceability/redhat-spec-driven-development.md`
   - Content: 4-layer specification framework, 95% first-pass accuracy methodology

2. **Craig Larman: Specification by Example & ATDD**
   - Source: `.claude/audits/source-documents/spec-traceability/specification-by-example-atdd.md`
   - Content: ATDD methodology, executable requirements, behavior-driven specifications

3. **Requirements Traceability Matrix Best Practices**
   - Source: `.claude/audits/source-documents/spec-traceability/requirements-traceability-synthesis.md`
   - Content: Forward/backward traceability, RTM structure, IEEE standards, industry best practices

4. **Google Unit Testing Principles**
   - Source: `.claude/audits/best-practices/google-unit-testing-principles.md`
   - Content: Test behavior not implementation, tests as specifications

---

**Version**: 1.0
**Created**: 2025-10-26
**Last Updated**: 2025-10-26
**Maintainer**: Requirements Architect
**Next Review**: End of Phase 2
