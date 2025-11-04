# Specification by Example and Acceptance Test-Driven Development - Full Reference

**Status**: GROUND-TRUTH SOURCE
**Created**: 2025-10-26
**Source**: https://craiglarman.com/wiki/index.php?title=Specification_by_Example_and_Acceptance_Test-Driven_Development
**Last Accessed**: 2025-10-26
**Authority**: Craig Larman (Agile/Scrum expert, co-author of LeSS framework)
**Purpose**: Authoritative reference for ATDD methodology and spec-driven development audits

---

## Core Definition

> "Specification by example is a powerful technique to help clarify detailed requirements."

**Full Name:** Specification by Example (SBE) and Acceptance Test-Driven Development (ATDD)

**Also Known As:**
- Example-Driven Development
- Executable Requirements
- Test-Driven Requirements (TDR)
- Agile Acceptance Testing
- Behavior-Driven Development (BDD) - related but distinct

---

## What is Acceptance TDD?

### Definition

Acceptance TDD involves creating **system-level acceptance tests before implementing solutions**.

**Key Distinction from Programmer TDD:**
- **Programmer TDD**: Unit-level, developer-focused, tests methods/classes
- **Acceptance TDD**: System-level, customer-focused, tests features/behaviors

### Core Process

1. **Align stakeholders early** in iterations
2. **Use common language** - requirements as executable tests
3. **Create acceptance criteria** in executable form
4. **Implement to satisfy tests**
5. **Verify against executable specifications**

### Stakeholder Collaboration

**Participants:**
- Product management (defines features)
- Developers (implement solutions)
- Testers (ensure quality)

**Goal:** Agreement on iteration goals and requirements using shared, unambiguous language.

---

## The Paradigm Shift: Requirements ↔ Tests

> "This methodology blurs traditional boundaries between requirements and testing, creating requirements as tests and tests as requirements."

**Traditional Approach:**
```
Requirements → Design → Implementation → Tests
(separate artifacts, potential drift)
```

**ATDD Approach:**
```
Requirements ≡ Executable Tests ≡ Verification
(single artifact, no drift possible)
```

**Key Insight:** When requirements ARE tests, they:
- Can't drift from implementation
- Automatically verify correctness
- Stay updated with code changes
- Serve dual purpose (spec + validation)

---

## Specification by Example

### Core Principle

**Use concrete examples** instead of abstract statements to define requirements.

**Abstract (traditional):**
```
"The system shall validate user input for correctness."
```

**Concrete (specification by example):**
```
Given: User enters "abc123" in phone number field
When: User clicks Submit
Then: System displays "Phone number must contain only digits"

Given: User enters "5551234567" in phone number field
When: User clicks Submit
Then: System accepts input and proceeds to next step
```

### Why Examples Work Better

1. **Unambiguous:** Examples are concrete, not interpretable
2. **Testable:** Can be executed directly
3. **Understandable:** Stakeholders grasp examples instantly
4. **Complete:** Examples reveal edge cases
5. **Verifiable:** Pass/fail is objective

### Example-Driven Requirements Pattern

**Template:**
```
Feature: [Feature name]

Scenario: [Specific behavior]
  Given [initial context/state]
  When [action/event occurs]
  Then [expected outcome]

Scenario: [Another specific behavior]
  Given [different context]
  When [action occurs]
  Then [expected outcome]
```

**Game Engine Example:**
```
Feature: Playing Village card

Scenario: Player has Village in hand
  Given: Player hand contains [Copper, Copper, Estate, Village, Smithy]
  And: Deck contains [Copper, Estate, Duchy]
  And: Player has 1 action available
  When: Player plays Village card
  Then: Player draws 1 card from deck
  And: Player hand contains [Copper, Copper, Estate, Smithy, Copper]
  And: Player has 2 actions available (gained 1 from Village, net +1 after playing)
  And: Village moves to discard pile

Scenario: Player has no actions
  Given: Player hand contains [Village]
  And: Player has 0 actions available
  When: Player attempts to play Village
  Then: System rejects the move
  And: Error message: "No actions available"
  And: Village remains in hand
```

---

## Executable Specifications

### Key Concept

Specifications written as examples can be **directly executed** by testing frameworks.

**Technologies mentioned:**
- **FIT (Framework for Integrated Testing)** - Table-based executable tests
- **Robot Framework** - Keyword-driven executable specifications
- Both are free, open-source

### Declarative vs. Imperative Style

