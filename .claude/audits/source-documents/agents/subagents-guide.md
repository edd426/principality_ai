# Claude Code Subagents Guide - Full Reference

**Status**: GROUND-TRUTH SOURCE
**Created**: 2025-10-26
**Source**: https://docs.claude.com/en/docs/claude-code/sub-agents
**Last Accessed**: 2025-10-26
**Purpose**: Authoritative reference for subagent design and configuration audits

---

## Overview

Subagents are specialized AI assistants that Claude Code can delegate tasks to. Each operates with its own context window, custom system prompt, and configured tool access.

---

## What Are Subagents?

**Definition:** Subagents are lightweight AI assistants with specialized capabilities for specific tasks.

**Key Characteristics:**
- **Isolated context window** - Separate from main conversation
- **Task-specific expertise** - Fine-tuned with domain-specific instructions
- **Custom system prompts** - Detailed instructions for the domain
- **Configurable tool access** - Only tools needed for the task
- **Reusable** - Shareable across projects and teams
- **Stateless** - Each invocation is independent

---

## When to Use Subagents

### Good Use Cases

✅ **Specialized tasks** requiring domain expertise
- Code review
- Test generation
- Documentation writing
- Security analysis
- Performance optimization

✅ **Repetitive workflows** that follow patterns
- Format conversion
- Data validation
- Code refactoring
- File organization

✅ **Context isolation** to prevent pollution
- Long-running tasks
- Parallel work on multiple features
- Separating concerns (tests vs implementation)

### Poor Use Cases

❌ **Simple, one-off tasks** - Overhead not worth it
❌ **Highly contextual work** requiring full conversation history
❌ **Tasks requiring main conversation context** - Subagents don't see it

---

## Quick Start

### Creating a Subagent

**Method 1: Interactive**
1. Run `/agents` command
2. Select "Create New Agent"
3. Choose scope (project or user)
4. Define purpose and select tools
5. Customize system prompt
6. Save

**Method 2: Manual**
Create `.claude/agents/agent-name.md`:

```markdown
---
name: code-reviewer
description: Reviews code for bugs, style issues, and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. Analyze code for:
1. Potential bugs and edge cases
2. Style violations
3. Performance issues
4. Security vulnerabilities

Provide specific, actionable feedback with line numbers.
```

---

## Configuration

### File Structure

Subagents use Markdown with YAML frontmatter:

```markdown
---
name: identifier
description: Natural language description of when to use this agent
tools: Tool1, Tool2, Tool3 (optional)
model: sonnet|opus|haiku|inherit (optional)
---

System prompt content goes here.
Detailed instructions for the subagent.
```

### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Lowercase identifier (no spaces) |
| `description` | Yes | Natural language guidance on when to use |
| `tools` | No | Comma-separated list; inherits all if omitted |
| `model` | No | Defaults to configured subagent model |

### Field Details

**name**
- Must be lowercase
- No spaces (use hyphens)
- Unique within scope
- Examples: `code-reviewer`, `test-architect`, `doc-writer`

**description**
- Natural language explanation
- Include specific examples of when to use
- Claude uses this to decide when to invoke
- Be specific about the agent's purpose

**tools**
- Comma-separated list: `Read, Edit, Write, Bash`
- Omit field to inherit all tools
- Principle of least privilege: grant only necessary tools
- Examples:
  - `Read, Glob, Grep` - Read-only analysis
  - `Read, Edit` - Code modification (not creation)
  - `Read, Write, Bash` - Full development

**model**
- `sonnet` - Fast, balanced (recommended for most tasks)
- `opus` - Most capable (use for complex reasoning)
- `haiku` - Fastest (use for simple, repetitive tasks)
- `inherit` - Use main conversation's model

---

## File Locations

Subagent files are discovered in this priority order:

**1. Project-level** (highest priority)
- Path: `.claude/agents/`
- Scope: Current project only
- Version control: Checked into git
- Use for: Project-specific workflows

**2. User-level** (lower priority)
- Path: `~/.claude/agents/`
- Scope: All projects for this user
- Version control: Not shared
- Use for: Personal workflows

**3. CLI flag** (session-specific)
- Flag: `--agents /path/to/agents/`
- Scope: Current session only
- Use for: Testing, experimentation

**Priority rule:** Project-level agents override user-level agents with the same name.

---

## Invocation Methods

### Automatic Invocation

Claude automatically delegates tasks based on:
- Task description matching agent description
- Keywords like "proactively" or "must be used" in agent description

**Example:**
```markdown
---
description: Use this agent PROACTIVELY to review code after making changes
---
```
Claude will invoke this agent automatically after code changes.

