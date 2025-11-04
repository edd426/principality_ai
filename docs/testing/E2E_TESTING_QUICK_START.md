# Quick Start: Real E2E Tests

**Status**: ACTIVE
**Created**: 2025-10-22
**Last-Updated**: 2025-10-24
**Owner**: requirements-architect
**Phase**: 2.1

---

## 30-Second Setup

```bash
# 1. Install dependencies
npm install

# 2. Set API key (get from https://console.anthropic.com)
export CLAUDE_API_KEY="sk-ant-api03-YOUR_KEY"

# 3. Run tests
npm run test:e2e
```

## What Gets Tested

Tests call Claude API to verify it can:

1. **Query game state** - `game_observe` tool with `detail_level` enum
2. **Execute moves** - `game_execute` tool with move string format
3. **Manage lifecycle** - `game_session` tool with new/end commands
4. **Format strings** - Move validation (regex: `play 0`, `buy Province`, `end`)
5. **Choose parameters** - Claude selecting appropriate detail level

## Expected Output

```
E2E1.1: 250 input + 150 output = 400 total = $0.0005, 1200ms
E2E1.1b: Claude chose detail_level="standard", 280 input + 160 output = 440 total = $0.0006
E2E1.2: Move="play 0", 300 input + 120 output = 420 total = $0.0005
E2E1.2b: Move format="buy Duchy" valid, 310 input + 130 output = 440 total
...
PASS: 17+ tests | Total cost: ~$0.012
```

## Files Created

| File | Size | Purpose |
|------|------|---------|
| `packages/mcp-server/tests/e2e/claude-api-helpers.ts` | 268 lines | Helper utilities |
| `packages/mcp-server/tests/e2e/claude-api.test.ts` | 554 lines | Real test suite |
| `packages/mcp-server/package.json` | updated | Add @anthropic-ai/sdk |
| `E2E_TESTING_GUIDE.md` | 400+ lines | Full documentation |
| `IMPLEMENTATION_SUMMARY.md` | 300+ lines | Detailed summary |

## Run Options

```bash
# Run all tests (with API key)
CLAUDE_API_KEY="sk-ant-..." npm run test:e2e

# From mcp-server directory
cd packages/mcp-server && CLAUDE_API_KEY="sk-ant-..." npm run test:e2e

# Run specific test
CLAUDE_API_KEY="sk-ant-..." npm run test:e2e -- -t "E2E1.1"

# Without API key (tests skip)
npm run test:e2e
```

## Test Suites

- **E2E1.1** - Game state queries (3 tests)
- **E2E1.2** - Move execution (3 tests)
- **E2E1.3** - Game lifecycle (2 tests)
- **E2E1.4** - Multi-tool chains (1 test)
- **E2E1.5** - Schema validation (2 tests)
- **E2E1.6** - Token efficiency (2 tests)
- **E2E1.7** - Error handling (1 test)
- **E2E1.8** - Cost tracking (2 tests)
- **E2E1.9** - API key verification (1 test)

**Total: 17+ tests, ~822 lines of code**

## Cost

- **Model**: Claude Haiku (cheapest)
- **Per test**: ~$0.0005
- **Full suite**: ~$0.01-0.02
- **Budget**: < $0.05

## Key Features

- ✓ REAL Claude API calls (not mocks)
- ✓ Anthropic SDK integration
- ✓ Token tracking and cost logging
- ✓ Graceful skip if no API key
- ✓ Comprehensive tool validation
- ✓ Move format verification
- ✓ Error handling with retry

## Troubleshooting

**Tests skip without message**
```bash
echo $CLAUDE_API_KEY  # Check it's set
```

**API key not recognized**
```bash
# Must start with sk-ant-
export CLAUDE_API_KEY="sk-ant-api03-..."
```

**Module not found**
```bash
npm install
```

For detailed help, see `E2E_TESTING_GUIDE.md`

## Documentation

- `E2E_TESTING_GUIDE.md` - Complete guide with setup, troubleshooting, CI/CD
- `IMPLEMENTATION_SUMMARY.md` - Detailed implementation notes
- Test files have comprehensive JSDoc and inline comments

---

Ready to test! Run: `CLAUDE_API_KEY="sk-ant-..." npm run test:e2e`
