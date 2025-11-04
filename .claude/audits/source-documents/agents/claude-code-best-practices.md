# Claude Code Best Practices - Full Reference

**Status**: GROUND-TRUTH SOURCE
**Created**: 2025-10-26
**Source**: https://www.anthropic.com/engineering/claude-code-best-practices
**Last Accessed**: 2025-10-26
**Purpose**: Authoritative reference for Claude Code agent configuration audits
**Author**: Boris Cherny (Anthropic) with community contributions

---

## Introduction

Claude Code is an agentic assistant that automatically gathers context from your codebase. This guide presents best practices from Anthropic engineers and the broader Claude Code user community for maximizing effectiveness.

---

## Core Customization: The CLAUDE.md File

### What is CLAUDE.md?

CLAUDE.md is a special file that Claude automatically incorporates into every conversation. It's the primary mechanism for customizing Claude's behavior for your project.

**File locations** (in priority order):
1. Repository root (`.claude/CLAUDE.md` or `CLAUDE.md`) - Shared via git
2. Parent directories - Useful for monorepos
3. Child directories - Pulled on-demand when working in that directory
4. Home folder (`~/.claude/CLAUDE.md`) - Universal personal preferences

### What to Put in CLAUDE.md

Document everything Claude needs to know about your project:

**Essential Content:**
- Bash commands commonly used in the project
- Core utilities and their usage
- Code style guidelines and conventions
- Testing procedures and commands
- Repository conventions (branching, commits, etc.)
- Environment setup instructions
- Build and deployment commands
- Common gotchas and workarounds

**Example CLAUDE.md:**
```markdown
# Project: Dominion Card Game Engine

## Common Commands
- `npm run test` - Run test suite
- `npm run play` - Start CLI game
- `npm run lint` - Check code style

## Architecture
- Immutable state pattern (never mutate GameState)
- Pure functions for game logic
- Seed-based randomness for determinism

## Common Gotchas
- GameEngine requires seed parameter in constructor
- executeMove() returns {success, gameState}, not state directly
- Card names are strings ('Copper'), not objects

## Testing
- Write tests FIRST (TDD workflow)
- Run `npm run test` before every commit
- Target 95%+ coverage

## Style Guidelines
- Use TypeScript strict mode
- Prefer functional patterns
- Document complex logic with comments
```

### Iterative Refinement

CLAUDE.md should evolve like production code:

**Process:**
1. Start with basics (commands, setup)
2. Add patterns as they emerge
3. Document errors as you encounter them
4. Refine based on Claude's behavior
5. Occasionally process through prompt optimization tools

**Emphasis Markers:**
Use emphasis to improve instruction adherence:
- "IMPORTANT: Always run tests before committing"
- "CRITICAL: Never modify test files"
- "⚠️ WARNING: This command is destructive"

---

## Permission Management

Claude Code uses a conservative permission model by default. You must explicitly grant tool access.

### Permission Mechanisms

**1. Interactive Allow**
- Click "Always allow" when prompted
- Best for one-time setup

**2. `/permissions` Command**
- Add: `/permissions add Edit`
- Remove: `/permissions remove Bash(git push:*)`
- List: `/permissions list`

**3. Manual Config Files**
Edit `.claude/settings.json` or `~/.claude.json`:
```json
{
  "allowedTools": [
    "Read",
    "Edit",
    "Bash(git commit:*)",
    "Bash(npm test:*)"
  ]
}
```

**4. CLI Flags**
Session-specific permissions:
```bash
claude --allowedTools "Read,Edit,Bash(git:*)"
```

### Recommended Permission Sets

**Read-only exploration:**
```json
["Read", "Glob", "Grep"]
```

**Development:**
```json
["Read", "Edit", "Write", "Bash(git:*)", "Bash(npm:*)"]
```

**Full automation (use cautiously):**
```json
["*"]
```

---

## Tool Integration

### 1. Bash Environment

Claude inherits your shell environment, so all your custom tools are available.

**Make tools discoverable:**
- Document in CLAUDE.md with usage examples
- Reference `--help` output
- Provide common use cases

