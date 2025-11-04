# E2E Testing with Claude API Integration

**Status**: ACTIVE
**Created**: 2025-10-22
**Last-Updated**: 2025-10-24
**Owner**: requirements-architect
**Phase**: 2.1

---

## Overview

Real E2E tests for the Principality AI MCP Server that validate Claude API integration with MCP tools. These tests call the actual Claude API and verify that Claude can:

1. Query game state via `game_observe` tool
2. Execute moves via `game_execute` tool
3. Manage game lifecycle via `game_session` tool
4. Track token usage and estimate costs

## Files Created

### 1. `/packages/mcp-server/tests/e2e/claude-api-helpers.ts`

Helper utilities for E2E testing with Claude API:

- `callClaudeWithTools()` - Call Claude API with tool definitions
- `callClaudeWithRetry()` - Call Claude with exponential backoff retry logic
- `extractToolUse()` / `extractAllToolUses()` - Parse Claude response for tool calls
- `getTokenUsage()` - Extract token counts from response
- `estimateCost()` - Calculate cost based on token usage (Haiku/Sonnet rates)
- `formatCost()` / `formatTokenUsage()` - Format output for logging
- `measureTime()` - Track execution time of operations

### 2. `/packages/mcp-server/tests/e2e/claude-api.test.ts`

Real E2E test suite (replaces placeholders with real implementations):

**Test Groups:**
- **E2E1.1: Claude Queries Game State** - Verify Claude uses game_observe correctly
- **E2E1.2: Claude Executes Moves** - Verify Claude generates valid move strings
- **E2E1.3: Claude Manages Game Lifecycle** - Verify Claude handles game_session
- **E2E1.4: Complete Single Turn Sequence** - Verify Claude chains multiple tools
- **E2E1.5: Tool Schema Validation** - Verify tool schemas are discoverable
- **E2E1.6: Token Efficiency** - Verify token usage meets SLAs
- **E2E1.7: Error Handling** - Verify retry logic on API errors
- **E2E1.8: Cost Tracking** - Verify cost estimation is accurate
- **E2E1.9: API Key Verification** - Verify credentials present

### 3. Updated `packages/mcp-server/package.json`

Added `@anthropic-ai/sdk` as devDependency:

```json
"devDependencies": {
  "@anthropic-ai/sdk": "^0.30.0",
  ...
}
```

## Setup

### 1. Install Dependencies

```bash
# From root directory
npm install

# If workspace protocol fails, try:
npm install --workspaces --legacy-peer-deps
```

This will install the Anthropic SDK in the mcp-server package.

### 2. Set Up Claude API Key

```bash
# Export environment variable with your API key
export CLAUDE_API_KEY="sk-ant-api03-YOUR_KEY_HERE"

# Or set it inline when running tests
CLAUDE_API_KEY="sk-ant-..." npm run test:e2e
```

The API key must start with `sk-ant-` to be recognized.

## Running Tests

### Run All E2E Tests

```bash
# From root directory
CLAUDE_API_KEY="sk-ant-..." npm run test:e2e
```

### Run Only E2E Tests for MCP Server

```bash
cd packages/mcp-server
CLAUDE_API_KEY="sk-ant-..." npm run test:e2e
```

### Run Specific Test Suite

```bash
# Test Claude querying game state
CLAUDE_API_KEY="sk-ant-..." npm run test:e2e -- -t "E2E1.1"

# Test Claude executing moves
CLAUDE_API_KEY="sk-ant-..." npm run test:e2e -- -t "E2E1.2"

# Test token efficiency
CLAUDE_API_KEY="sk-ant-..." npm run test:e2e -- -t "E2E1.6"
```

### Run Without API Key (Tests Skip)

```bash
npm run test:e2e
# All tests will skip with message: "no CLAUDE_API_KEY set"
```

## Test Behavior

### With CLAUDE_API_KEY Set

Tests will:
1. Call the actual Claude API with Haiku model
2. Provide MCP tool definitions (game_observe, game_execute, game_session)
3. Verify Claude calls the correct tools
4. Validate tool inputs match schema
5. Track tokens and estimate costs
6. Measure response latency
7. Log results to console

**Expected Output:**
```
E2E1.1: 250 input + 150 output = 400 total = $0.0005, 1200ms
E2E1.1b: Claude chose detail_level="standard", 280 input + 160 output = 440 total = $0.0006
E2E1.2: Move="play 0", 300 input + 120 output = 420 total = $0.0005
```

### Without CLAUDE_API_KEY

Tests will skip automatically:
```
E2E: Real Claude API Integration (skipped - 20 tests)
   E2E1.1: Claude Queries Game State (skipped)
   E2E1.2: Claude Executes Moves (skipped)
   ...
```

## Cost Estimation

The tests use Haiku model (cheapest) to minimize costs:

- **Haiku**: $0.80 per 1M input tokens, $4.00 per 1M output tokens
- **Sonnet**: $3.00 per 1M input tokens, $15.00 per 1M output tokens

