# MCP Best Practices

**Status**: ACTIVE
**Created**: 2025-11-07
**Phase**: 2+
**Source**: [Code Execution with MCP: Building More Efficient AI Agents](https://www.anthropic.com/engineering/code-execution-with-mcp)

---

This document summarizes Anthropic's engineering guidance for building efficient MCP (Model Context Protocol) servers.

## Overview

MCP provides foundational protocol infrastructure for AI agent tool integration. However, scaling to hundreds or thousands of tools requires architectural patterns beyond simple tool exposure. This guide covers token-efficient design patterns and implementation considerations.

## The Token Efficiency Problem

As MCP adoption scales, two main challenges emerge:

### 1. Tool Definition Overhead

Loading all tool definitions upfront consumes substantial context. Agents connected to thousands of tools must process **hundreds of thousands of tokens before reading a request**.

**Example Impact**:
- 1000 tools × 150 tokens/tool = 150,000 tokens
- Cost and latency impact before any actual work begins

### 2. Intermediate Result Duplication

When tools return large data, results flow through the model multiple times.

**Example**: A 2-hour meeting transcript could require processing an additional **50,000 tokens** if passed between multiple tool calls.

## Solution: Code-Based Tool Interaction

Instead of exposing tools via direct function calls, organize MCP tools as a **filesystem structure** where agents discover and invoke them through code.

### Filesystem-Based Tool Organization

```
servers/
├── google-drive/
│   ├── getDocument.ts
│   └── index.ts
├── salesforce/
│   ├── updateRecord.ts
│   └── index.ts
```

Agents navigate this structure, reading only necessary tool definitions.

**Token Savings**: From 150,000 tokens to 2,000 tokens—a **98.7% reduction**.

## Key Benefits

### 1. Progressive Disclosure

Models excel at filesystem navigation, enabling **on-demand tool discovery** rather than upfront loading.

**Pattern**: Agent explores directory structure, loads only relevant tools.

### 2. Context-Efficient Filtering

Data processing occurs in the execution environment.

**Example**: A 10,000-row spreadsheet can be filtered locally, returning only relevant results to the model (e.g., 10 rows instead of 10,000).

### 3. Control Flow Efficiency

Loops, conditionals, and error handling use **native code patterns** rather than chaining individual tool calls.

**Benefit**: Improved latency and reduced token consumption.

### 4. Privacy Protection

Intermediate results remain in the execution environment by default.

**Feature**: System can tokenize sensitive PII automatically, preventing it from reaching the model while allowing data to flow between external systems.

### 5. State Persistence

Agents can maintain progress across executions via filesystem access.

**Use Cases**:
- Resumable workflows
- Reusable skill libraries
- Session state management

## Implementation Considerations

### Security Requirements

Code execution introduces operational complexity requiring:

1. **Secure execution environment** with appropriate sandboxing
2. **Resource limits** (CPU, memory, time)
3. **Monitoring** for abuse and errors

### Trade-off Analysis

Organizations must weigh:
- **Benefits**: Token efficiency, privacy, control flow
- **Costs**: Implementation complexity, security overhead

### When to Use Direct Tool Calls vs. Code-Based Approach

**Direct Tool Calls** (traditional MCP):
- **Best for**: Small, focused tool sets (< 50 tools)
- **Example**: Game state management, simple CRUD operations
- **Pros**: Simple implementation, low operational overhead
- **Cons**: Token consumption scales linearly with tool count

**Code-Based Approach**:
- **Best for**: Large tool libraries (> 100 tools), data-heavy workflows
- **Example**: Enterprise integrations, multi-system orchestration
- **Pros**: 98%+ token reduction, progressive disclosure
- **Cons**: Requires secure code execution environment

## Application to Principality AI

### Current State (Phase 2-3)

Principality AI's MCP server uses **direct tool calls**:
- `game_session` (new, end)
- `game_observe` (minimal, standard, full)
- `game_execute` (move execution)

**Analysis**: ✅ Appropriate choice
- Small, focused tool set (3 tools)
- Game state is compact (< 5KB typical)
- No benefit from filesystem-based approach at this scale

### Future Considerations (Phase 5+)

If expanding to broader game/AI features:
- Multiple game types (Dominion expansions, other deck-builders)
- Analytics and reporting tools
- Tournament management
- Player progression systems

**Recommendation**: Consider code-based approach if tool count exceeds 50-100.

## Best Practices Summary

1. **Start Simple**: Use direct tool calls for small tool sets
2. **Monitor Token Usage**: Track context consumption as you scale
3. **Progressive Disclosure**: Load tools on-demand when scaling
4. **Process Data Locally**: Filter/transform in execution environment
5. **Protect Privacy**: Keep intermediate results out of model context
6. **Implement Security**: Sandbox, resource limits, monitoring

## References

- [Anthropic MCP Engineering Article](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- Project MCP Implementation: `packages/mcp-server/`

---

**Next Steps**:
1. Monitor token usage in Phase 2-3 MCP gameplay
2. Document token metrics in performance testing
3. Revisit architecture if tool count approaches 50+