**Example documentation:**
```markdown
## Custom Tools

### `deploy.sh`
Deploy to staging environment.

Usage: `./deploy.sh [environment]`
Example: `./deploy.sh staging`

See `./deploy.sh --help` for full options.
```

### 2. MCP (Model Context Protocol)

Claude functions as both MCP server and client, enabling integration with external tools.

**Configuration methods:**
1. **Project config**: `.mcp.json` in project root (checked into git)
2. **Global config**: `~/.mcp.json` for personal tools
3. **Environment variables**: For API keys and secrets

**Debug MCP issues:**
```bash
claude --mcp-debug
```

**Example .mcp.json:**
```json
{
  "servers": {
    "database": {
      "command": "node",
      "args": ["./mcp-servers/database.js"],
      "env": {
        "DB_CONNECTION_STRING": "${DB_URL}"
      }
    }
  }
}
```

### 3. Custom Slash Commands

Store prompt templates in `.claude/commands/` as Markdown files.

**Example: `.claude/commands/review.md`**
```markdown
Review this code for:
- Potential bugs
- Performance issues
- Code style violations
- Test coverage gaps

Provide specific feedback with line numbers.
```

**Usage:**
```
/review src/gameEngine.ts
```

**Dynamic Arguments:**
Use `$ARGUMENTS` placeholder for parameters:
```markdown
Run integration tests for $ARGUMENTS and report results.
```

---

## Recommended Workflows

### Workflow 1: Explore, Plan, Code, Commit

**Problem:** Diving straight into coding produces suboptimal solutions.

**Solution:** Four-phase workflow

**Phase 1: Explore**
```
"Read the files related to card effects and explain the current pattern"
```
Claude gathers context without writing code.

**Phase 2: Plan**
```
"Think through how to add a new Moat card. What files need changes?"
```
Use "think" to trigger extended thinking mode. Claude outlines approach.

**Phase 3: Code**
```
"Implement the Moat card. Run tests after each change to verify."
```
Claude implements with explicit verification steps.

**Phase 4: Commit**
```
"Create a commit with a clear message explaining the changes"
```
Claude writes contextual commit message based on changes.

**Why This Works:**
- Exploration prevents wasted effort
- Planning catches issues early
- Explicit testing reduces bugs
- Good commits help future maintainers

### Workflow 2: Test-Driven Development (TDD)

**Especially effective with agentic systems** because Claude can iterate against clear targets.

**Process:**
1. **Write tests** based on expected behavior
   ```
   "Write tests for the Moat card: it should draw 2 cards and provide reaction defense"
   ```

2. **Verify tests fail** (red phase)
   ```
   "Run the tests and confirm they fail"
   ```

3. **Commit tests**
   ```
   "Commit these failing tests"
   ```

4. **Write implementation** (green phase)
   ```
   "Implement the Moat card to make tests pass"
   ```

5. **Iterate** until tests pass
   Claude runs tests, fixes issues, repeats

6. **Commit implementation**
   ```
   "Commit the working implementation"
   ```

**Why TDD Works with AI:**
- Tests provide unambiguous success criteria
- AI can iterate quickly against test failures
- Prevents drift from requirements
- Forces clear thinking about behavior first

### Workflow 3: Visual Development

**Use when:** Building UI components

**Process:**
1. **Setup screenshot capability**
   - Puppeteer MCP server (automated)
   - Manual screenshots (drag and drop)

2. **Provide design mockup**
   ```
   [Paste mockup image]
   "Build this component"
   ```

3. **Implement with iteration**
   ```
   "Take a screenshot and compare to the mockup"
   ```

4. **Refine** (2-3 iterations typically needed)
   ```
   "The spacing is off. Adjust padding to match mockup."
   ```

5. **Commit when satisfied**

**Key Insight:** 2-3 visual iterations produce significantly better results than single attempts.

### Workflow 4: Safe YOLO Mode

**DANGER:** This mode skips permissions. Use with extreme caution.

**Safe usage:**
```bash
# In isolated Docker container, no internet
docker run -v $(pwd):/workspace -w /workspace claude-container \
  claude --dangerously-skip-permissions
```