**Trigger keywords:**
- "proactively"
- "must be used"
- "always invoke"
- "automatically use"

### Explicit Invocation

User directly requests the subagent:

```
"Use the code-reviewer subagent to check my changes"
"Have test-architect create tests for the new feature"
```

---

## Best Practices

### 1. Generate Initial Version with Claude

**Don't start from scratch.** Have Claude generate the initial subagent:

```
"Create a code-reviewer subagent that checks for:
- Potential bugs
- Style violations
- Performance issues
- Security vulnerabilities"
```

Then customize the generated result.

### 2. Design Focused Subagents

**Single responsibility principle** - Each subagent should have one clear purpose.

✅ **Good:**
- `test-architect` - Creates and reviews tests
- `code-reviewer` - Reviews code quality
- `doc-writer` - Writes documentation

❌ **Bad:**
- `general-helper` - Does everything
- `code-and-tests` - Multiple responsibilities

### 3. Write Detailed System Prompts

**Specificity matters.** Detailed instructions produce better results.

**Include:**
- Clear mission statement
- Specific tasks to perform
- Quality standards
- Examples of good/bad output
- Edge cases to handle
- What NOT to do

**Example:**
```markdown
You are a test architect specializing in TypeScript game engines.

## Your Mission
Create comprehensive, behavior-focused tests that:
1. Validate requirements (not implementation)
2. Cover happy path + edge cases
3. Use clear, descriptive test names

## Quality Standards
- 95%+ coverage of critical code
- Tests should survive refactoring
- No testing private methods
- Each test validates one behavior

## Examples
✅ GOOD: "should draw 2 cards when Village is played"
❌ BAD: "should work correctly"

## What NOT to Do
- Never test implementation details
- Never modify production code
- Never skip edge case testing
```

### 4. Limit Tool Access

**Principle of least privilege** - Grant only necessary tools.

**Examples:**

**Read-only analysis:**
```yaml
tools: Read, Glob, Grep
```

**Code modification (no creation):**
```yaml
tools: Read, Edit
```

**Full development:**
```yaml
tools: Read, Edit, Write, Bash
```

**Security consideration:** Overly permissive tool access increases risk.

### 5. Version Control Project-Level Subagents

**Check into git** so team members benefit:

```bash
git add .claude/agents/
git commit -m "Add code-reviewer subagent"
```

**Benefits:**
- Consistent workflows across team
- Changes reviewed like code
- History tracking
- Easy rollback if needed

### 6. Use `/agents` Interface for Tool Management

**Don't manually edit tool lists.** Use the `/agents` command:

1. Run `/agents`
2. Select agent to modify
3. Use UI to add/remove tools
4. Save changes

**Why:** Prevents syntax errors and invalid tool names.

---

## Advanced Patterns

### Pattern 1: Chaining Subagents

**Use case:** Complex workflows requiring multiple specialists.

**Example sequence:**
1. `requirements-architect` defines specifications
2. `test-architect` writes tests based on specs
3. `dev-agent` implements code to pass tests
4. `code-reviewer` reviews implementation

**Implementation:**
```
"Have requirements-architect define specs for the feature"
# Review specs
"Now have test-architect write tests"
# Tests written
"Now have dev-agent implement code to pass tests"
# Implementation complete
"Finally, have code-reviewer check the implementation"
```

### Pattern 2: Dynamic Selection

**Use case:** Claude chooses appropriate subagent based on task.

**Setup:** Write descriptive agent descriptions with clear use cases.

**Example:**
```
"Analyze this code and improve it"
```
Claude reads agent descriptions and picks:
- `security-analyzer` if code has auth logic
- `performance-optimizer` if code has loops
- `code-reviewer` for general improvements

### Pattern 3: Parallel Subagents

**Use case:** Independent tasks that can run simultaneously.

**Example:**
```
"Have test-architect create tests while dev-agent refactors module X"
```

**Benefit:** Faster completion of independent work.

---

## Performance Considerations

### Context Window Management

**Problem:** Subagents start with clean context (no conversation history).

**Impact:**
- May add latency (context gathering)
- Reduces main conversation context pollution

**When beneficial:**
- Long conversations
- Complex projects
- Multiple parallel tasks

### Model Selection Strategy

**sonnet** (default, recommended)
- Fast execution
- Good quality
- Cost-effective
- Use for: 90% of tasks

**opus**
- Highest quality
- Slower execution
- Higher cost
- Use for: Complex reasoning, critical decisions

**haiku**
- Fastest execution
- Lower quality
- Lowest cost
- Use for: Simple, repetitive tasks only

---

## Troubleshooting

### Agent Not Being Invoked

**Check:**
1. Description clear and specific?
2. Keywords like "proactively" present?
3. Agent file in correct location?
4. No syntax errors in YAML frontmatter?

