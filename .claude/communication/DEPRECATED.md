# DEPRECATED: Old Communication System

**Status**: DEPRECATED
**Date**: 2025-10-21
**Replaced By**: `.claude/AGENT_COMMUNICATION.md`

## Why Deprecated

The old `.claude/communication/*` system (separate log files) has been replaced with an in-code communication system using minimal-token @ tags.

**Problems with old system:**
- Agents (test-architect, dev-agent) couldn't use Claude Skills
- Separate files added I/O overhead
- Agents didn't consistently use the system
- File bloat (communication log reached 1,400+ lines)

**New system benefits:**
- Communication IN code/tests (zero extra I/O)
- Minimal tokens (75% reduction)
- Agents already read these files
- Git-tracked (survives crashes)
- No separate files to maintain

## Migration

**Old approach:**
Agents wrote to `.claude/communication/2025-10.md` with messages

**New approach:**
- test-architect: Uses `@req:`, `@edge:`, `@clarify:` tags in test comments
- dev-agent: Uses `@blocker:`, `@decision:`, `@resolved:` tags in code comments
- Both: Detailed git commits showing progress

## Historical Logs

The files in this directory are kept for historical reference:
- `2025-10.md` - October communication history
- `ACTIVE_THREADS.md` - Was tracking unresolved issues

**Do not add new content to these files.** Use the new @ tag system instead.

## See Also

- `.claude/AGENT_COMMUNICATION.md` - New communication protocol
- Agent instructions updated: `.claude/agents/dev-agent.md`, `.claude/agents/test-architect.md`
