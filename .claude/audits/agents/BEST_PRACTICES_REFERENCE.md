# Claude Subagents Best Practices Reference

**Status**: AUTHORITATIVE SOURCE
**Created**: 2025-10-23
**Sources**: Anthropic Official Documentation + Industry Standards
**Last Updated**: 2025-10-23

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Best Practices by Category](#best-practices-by-category)
3. [Anti-Patterns](#anti-patterns)
4. [Evaluation Framework](#evaluation-framework)

---

## Core Principles

### 1. Intentional Simplicity

**Principle**: Agents should be "low-level and unopinionated," providing clear access to capabilities without enforcing specific workflows.

**Rationale**: Flexibility enables adaptation to diverse project contexts while clarity prevents confusion.

**Application**:
- ✅ Clear, focused purpose statements
- ✅ Flexible tool selection (not enforced)
- ✅ Straightforward decision trees
- ❌ Complex conditional logic
- ❌ Enforced workflows that limit adaptability

---

### 2. Single Responsibility

**Principle**: Each subagent should have one clear, primary purpose.

**Rationale**: Focused agents perform better and are easier to understand, test, and improve.

**Application**:
- ✅ `test-architect`: Create/review tests ONLY
- ✅ `dev-agent`: Implement code ONLY
- ✅ `requirements-architect`: Define/refine requirements ONLY
- ❌ One agent handling multiple unrelated domains
- ❌ Overlapping responsibilities between agents

---

### 3. Principle of Least Privilege

**Principle**: Grant only the tools necessary for an agent's specific purpose.

**Rationale**: Improves security, prevents misuse, helps agent focus on relevant actions.

**Application**:
- ✅ test-architect: File read/write (tests only), no bash
- ✅ dev-agent: All tools (needs flexibility), full permissions
- ✅ requirements-architect: Read/write/search, no deletion
- ❌ Granting tools not needed for stated purpose
- ❌ Overly permissive tool access

---

### 4. Context Preservation

**Principle**: Subagents should preserve main conversation context while adding specialized expertise.

**Rationale**: Longer sessions, better coordination, reduced confusion from context switches.

**Application**:
- ✅ Subagents document decisions for main conversation
- ✅ Clear communication via git commits and comments
- ✅ Coordination through file-based communication
- ❌ Subagents losing track of project state
- ❌ Decisions made in isolation without team awareness

---

## Best Practices by Category

### A. Agent Description & Purpose

**Standard**: Clear, action-oriented descriptions that help Claude understand when to use the agent.

**Checklist**:
- [ ] 1-sentence summary of primary purpose
- [ ] Specific contexts where agent should be used
- [ ] Clear examples of appropriate tasks
- [ ] Examples of what agent does NOT do
- [ ] Links to documentation or CLAUDE.md for context

**Good Example**:
```
Use this agent to create, review, or improve test files.
Invoke when: (1) implementing new feature needs test coverage,
(2) existing tests need review, (3) requirements need tests written first.
```

**Bad Example**:
```
General purpose agent for various tasks
```

---

### B. System Prompt / Instructions

**Standard**: Detailed, specific instructions with examples and constraints.

**Checklist**:
- [ ] Clear mission statement (what agent is FOR)
- [ ] Operational guidelines (how agent should work)
- [ ] Specific project context (what agent needs to know)
- [ ] Common patterns with examples (both good and bad)
- [ ] Quality standards (what counts as success)
- [ ] Boundaries (what agent will NOT do)
- [ ] Communication protocol (how agent interacts with others)
- [ ] Edge cases and special handling

**Length Expectation**: 200-500 lines (detailed guidance, not brief)

**Good Coverage**:
- Mission and authority
- Operational guidelines (by context)
- Quality standards
- Output format expectations
- Inter-agent communication

**Poor Coverage**:
- Single paragraph instructions
- No examples
- Vague guidance
- No communication protocol

---

### C. Tool Access

**Standard**: Minimal tools necessary for purpose.

**Checklist**:
- [ ] Tools clearly justified by purpose
- [ ] Tool descriptions understood
- [ ] Permissions appropriate to risk level
- [ ] No unnecessary capabilities granted
- [ ] MCP tools documented if used

**Example - Good**:
```
test-architect has:
  ✓ Read (to understand code and existing tests)
  ✓ Write (to create test files)
  ✓ Edit (to modify tests)
  ✓ Glob/Grep (to find test patterns)
  ✗ Bash (not needed, might cause unintended side effects)
  ✗ Delete (prevent accidental test removal)
```

**Example - Bad**:
```
Agent given all tools without specific justification
```

---

### D. Boundaries & Authority

**Standard**: Clear definition of what agent can/cannot do.

**Checklist**:
- [ ] Authority clearly stated (decision-making scope)
- [ ] Boundaries explicit (what agent will NOT do)
- [ ] Escalation path defined (when to refuse/ask for help)
- [ ] Conflicts resolved (what if priorities conflict)
- [ ] Examples of boundary conditions

**Good**:
```
Authority: Final judgment on test fairness
Boundaries: NEVER modifies implementation code
Escalation: Requires requirement clarification → ask main conversation
```

**Bad**:
```
No clear authority or boundaries
```

---

### E. Communication Protocol

**Standard**: Explicit method for inter-agent coordination.

**Checklist**:
- [ ] How agents communicate (git, code comments, files)
- [ ] Standard tags/markers used
- [ ] Message format and structure
- [ ] Response expectations
- [ ] Examples of communication

**Reference**: `.claude/AGENT_COMMUNICATION.md` for minimal-token protocol

**Good**:
```
Communication via @ tags in test files:
  @req: Requirement (for dev-agent)
  @blocker: Blocked on something (needs clarification)
  @resolved: Issue resolved (with explanation)
Messages in git commits for context
```

**Bad**:
```
No defined communication method
```

---

### F. Documentation & Self-Documentation

**Standard**: Clear documentation of agent purpose, structure, and operation.

**Checklist**:
- [ ] Markdown YAML frontmatter with metadata
- [ ] Table of contents for long docs
- [ ] Examples for key concepts
- [ ] Links to related documentation
- [ ] Version history or update notes
- [ ] Test patterns (both good and bad)

---

### G. Performance & Effectiveness

**Standard**: Agent should accomplish its purpose efficiently without errors.

**Checklist**:
- [ ] Clear decision tree (agent knows what to do)
- [ ] Correct tool selection (uses right tools for tasks)
- [ ] Consistent quality (repeated success)
- [ ] Useful output (results match expectations)
- [ ] Improvement over time (learns from feedback)

---

## Anti-Patterns

### Anti-Pattern 1: Vague Purpose

**Problem**:
```
description: "General purpose agent"
```

**Why it's bad**: Claude doesn't know when to use the agent or what it should focus on.

**Fix**:
```
description: "Use to create and review test files.
Invoke when implementing new features, reviewing test quality,
or writing tests before implementation (TDD)."
```

---

### Anti-Pattern 2: Over-Broad Scope

**Problem**: Single agent handling multiple unrelated domains (testing, implementation, requirements)

**Why it's bad**: Agent becomes unfocused, dilutes expertise, confuses context

**Fix**: Separate agents with clear single responsibilities

---

### Anti-Pattern 3: Minimal Instructions

**Problem**:
```
"You are a coding agent. Write good code."
```

**Why it's bad**: No guidance on project style, patterns, quality standards, or special cases

**Fix**: Detailed instructions with examples, 200-500 lines of guidance

---

### Anti-Pattern 4: Tool Sprawl

**Problem**: Agent given all available tools regardless of relevance

**Why it's bad**: Agent distracted, increased error risk, security concerns

**Fix**: Principle of least privilege - only tools needed for purpose

---

### Anti-Pattern 5: No Communication Protocol

**Problem**: Agents act independently without coordination method

**Why it's bad**: Conflicts, inconsistency, duplicated effort, lost context

**Fix**: Explicit communication via git commits, code comments, or shared files

---

### Anti-Pattern 6: Unclear Boundaries

**Problem**: Agent has no stated limits or escalation path

**Why it's bad**: Agent might overstep authority, refuse valid work, or make wrong decisions

**Fix**: Clear authority, boundaries, and escalation rules

---

### Anti-Pattern 7: No Quality Standards

**Problem**: No definition of what counts as "good" output

**Why it's bad**: Agent doesn't know what to optimize for, quality varies wildly

**Fix**: Explicit quality standards, success criteria, examples

---

### Anti-Pattern 8: Conflicting Instructions

**Problem**: Different sections of instructions contradict each other

**Why it's bad**: Agent confused, inconsistent behavior, poor decisions

**Fix**: Unified instructions with clear priorities

---

## Evaluation Framework

### Dimension 1: Purpose Clarity (0-25 points)

**Description**: How clearly does the agent's purpose come across?

| Score | Characteristics |
|-------|-----------------|
| 25 | Crystal clear, action-oriented description; specific examples of when to use |
| 20 | Clear purpose; some examples; generally obvious when to use |
| 15 | Stated purpose; could be clearer; some ambiguity |
| 10 | Vague purpose; unclear when/how to use |
| 0 | No clear purpose |

**Questions**:
- Would a new team member understand this agent's purpose?
- Are there clear examples of appropriate tasks?
- Does description explain when NOT to use the agent?

---

### Dimension 2: Instructions Quality (0-25 points)

**Description**: How detailed and actionable are the instructions?

| Score | Characteristics |
|-------|-----------------|
| 25 | Comprehensive, detailed, examples for key concepts; clear guidelines |
| 20 | Good detail, some examples, mostly clear guidance |
| 15 | Adequate guidance; could be more detailed or specific |
| 10 | Minimal guidance; lacks examples or clarity |
| 0 | No meaningful instructions |

**Questions**:
- Are there examples of good vs. bad behavior?
- Does agent know how to handle edge cases?
- Are quality standards explicit?
- Would a developer understand the agent's philosophy?

---

### Dimension 3: Boundaries & Authority (0-20 points)

**Description**: How clearly are limits and decision-making scope defined?

| Score | Characteristics |
|-------|-----------------|
| 20 | Clear authority, explicit boundaries, escalation path defined |
| 15 | Clear boundaries; authority mostly clear; some escalation guidance |
| 10 | Some boundaries stated; authority unclear; escalation undefined |
| 5 | Vague boundaries; unclear authority; no escalation |
| 0 | No stated boundaries or authority |

**Questions**:
- Can agent make autonomous decisions within its domain?
- What must it refuse or escalate?
- Is escalation path clear?

---

### Dimension 4: Tool Access (0-15 points)

**Description**: Do tools match agent's purpose (principle of least privilege)?

| Score | Characteristics |
|-------|-----------------|
| 15 | Only essential tools; clear justification; secure setup |
| 12 | Appropriate tools; mostly justified; minor excess |
| 10 | Tools mostly relevant; some unjustified access |
| 5 | Significant excess tools; weak justification |
| 0 | Inappropriate tools or excessive permissions |

**Questions**:
- Does agent have tools needed for its purpose?
- Are there tools not needed? Why?
- Could permissions be more restrictive?

---

### Dimension 5: Communication Protocol (0-15 points)

**Description**: Is inter-agent coordination method clear and effective?

| Score | Characteristics |
|-------|-----------------|
| 15 | Explicit protocol defined; examples provided; references documentation |
| 12 | Clear protocol; adequate examples |
| 10 | Protocol described; could be clearer |
| 5 | Vague communication approach |
| 0 | No communication protocol defined |

**Questions**:
- How does this agent coordinate with others?
- What format is used for communication?
- Are there standard tags or patterns?

---

### Overall Scoring

```
Total Score = Sum of all dimensions (0-100)

90-100: Excellent - Production ready, clear standards
80-89:  Good - Solid agent, minor improvements possible
70-79:  Fair - Works but needs improvement
60-69:  Poor - Significant issues to address
<60:    Critically Deficient - Major rework needed
```

---

## References

**Official Anthropic Documentation**:
- Claude Code Best Practices: https://www.anthropic.com/engineering/claude-code-best-practices
- Subagents Guide: https://docs.claude.com/en/docs/claude-code/sub-agents
- Building Agents with Claude Agent SDK: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk

**Industry Standards**:
- Agent Design Pattern Catalogue (arxiv.org/abs/2405.10467)
- Agentic AI Design Patterns (cloud.google.com)
- Agent Instruction Patterns and Antipatterns (elements.cloud)

**Project-Specific**:
- CLAUDE.md: Project configuration and standards
- .claude/AGENT_COMMUNICATION.md: Communication protocol

---

**Version**: 1.0
**Last Reviewed**: 2025-10-23
**Maintainer**: Requirements Architect