**Declarative (Recommended):**
- Expresses business rules
- Hides implementation details
- Readable by non-programmers
- Stable through refactoring

**Example (declarative):**
```
Play Village card
Expect player to have 2 actions
Expect deck to have 1 fewer card
```

**Imperative (Discouraged):**
- Specifies exact steps
- Couples to implementation
- Requires programming knowledge
- Brittle during refactoring

**Example (imperative):**
```
Call GameEngine.executeMove(state, {type: 'play', card: 'Village'})
Access state.players[0].actions
Assert state.players[0].actions equals 2
Access state.players[0].deck.length
Assert previous length minus current length equals 1
```

---

## Table-Based Specifications (FIT Pattern)

### Concept

Use tables to express business rules in a format that:
- Business analysts can write
- Stakeholders can understand
- Computers can execute

### Example: Card Effect Validation

**Table Specification:**
```
| Card    | Starting Actions | Starting Hand Size | After Play Actions | After Play Hand Size | Cards Drawn |
|---------|------------------|--------------------|--------------------|---------------------|-------------|
| Village | 1                | 5                  | 2                  | 5                   | 1           |
| Smithy  | 1                | 5                  | 0                  | 7                   | 3           |
| Market  | 1                | 5                  | 1                  | 5                   | 1           |
```

**Benefits:**
- Compact expression of many examples
- Easy to add more examples
- Non-programmers can extend
- Computer reads and executes each row

### Keyword-Driven Specifications (Robot Framework Pattern)

**Keywords** = domain-specific actions

**Example:**
```
Start New Game With Seed "test-123"
Player Hand Should Contain    Copper    Copper    Estate    Estate    Estate
Play Card    Village
Player Should Have Actions    2
Player Hand Should Contain    5 cards
```

**Benefits:**
- Natural language keywords
- Reusable across scenarios
- Business-readable
- Programmers implement keywords once, reuse many times

---

## Refactorable Executable Specifications

### Problem: Brittle Tests

Traditional tests break when internal implementation changes:
```typescript
// ❌ Brittle: Coupled to internal structure
expect(game.state.players[0].hand[3].name).toBe('Village');
```

### Solution: Behavior-Focused Specifications

Specifications test behavior, not implementation:
```typescript
// ✅ Refactorable: Tests observable behavior
expectPlayerHandToContain('Village');
```

**Key Principle:** Specifications should survive internal refactoring.

**Test:**
1. Refactor internal implementation
2. Run executable specifications
3. If specs pass → refactoring is safe
4. If specs fail → behavior changed (potential bug)

---

## Collaborative Workshops

### Purpose

Align entire team on requirements using examples before coding begins.

### Participants

- **Customers/Product Owners:** Define what success looks like
- **Developers:** Understand implementation implications
- **Testers:** Identify edge cases and failure modes
- **Business Analysts:** Document and organize specifications

### Workshop Format

1. **Present Feature:** Product owner describes desired functionality
2. **Ask Questions:** Team seeks clarification
3. **Generate Examples:** Collaboratively create scenarios
4. **Identify Edge Cases:** What could go wrong?
5. **Write Specifications:** Capture examples in executable format
6. **Review:** Ensure everyone agrees on expected behavior

### Example Workshop Output

**Feature:** Player can buy cards during buy phase

**Generated Examples:**
```
Scenario: Sufficient funds
  Given: Player has 5 coins
  When: Player buys Duchy (cost 5)
  Then: Player gains Duchy in discard pile
  And: Player has 0 coins remaining

Scenario: Insufficient funds
  Given: Player has 4 coins
  When: Player attempts to buy Duchy (cost 5)
  Then: Purchase rejected
  And: Player still has 4 coins

Scenario: Supply exhausted
  Given: Duchy supply count is 0
  When: Player attempts to buy Duchy
  Then: Purchase rejected
  And: Error: "Duchy supply exhausted"

Scenario: Wrong phase
  Given: Game phase is "action"
  When: Player attempts to buy Duchy
  Then: Purchase rejected
  And: Error: "Cannot buy during action phase"
```

---

## Benefits of ATDD

### 1. Shared Understanding

**Problem:** Different interpretations of requirements.

**Solution:** Concrete examples eliminate ambiguity.

**Example:**
- Abstract: "Player should be able to play cards"
- Concrete example reveals: "Only during action phase? What if no actions left? What happens to card after playing?"

### 2. Requirements as Living Documentation

**Problem:** Documentation becomes outdated.

**Solution:** Executable specifications stay current.

