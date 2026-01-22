# Claude Code Skill Description Best Practices

**Status**: REFERENCE
**Created**: 2026-01-22
**Sources**:
- https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/
- https://www.gankinterview.com/en/blog/claude-skills-getting-started-guide-concepts-structure-and-best-practices-with-s
- https://scottspence.com/posts/how-to-make-claude-code-skills-activate-reliably
**Purpose**: Guide for writing skill descriptions that trigger appropriately

---

## How Skill Triggering Works

Claude uses **pure LLM reasoning** on descriptions - no algorithmic matching, embeddings, or keyword detection. The description field is the "semantic index" that Claude scans to decide whether to load a skill.

> "The system formats all available skills into a text description embedded in the Skill tool's prompt, and lets Claude's language model make the decision. This is pure LLM reasoning."

---

## Description Best Practices

### 1. Use the "Use when..." Pattern

Match user question/request patterns explicitly:

```yaml
# Good - explicit trigger contexts
description: >
  Use when deciding what cards to buy, planning long-term deck composition,
  or optimizing purchases for different game phases.

# Bad - too vague
description: Helps with card decisions.
```

### 2. Include Explicit Trigger Phrases

List keywords and phrases that match how users naturally speak:

```yaml
description: >
  Triggers on requests containing "implement", "add", "create", "fix", or "build".
```

### 3. Include Explicit Exclusions

Prevent false positives by stating when NOT to trigger:

```yaml
description: >
  Do NOT use for research, exploration, testing/QA, or documentation tasks.
```

### 4. Be Specific Over General

Vague descriptions may never trigger:

```yaml
# Good - specific context
description: >
  Use when confused about CLI output format, getting move syntax errors,
  or unsure what move to make in turn-based mode.

# Bad - generic
description: Explains game rules.
```

### 5. Keep Concise (Token Budget)

All skill descriptions share a character budget (~15,000 chars total). Exceeding this may cause late-listed skills to be ignored.

---

## Pattern Examples from This Project

| Skill | Description Pattern |
|-------|---------------------|
| `dominion-strategy` | "Use when deciding what cards to buy, planning long-term..." |
| `dominion-mechanics` | "Use when learning game rules, confused about phase flow, receiving invalid move errors..." |
| `playtest` | "Use when testing card mechanics, finding bugs, or validating MCP tools." |

**Common elements:**
- Action verbs matching user requests ("deciding", "learning", "testing")
- Error/confusion states ("confused about", "receiving errors")
- Explicit contexts ("phase flow", "card mechanics")

---

## Preventing Overlap

Design descriptions to avoid collision between skills:

| Skill | Unique Domain |
|-------|---------------|
| `dominion-mechanics` | Rules, phases, errors |
| `dominion-strategy` | Buying decisions, planning |
| `cli-dominion-mechanics` | CLI-specific output/syntax |

Each skill owns a distinct trigger domain.

---

## Testing Skill Activation

1. **Force-invoke first**: Use `/skill-name` to verify skill works
2. **Then test auto-trigger**: If forced works but auto fails, fix description
3. **Test exclusions**: Verify skill does NOT load for excluded contexts

---

## Advanced: Frontmatter Options

| Option | Use Case |
|--------|----------|
| `disable-model-invocation: true` | Manual-only (side effects like deploy, commit) |
| `user-invocable: false` | Background knowledge only (Claude invokes, user doesn't) |

Default: Both user and Claude can invoke.