**When to use:**
- Isolated container environment
- No sensitive data
- No internet access
- Experimental / prototyping work

**Never use on:**
- ❌ Production systems
- ❌ Systems with sensitive data
- ❌ Internet-connected environments
- ❌ Shared development machines

---

## Operational Optimization Techniques

### 1. Specificity in Instructions

**Vague request:**
```
"Add tests for foo.py"
```
Result: Claude guesses what to test, likely misses important cases.

**Specific request:**
```
"Add tests for foo.py covering:
- Happy path with valid input
- Empty input handling
- Invalid data type errors
- Edge case: input length > 1000 characters
Target 95% branch coverage."
```
Result: Claude tests exactly what you need, first try.

**Rule:** Clear, detailed prompts significantly improve first-attempt success rates.

### 2. Visual Context

Claude excels with images and diagrams.

**Methods to provide visuals:**
- Paste screenshots directly (cmd+V)
- Drag and drop image files
- Provide file paths to images
- macOS shortcut: cmd+ctrl+shift+4 (screenshot to clipboard)

**Use cases:**
- UI mockups
- Architecture diagrams
- Error messages
- Database schemas
- API response formats

### 3. File References

Use tab-completion to reference specific files:
```
"Refactor the executeMove function in [tab]src/gameEngine.ts"
```

**Benefits:**
- Claude knows exact file to modify
- Reduces ambiguity
- Faster context gathering

### 4. URL Provision

Paste specific URLs for documentation:
```
"Implement authentication following https://docs.example.com/auth/oauth"
```

**Permission management:**
Use `/permissions add WebFetch(domain:docs.example.com)` to allowlist domains and avoid repeated prompts.

### 5. Course Correction Tools

**Request plans before coding:**
```
"Plan how you would implement this feature before writing code"
```

**Interrupt without losing context:**
- Press Escape to stop current action
- Context preserved
- Can provide new direction

**Edit previous prompts:**
- Double-tap Escape
- Edit your last message
- Useful when you realize you misspoke

**Undo changes:**
```
"Undo those changes - let's try a different approach"
```

### 6. Context Management

**Use `/clear` frequently** between unrelated tasks.

**Why:** Prevents context window saturation with irrelevant conversation history and file contents.

**When to clear:**
- After completing a feature
- Before starting new, unrelated task
- When conversation feels sluggish
- Every 30-45 minutes of work

**Don't clear when:**
- Working on related changes
- Need context from earlier conversation
- Mid-implementation of complex feature

### 7. Checklists for Complex Tasks

For exhaustive tasks (migrations, refactors), have Claude maintain a checklist:

```
"Create a checklist of all files that need updating for the API migration.
Work through them sequentially, updating the checklist as you go."
```

**Benefits:**
- Nothing gets forgotten
- Progress is visible
- Can resume if interrupted
- Clear completion criteria

---

## Git and GitHub Integration

Claude handles numerous git operations effectively:

### Git Operations

**Searching history:**
```
"Search git history to find when the validation logic changed"
```

**Contextual commits:**
```
"Create a commit explaining these changes in context of recent commits"
```
Claude reads `git log` and writes commit matching the project's style.

**Complex operations:**
```
"Revert changes to src/config.ts but keep changes to src/gameEngine.ts"
"Help me resolve this rebase conflict"
"Compare my branch to main and summarize differences"
```

### GitHub Integration (with `gh` CLI)

**Creating PRs:**
```
"Create a pull request for this feature with a clear description"
```

**Code review:**
```
"Implement the feedback from PR #123"
```

**Build failures:**
```
"The CI build is failing. Fix the linter warnings."
```

**Issue triage:**
```
"Categorize open issues by priority and type"
```

**Setup:**
```bash
# Install GitHub CLI
brew install gh  # macOS
# or: apt install gh  # Linux

# Authenticate
gh auth login
```

---

## Headless Mode and Automation

Claude Code supports non-interactive execution for automation.

### Basic Headless Usage

```bash
# Simple prompt
claude -p "Run tests and report results"

# Structured output
claude -p "Analyze code quality" --output-format stream-json
```