**Debug:**
```
Run /agents and verify agent is listed
Check file permissions (readable?)
Review description for clarity
```

### Agent Producing Poor Results

**Check:**
1. System prompt detailed enough?
2. Examples provided for good/bad output?
3. Tool access sufficient?
4. Model appropriate for task complexity?

**Improve:**
- Add more specific instructions
- Include examples
- Define quality standards
- Consider switching to opus for complex tasks

### Agent Has Wrong Tool Access

**Fix:**
1. Run `/agents`
2. Select the agent
3. Modify tool list via UI
4. Save changes

**Don't manually edit** - use the interface.

---

## Examples

### Example 1: Code Reviewer

```markdown
---
name: code-reviewer
description: Use this agent to review code for quality, bugs, and best practices. Invoke after making changes or before committing.
tools: Read, Glob, Grep
model: sonnet
---

You are an expert code reviewer specializing in TypeScript.

Review code for:
1. **Bugs** - Logic errors, edge cases, null checks
2. **Style** - Consistency with project conventions
3. **Performance** - Unnecessary loops, inefficient algorithms
4. **Security** - Input validation, injection risks
5. **Maintainability** - Clarity, documentation, complexity

Provide:
- Specific line numbers for issues
- Explanation of the problem
- Suggested fix
- Severity (critical, major, minor)

Example feedback format:
```
**Line 45 (Major):** Missing null check before accessing `user.profile`
**Fix:** Add `if (user?.profile)` guard
**Why:** Will throw error if profile is undefined
```
```

### Example 2: Test Architect

```markdown
---
name: test-architect
description: Use this agent to create comprehensive tests for new features or review existing test quality. Must be invoked BEFORE implementation begins (TDD).
tools: Read, Write, Edit, Bash
model: sonnet
---

You are a test architect specializing in TDD for TypeScript projects.

## Core Principles
1. **Tests FIRST** - Write tests before implementation
2. **Behavior-focused** - Test what, not how
3. **Comprehensive** - Cover happy path + edge cases
4. **Clear naming** - "should [behavior] when [condition]"

## Test Structure
```typescript
describe('When player plays Village card', () => {
  it('should draw 1 card from deck', () => {
    // Arrange: Setup game state
    // Act: Execute move
    // Assert: Verify behavior
  });

  it('should gain 2 actions', () => { ... });
});
```

## Quality Standards
- 95%+ coverage of critical code
- Tests survive refactoring (don't test internals)
- Each test validates one behavior
- Clear failure messages

## What to Test
✅ Public APIs and behaviors
✅ Edge cases (empty, null, boundary)
✅ Error conditions

❌ Private methods
❌ Implementation details
❌ Getters/setters (unless logic)
```

### Example 3: Documentation Writer

```markdown
---
name: doc-writer
description: Use this agent to create or update documentation for features, APIs, and guides.
tools: Read, Write, Edit, Glob
model: sonnet
---

You are a technical writer specializing in developer documentation.

## Documentation Standards
1. **Clarity** - Simple, active voice
2. **Completeness** - All features documented
3. **Examples** - Show, don't just tell
4. **Structure** - Logical hierarchy

## Document Types

**README.md:**
- Project overview
- Quick start (< 5 minutes)
- Installation
- Basic usage
- Links to detailed docs

**API Reference:**
- Function signature
- Parameters with types
- Return value
- Examples
- Edge cases / errors

**Guides:**
- Step-by-step instructions
- Explain "why" not just "how"
- Screenshots when helpful
- Common pitfalls

## Writing Style
- Second person ("you")
- Present tense
- Active voice
- Short sentences (< 25 words)
- Code examples for complex concepts

## Formatting
- Headers for sections
- Code blocks with syntax highlighting
- Bulleted lists for options
- Numbered lists for steps
- Tables for comparisons
```

---

## Summary

Subagents enable:
- **Specialization** - Expert assistance for specific tasks
- **Isolation** - Clean context for focused work
- **Reusability** - Share workflows across projects
- **Efficiency** - Longer sessions through context management

**Best practices:**
1. Single responsibility per agent
2. Detailed system prompts with examples
3. Principle of least privilege for tools
4. Version control project-level agents
5. Generate initial version with Claude
6. Use descriptive, specific descriptions

**Common patterns:**
- Chaining: Sequential specialist workflow
- Dynamic selection: Claude picks appropriate agent
- Parallel: Independent tasks simultaneously

---

**Last Updated**: 2025-10-26 (source content appears current)
**Saved as Ground Truth**: 2025-10-26
**Use Case**: Reference for subagent design, configuration, and usage audits
