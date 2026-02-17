---
name: tdd-workflow
description: >
  Enforces test-driven development workflow for code implementation.
  Use when implementing features, fixing bugs, adding new functionality,
  or writing production code in src/ directories. Triggers on requests
  containing "implement", "add", "create", "fix", or "build".
  Do NOT use for research, exploration, testing/QA, or documentation.
---

# TDD Workflow

This project requires **Test-Driven Development**. Tests are written FIRST, implementation follows.

## Task Classification

Before proceeding, classify your task:

| Task Type | Examples | TDD Required? |
|-----------|----------|---------------|
| **Implementation** | "implement feature X", "add support for Y", "fix bug Z" | YES |
| **Research** | "explore codebase", "how does X work?", "find where Y is defined" | NO |
| **QA/Testing** | "run tests", "test the feature", "validate it works" | NO |
| **Documentation** | "update README", "add comments" | NO |

**If Implementation → Continue with TDD workflow below**
**If Research/QA/Docs → Skip this skill, proceed normally**

---

## TDD Workflow

```
1. Requirements defined
   ↓
2. Tests written (test-architect)
   ↓
3. All tests FAIL (red phase)
   ↓
4. Implementation written (dev-agent)
   ↓
5. All tests PASS (green phase)
```

---

## Before Writing ANY Code

### Mandatory Checklist

1. **Check for existing tests**
   ```bash
   npm run test
   ```

2. **If tests exist for this feature** → Read them to understand requirements, then implement

3. **If NO tests exist** → STOP and invoke test-architect:
   ```
   Use the Task tool to spawn test-architect:

   Task(
     subagent_type: "test-architect",
     prompt: "Write tests for [feature description]. Define requirements via @req tags."
   )
   ```

4. **Wait for tests** → Only proceed after test-architect completes

5. **Then invoke dev-agent** for implementation:
   ```
   Task(
     subagent_type: "dev-agent",
     prompt: "Implement code to pass the tests for [feature]. Read test files first."
   )
   ```

---

## Refusing Code-First Requests

If asked to implement without tests, respond:

> "This project requires TDD. Before I can implement this feature, I need to:
>
> 1. **Check for existing tests** - Let me run `npm test` first
> 2. **If no tests exist** - I'll invoke test-architect to define requirements as tests
> 3. **Then implement** - Once tests exist, I'll use dev-agent to write the code
>
> This ensures we have clear requirements and regression protection. Proceeding with test-architect now."

Then invoke test-architect.

---

## Subagent Responsibilities

### test-architect (owns specification)
- Gather and clarify requirements
- Write tests with `@req` tags
- Define edge cases with `@edge` tags
- **Never modifies implementation code**

### dev-agent (owns implementation)
- Read tests to understand requirements
- Write production code to pass tests
- Run tests frequently during implementation
- **Never modifies test files**

---

## Quick Reference

### Spawning test-architect
```
Task(subagent_type: "test-architect", prompt: "Write tests for [X]. Requirements: [Y]. Edge cases: [Z].")
```

### Spawning dev-agent
```
Task(subagent_type: "dev-agent", prompt: "Implement [X] to pass the tests in [path]. Read tests first.")
```

### Running tests
```bash
npm run test                    # All tests
npm run test -- --watch         # Watch mode
npm run test -- path/to/test    # Specific test
```

---

## Links

- [TDD Workflow Details](docs/TDD_WORKFLOW.md)
- [test-architect Agent](.claude/agents/test-architect.md)
- [dev-agent Agent](.claude/agents/dev-agent.md)
- [Agent Communication Tags](.claude/AGENT_COMMUNICATION.md)