### Pattern 1: Fanning Out

For large operations, generate task list then process each:

```bash
# Generate task list
tasks=$(claude -p "List all files needing migration" --json)

# Process each task
echo "$tasks" | jq -r '.[]' | while read file; do
  claude -p "Migrate $file to new API" --allowedTools "Read,Edit"
done
```

### Pattern 2: Pipelining

Integrate Claude into data pipelines:

```bash
# Analyze logs
cat access.log | claude -p "Summarize error patterns" --json | your_command

# Process results
curl api.example.com/data | claude -p "Extract key metrics" | tee results.json
```

### Debugging Headless

Use `--verbose` flag during development:

```bash
claude -p "Task description" --verbose
```

---

## Multi-Claude Workflows

### Pattern 1: Parallel Verification

**Setup:** One Claude writes code, another reviews it.

**Process:**
1. Claude A implements feature
2. Claude B reviews implementation
3. Claude A addresses feedback

**Benefit:** Potentially better results than single-instance handling.

### Pattern 2: Multiple Checkouts

**Setup:** Create 3-4 git checkouts in separate folders:

```bash
git clone <repo> project-main
git clone <repo> project-feature-a
git clone <repo> project-feature-b
git clone <repo> project-bugfix-c
```

**Benefit:** Run concurrent Claude sessions on different tasks without coordination overhead.

### Pattern 3: Git Worktrees

**Lighter-weight alternative to multiple checkouts:**

```bash
# Create worktrees
git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b

# Work in each worktree independently
cd ../project-feature-a
claude
```

**Benefit:** Isolated working directories that share git history. Enables simultaneous work on independent tasks.

**Cleanup:**
```bash
git worktree remove ../project-feature-a
```

---

## Data Input Methods

Claude accepts data through multiple channels:

**1. Copy and paste** (most common)
```
[Paste JSON data]
"Analyze this data"
```

**2. Pipe into Claude**
```bash
cat data.txt | claude
```

**3. Request Claude pull data**
```
"Read data from data/input.json and analyze it"
"Fetch https://api.example.com/data and summarize"
```

**4. Direct file/URL references**
```
"Analyze the image at screenshots/error.png"
"Summarize https://docs.example.com/api"
```

---

## Additional Capabilities

### Jupyter Notebooks

Researchers can use Claude with Jupyter notebooks:

**Read and write notebooks:**
```
"Read analysis.ipynb and explain the findings"
"Create a new notebook that analyzes dataset.csv"
```

**Interpret outputs:**
Claude can view images, charts, and outputs embedded in notebooks.

**Aesthetic improvements:**
```
"Make this visualization more aesthetically pleasing for presentation"
```

### Codebase Q&A

Use Claude as onboarding tool:

**Questions Claude can answer:**
```
"How does logging work in this project?"
"What design patterns does the game engine use?"
"Where is authentication handled?"
"Explain the data flow for a card purchase"
```

**No special prompting required** - Claude explores the codebase and explains.

---

## Summary: Key Success Factors

1. **CLAUDE.md is your control panel** - Document everything Claude needs to know
2. **Grant appropriate permissions** - Balance automation with safety
3. **Explore before coding** - Context gathering prevents wasted effort
4. **Use TDD workflow** - Tests provide clear success criteria
5. **Be specific in requests** - Detailed prompts → better first-attempt results
6. **Provide visual context** - Images dramatically improve UI work
7. **Manage context actively** - Use `/clear` between unrelated tasks
8. **Leverage git/GitHub** - Claude excels at version control operations
9. **Iterate with screenshots** - 2-3 visual iterations beat single attempts
10. **Use checklists for complex work** - Ensures nothing is forgotten

---

**Acknowledgment:** This guide synthesizes best practices from the broader Claude Code user community, compiled by Boris Cherny with contributions from Anthropic engineers.

**Last Updated**: 2025-10-26 (source date not specified, content appears current)
**Saved as Ground Truth**: 2025-10-26
**Use Case**: Reference for Claude Code agent configuration and workflow audits