Typical test run estimates (Haiku):
- Single game_observe query: ~$0.0005
- Single game_execute call: ~$0.0005
- Full turn sequence (3 calls): ~$0.0015
- **Entire suite (~15 calls)**: ~$0.01-0.02

## Test Requirements

### Tool Definitions

Tests define three MCP tool schemas that Claude must understand:

1. **game_session**: Manage game lifecycle
   - Input: `command` (enum: "new", "end"), optional `seed`, optional `model`
   - Expected: Claude chooses appropriate command

2. **game_observe**: Query game state and valid moves
   - Input: `detail_level` (enum: "minimal", "standard", "full")
   - Expected: Claude chooses detail_level based on need

3. **game_execute**: Execute a move
   - Input: `move` (string like "play 0", "buy Province", "end"), optional `return_detail`
   - Expected: Claude formats move string correctly

### Validation

Each test validates:

1. **Tool Invocation**: Claude must call at least one tool
2. **Input Format**: Tool input must match schema (valid enums, required fields)
3. **Response Parsing**: Claude response must be parseable
4. **Token Tracking**: Usage counts must be non-zero
5. **Performance**: Response must come within 5 seconds

## Extending Tests

### Add New Test Case

```typescript
test('should test new scenario', async () => {
  const userMessage = `Your custom instruction to Claude`;

  const { duration_ms, result: response } = await measureTime('Test label', () =>
    callClaudeWithTools(userMessage, [GAME_OBSERVE_SCHEMA])
  );

  // Validate response
  const toolUse = extractToolUse(response);
  expect(toolUse).not.toBeNull();
  expect(toolUse.name).toBe('game_observe');

  // Track costs
  const tokens = getTokenUsage(response);
  const cost = estimateCost(tokens.input, tokens.output, 'haiku');
  console.log(`Result: ${formatTokenUsage(tokens)} = ${formatCost(cost)}`);
});
```

### Add Multiple Tool Definitions

```typescript
const { result: response } = await measureTime('Multi-tool sequence', () =>
  callClaudeWithTools(userMessage, [
    GAME_SESSION_SCHEMA,
    GAME_OBSERVE_SCHEMA,
    GAME_EXECUTE_SCHEMA
  ])
);

const allTools = extractAllToolUses(response);
expect(allTools.length).toBeGreaterThan(0);
```

## Troubleshooting

### Tests Skip Without Message

**Problem**: Tests don't run without explicit skip message
**Solution**: Check CLAUDE_API_KEY environment variable is exported:
```bash
echo $CLAUDE_API_KEY  # Should show sk-ant-...
```

### API Key Not Recognized

**Problem**: "CLAUDE_API_KEY is not set" error
**Solution**: Ensure key starts with `sk-ant-`:
```bash
export CLAUDE_API_KEY="sk-ant-api03-..."  # Correct
export CLAUDE_API_KEY="sk-..."              # Wrong - will fail validation
```

### Network Timeout Errors

**Problem**: "timeout awaiting response"
**Solution**: Claude API may be slow. Tests have 5s timeout which should be sufficient. If persistent:
1. Check your internet connection
2. Verify API key is valid
3. Check Claude API status: https://status.anthropic.com

### Module Not Found: @anthropic-ai/sdk

**Problem**: "Cannot find module '@anthropic-ai/sdk'"
**Solution**: Install dependencies:
```bash
npm install
# or
cd packages/mcp-server && npm install
```

### Workspace Protocol Error

**Problem**: "Unsupported URL Type 'workspace:*'"
**Solution**: This is an npm version compatibility issue. Try:
```bash
npm install --workspaces --legacy-peer-deps
# or downgrade npm to v9.x
npm install -g npm@9
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run test:e2e
        env:
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

## Performance Targets

Tests validate these SLAs:

- **API Response Time**: < 5 seconds
- **Token Efficiency**:
  - minimal detail: < 100 tokens
  - standard detail: < 300 tokens
  - full detail: < 1200 tokens
- **Cost Efficiency**: Entire suite < $0.05
- **Move Format Accuracy**: 100% of generated moves must match regex pattern

## Related Documentation

- [Phase 2 Requirements](./docs/requirements/phase-2/)
- [MCP Server Implementation](./packages/mcp-server/README.md)
- [API Reference](./docs/reference/API.md)
- [Claude API Documentation](https://docs.anthropic.com/)

## Key Design Decisions

1. **Haiku Model**: Chosen for cost efficiency in testing (cheapest tier)
2. **Mock Responses**: Tests use actual Claude API but don't require running MCP server
3. **Retry Logic**: Exponential backoff for transient API errors
4. **Cost Tracking**: Every test logs token usage and estimated cost
5. **Skip When No Key**: Tests gracefully skip if CLAUDE_API_KEY not set

## Success Criteria

Tests are passing when:

1. All 20+ test cases execute successfully
2. Claude correctly calls all three tools (game_session, game_observe, game_execute)
3. Tool inputs match defined schemas
4. Token usage is tracked and logged
5. Response times are under 5 seconds
6. Total test run cost is under $0.05
7. Move format validation passes (regex match)