**Mechanism:**
- Specifications are tests
- Tests run on every commit
- Failing test = outdated specification
- Update specification = update test

### 3. Reduced Defects

**Problem:** Implementation doesn't match intent.

**Solution:** Specifications verify intent continuously.

**Data Point:** Teams using ATDD report 40-80% reduction in post-release defects (various case studies).

### 4. Faster Feedback

**Problem:** Issues found late in development.

**Solution:** Executable specifications fail immediately when behavior breaks.

### 5. Better Collaboration

**Problem:** Silos between roles.

**Solution:** Shared language (specifications) bridges roles.

---

## ATDD Workflow

### Step-by-Step Process

**Before Coding:**
1. **Workshop:** Team discusses feature
2. **Examples:** Generate concrete scenarios
3. **Specifications:** Write in executable format
4. **Review:** Stakeholders agree specifications are correct
5. **Commit:** Check specifications into version control

**During Coding:**
6. **Run Specifications:** All should fail (red phase)
7. **Implement:** Write code to make specifications pass
8. **Run Again:** Iterate until specifications pass (green phase)
9. **Refactor:** Improve code while keeping specifications passing

**After Coding:**
10. **Review:** Verify all acceptance criteria met
11. **Demo:** Show stakeholders working feature (prove with specs)
12. **Maintain:** Specifications stay in suite forever

### Integration with TDD

**ATDD (outer loop):**
- System-level acceptance tests
- Define feature behavior

**TDD (inner loop):**
- Unit-level programmer tests
- Define component behavior

**Workflow:**
```
1. Write acceptance test (ATDD) - fails
2. Write unit test (TDD) - fails
3. Write code to pass unit test
4. Repeat 2-3 until acceptance test passes
5. Refactor
6. Next acceptance test
```

---

## Common Pitfalls

### 1. Imperative Specifications

**Problem:** Writing specifications like code.

**Fix:** Use declarative, business-focused language.

### 2. Testing Implementation Details

**Problem:** Specifications coupled to internal structure.

**Fix:** Test observable behaviors only.

### 3. Skipping Collaboration

**Problem:** Developer writes specifications alone.

**Fix:** Involve entire team in specification workshops.

### 4. Too Many Examples

**Problem:** Hundreds of similar scenarios.

**Fix:** Focus on representative examples + edge cases.

### 5. No Maintenance

**Problem:** Specifications become outdated.

**Fix:** Treat specifications like production code - maintain rigorously.

---

## Technologies and Tools

### FIT (Framework for Integrated Testing)

**Type:** Table-based executable specifications

**Format:** HTML/Wiki tables

**Strengths:**
- Business-readable
- Easy to extend
- Language-agnostic

### Robot Framework

**Type:** Keyword-driven executable specifications

**Format:** Plain text with keywords

**Strengths:**
- Natural language style
- Extensive library ecosystem
- Python-based but tests any system

### Cucumber/Gherkin

**Type:** Given-When-Then scenarios

**Format:** Gherkin language

**Strengths:**
- Widely adopted
- Business-readable
- Many language bindings

### SpecFlow (.NET)

**Type:** BDD framework for .NET

**Format:** Gherkin language

**Strengths:**
- Visual Studio integration
- C# implementation

---

## Deliverables from ATDD Practice

**For Participants:**
- Practical skills in specification-by-example
- Understanding of executable requirements
- Techniques for bridging requirements, testing, and development
- Hands-on experience with ATDD tools

**For Projects:**
- Living documentation (always current)
- Executable acceptance criteria
- Automated regression suite
- Shared understanding across team

---

## Summary: Core Thesis

> "Specification by example fundamentally reshapes how requirements are captured and validated by making requirements executable, eliminating the traditional gap between documentation and verification."

**The ATDD Formula:**
```
Collaborative Workshops
  + Concrete Examples (not abstract requirements)
  + Executable Specifications (using FIT/Robot/Cucumber)
  + Behavior-Focused Tests (not implementation-focused)
  + Continuous Execution (with every code change)
  = Living Documentation + Verified Behavior + Reduced Defects
```

**Key Paradigm Shift:**
```
Traditional: Requirements → Tests (separate, drift)
ATDD: Requirements ≡ Tests (unified, no drift)
```

---

**Author**: Craig Larman
**Source**: Personal wiki/knowledge base
**Accessed**: 2025-10-26
**Saved as Ground Truth**: 2025-10-26
**Use Case**: Reference for ATDD methodology, specification-by-example practices, and executable requirements audits
