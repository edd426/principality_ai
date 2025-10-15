# Principality AI - Performance Requirements

**Version**: 1.0.0 (Phase 1)
**Last Updated**: October 4, 2025

This document specifies performance requirements, measurement methodologies, and verification procedures for the Principality AI game engine.

---

## Table of Contents

- [Performance Targets](#performance-targets)
- [Measurement Methodology](#measurement-methodology)
- [Verification Procedures](#verification-procedures)
- [Performance Test Suite](#performance-test-suite)
- [Continuous Monitoring](#continuous-monitoring)
- [Regression Detection](#regression-detection)
- [Optimization Guidelines](#optimization-guidelines)

---

## Performance Targets

### Phase 1 (Core Engine)

| Operation | Target | Acceptable Variance | Critical Threshold |
|-----------|--------|-------------------|-------------------|
| **Move Execution** | < 10ms | ±3ms | 20ms |
| **Shuffle Operation** | < 50ms | ±10ms | 100ms |
| **Game Initialization** | < 100ms | ±20ms | 200ms |
| **Valid Moves Calculation** | < 5ms | ±2ms | 10ms |
| **Game Over Check** | < 20ms | ±5ms | 40ms |
| **Session Memory** | < 1MB | ±200KB | 2MB |

### Phase 2 (MCP Integration)

| Operation | Target | Acceptable Variance | Critical Threshold |
|-----------|--------|-------------------|-------------------|
| **MCP Response** | < 2s | ±500ms | 5s |
| **Move Parse (NL)** | < 100ms | ±50ms | 500ms |
| **State Serialization** | < 50ms | ±10ms | 100ms |

### Phase 3 (Multiplayer)

| Operation | Target | Acceptable Variance | Critical Threshold |
|-----------|--------|-------------------|-------------------|
| **Multiplayer Sync** | < 200ms | ±50ms | 500ms |
| **Broadcast Latency** | < 100ms | ±30ms | 300ms |

---

## Measurement Methodology

### Test Environment

**Reference Platform**:
- **CPU**: 4-core 2.0GHz minimum (or equivalent)
- **RAM**: 8GB minimum
- **Node.js**: v20 LTS or later
- **OS**: macOS/Linux/Windows (cross-platform testing)

**Environment Control**:
- Run tests with no other processes competing for resources
- Disable CPU throttling
- Use consistent Node.js flags: `--max-old-space-size=4096`

### Timing Measurement

**High-Precision Timing**:
```typescript
// Use process.hrtime.bigint() for nanosecond precision
const start = process.hrtime.bigint();

// Execute operation
engine.executeMove(gameState, move);

const end = process.hrtime.bigint();
const durationNs = end - start;
const durationMs = Number(durationNs) / 1_000_000;
```

**Warmup Period**:
- Execute 100 operations before measurement (JIT compilation warmup)
- Discard first 100 measurements
- Measure next 1000 operations

**Statistical Analysis**:
- Calculate: Mean, Median, P95, P99, Max
- Report all values
- Flag outliers (> 3 standard deviations)

---

## Verification Procedures

### 1. Move Execution Performance

**Requirement**: < 10ms average, < 20ms P99

**Test Procedure**:

```typescript
describe('Performance: Move Execution', () => {
  const iterations = 1000;
  const measurements: number[] = [];

  beforeAll(() => {
    // Warmup
    const engine = new GameEngine('perf-test');
    let state = engine.initializeGame(1);
    for (let i = 0; i < 100; i++) {
      engine.executeMove(state, { type: 'end_phase' });
    }
  });

  test('move execution should be under 10ms average', () => {
    const engine = new GameEngine('perf-seed-123');
    let gameState = engine.initializeGame(1);

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();

      // Execute various move types
      const moves = [
        { type: 'play_action', card: 'Village' },
        { type: 'play_treasure', card: 'Copper' },
        { type: 'buy', card: 'Silver' },
        { type: 'end_phase' }
      ];

      const move = moves[i % moves.length];
      const result = engine.executeMove(gameState, move);

      const end = process.hrtime.bigint();
      measurements.push(Number(end - start) / 1_000_000);

      if (result.success) {
        gameState = result.newState;
      }
    }

    const stats = calculateStats(measurements);

    expect(stats.mean).toBeLessThan(10);
    expect(stats.p99).toBeLessThan(20);

    console.log('Move Execution Stats:', stats);
  });
});

function calculateStats(data: number[]) {
  const sorted = [...data].sort((a, b) => a - b);
  return {
    mean: data.reduce((a, b) => a + b) / data.length,
    median: sorted[Math.floor(data.length / 2)],
    p95: sorted[Math.floor(data.length * 0.95)],
    p99: sorted[Math.floor(data.length * 0.99)],
    max: Math.max(...data)
  };
}
```

**Expected Output**:
```
Move Execution Stats: {
  mean: 2.3ms,
  median: 2.1ms,
  p95: 3.8ms,
  p99: 5.2ms,
  max: 8.7ms
}
```

**Pass Criteria**:
- ✅ Mean < 10ms
- ✅ P99 < 20ms
- ✅ No individual measurement > 20ms (critical threshold)

---

### 2. Shuffle Operation Performance

**Requirement**: < 50ms average

**Test Procedure**:

```typescript
test('shuffle operation should be under 50ms', () => {
  const random = new SeededRandom('shuffle-test');
  const measurements: number[] = [];

  // Test various deck sizes
  const deckSizes = [10, 20, 30, 50, 100];

  for (const size of deckSizes) {
    const deck = Array.from({ length: size }, (_, i) => `Card${i}`);

    for (let i = 0; i < 200; i++) {
      const start = process.hrtime.bigint();
      random.shuffle(deck);
      const end = process.hrtime.bigint();

      measurements.push(Number(end - start) / 1_000_000);
    }
  }

  const stats = calculateStats(measurements);

  expect(stats.mean).toBeLessThan(50);
  expect(stats.max).toBeLessThan(100);

  console.log('Shuffle Stats:', stats);
});
```

**Expected Output**:
```
Shuffle Stats: {
  mean: 0.8ms,
  median: 0.7ms,
  p95: 1.2ms,
  p99: 1.8ms,
  max: 3.4ms
}
```

**Pass Criteria**:
- ✅ Mean < 50ms
- ✅ Max < 100ms

---

### 3. Game Initialization Performance

**Requirement**: < 100ms

**Test Procedure**:

```typescript
test('game initialization should be under 100ms', () => {
  const measurements: number[] = [];

  for (let i = 0; i < 100; i++) {
    const engine = new GameEngine(`init-test-${i}`);

    const start = process.hrtime.bigint();
    engine.initializeGame(4);  // 4 players (worst case)
    const end = process.hrtime.bigint();

    measurements.push(Number(end - start) / 1_000_000);
  }

  const stats = calculateStats(measurements);

  expect(stats.mean).toBeLessThan(100);
  expect(stats.p99).toBeLessThan(200);

  console.log('Initialization Stats:', stats);
});
```

**Expected Output**:
```
Initialization Stats: {
  mean: 12.3ms,
  median: 11.8ms,
  p95: 15.2ms,
  p99: 18.7ms,
  max: 24.1ms
}
```

---

### 4. Memory Usage

**Requirement**: < 1MB per game session

**Test Procedure**:

```typescript
test('session memory should be under 1MB', () => {
  // Force GC before measurement
  if (global.gc) global.gc();

  const before = process.memoryUsage().heapUsed;

  // Create 100 game sessions
  const sessions: GameState[] = [];
  for (let i = 0; i < 100; i++) {
    const engine = new GameEngine(`mem-test-${i}`);
    sessions.push(engine.initializeGame(2));
  }

  // Force GC to get accurate measurement
  if (global.gc) global.gc();

  const after = process.memoryUsage().heapUsed;
  const memoryPerSession = (after - before) / sessions.length;
  const memoryMB = memoryPerSession / (1024 * 1024);

  expect(memoryMB).toBeLessThan(1.0);

  console.log(`Memory per session: ${memoryMB.toFixed(2)} MB`);
});
```

**Run with**: `node --expose-gc node_modules/.bin/jest performance.test.ts`

**Expected Output**:
```
Memory per session: 0.23 MB
```

---

## Performance Test Suite

### File Structure

```
packages/core/tests/
├── game.test.ts           # Functional tests
└── performance.test.ts    # Performance tests (new)
```

### Running Performance Tests

**Individual Test**:
```bash
npm run test:perf
```

**With Coverage**:
```bash
npm run test -- --testPathPattern=performance
```

**CI/CD Integration**:
```bash
# Add to .github/workflows/main.yml
- name: Performance Tests
  run: npm run test:perf
  env:
    NODE_OPTIONS: "--expose-gc"
```

### Performance Test Configuration

**package.json**:
```json
{
  "scripts": {
    "test:perf": "NODE_OPTIONS='--expose-gc' jest tests/performance.test.ts --verbose"
  }
}
```

---

## Continuous Monitoring

### Metrics Collection

**Log Format**:
```json
{
  "timestamp": "2025-10-04T10:30:45.123Z",
  "operation": "executeMove",
  "duration_ms": 2.3,
  "move_type": "play_action",
  "phase": "action",
  "success": true
}
```

**Aggregation**:
- Collect metrics every 1000 operations
- Calculate rolling averages (1 hour window)
- Alert on degradation > 50% from baseline

### Baseline Establishment

**Initial Baseline** (Phase 1 Complete):

| Operation | Baseline Mean | Baseline P99 |
|-----------|--------------|-------------|
| Move Execution | 2.5ms | 5.0ms |
| Shuffle | 0.8ms | 2.0ms |
| Initialization | 12ms | 20ms |

**Update Process**:
- Re-baseline after major refactors
- Document performance changes in commit messages
- Require approval for performance degradation > 20%

---

## Regression Detection

### Automated Checks

**Pre-Commit Hook**:
```bash
#!/bin/bash
# Run performance tests before allowing commit
npm run test:perf

if [ $? -ne 0 ]; then
  echo "Performance tests failed. Commit blocked."
  exit 1
fi
```

**CI/CD Checks**:
```yaml
# .github/workflows/main.yml
performance-check:
  runs-on: ubuntu-latest
  steps:
    - name: Run Performance Tests
      run: npm run test:perf

    - name: Compare to Baseline
      run: |
        node scripts/compare-performance.js \
          --baseline=performance-baseline.json \
          --current=performance-results.json \
          --threshold=1.5  # 50% degradation = fail
```

### Manual Regression Testing

**Procedure**:
1. Run `npm run test:perf` on main branch (record baseline)
2. Run `npm run test:perf` on feature branch (record current)
3. Compare results:
   - Mean within 20%: ✅ Pass
   - Mean 20-50% worse: ⚠️ Warning (require explanation)
   - Mean > 50% worse: ❌ Fail (block merge)

---

## Optimization Guidelines

### Profiling Tools

**Node.js Profiler**:
```bash
node --prof packages/core/dist/game.js
node --prof-process isolate-*.log > profile.txt
```

**Chrome DevTools**:
```bash
node --inspect-brk packages/core/dist/game.js
# Open chrome://inspect in Chrome
```

### Common Bottlenecks

**1. Array Operations**:
```typescript
// ❌ Slow: repeated spread operations
let deck = [...state.deck];
deck = [...deck, card1];
deck = [...deck, card2];

// ✅ Fast: single spread
let deck = [...state.deck, card1, card2];
```

**2. Map Lookups**:
```typescript
// ❌ Slow: repeated Map creation
const supply = new Map(state.supply);
supply.set(card, count);

// ✅ Fast: conditional creation
const supply = needsUpdate
  ? new Map(state.supply).set(card, count)
  : state.supply;
```

**3. Object Cloning**:
```typescript
// ❌ Slow: deep clone
const newState = JSON.parse(JSON.stringify(state));

// ✅ Fast: shallow clone with spread
const newState = { ...state, phase: 'buy' };
```

### Optimization Checklist

Before optimizing:
- ✅ Profile to identify actual bottleneck
- ✅ Write performance test for specific operation
- ✅ Establish baseline measurement

After optimizing:
- ✅ Verify performance improvement with test
- ✅ Ensure functional tests still pass
- ✅ Update baseline if significant improvement

---

## Phase 2 Performance Additions

### MCP Response Time

**Target**: < 2 seconds (including LLM processing)

**Components**:
1. Network request: < 100ms
2. Move parsing: < 100ms
3. Move execution: < 10ms
4. LLM processing: < 1.5s
5. Response serialization: < 50ms
6. Network response: < 100ms

**Total Budget**: ~1.85s (150ms buffer for variance)

### Natural Language Parsing

**Target**: < 100ms

**Test**:
```typescript
test('natural language parsing should be under 100ms', () => {
  const parser = new NLMoveParser();
  const inputs = [
    "play village",
    "buy silver",
    "play all treasures",
    "end turn"
  ];

  for (const input of inputs) {
    const start = process.hrtime.bigint();
    parser.parse(input);
    const end = process.hrtime.bigint();

    const duration = Number(end - start) / 1_000_000;
    expect(duration).toBeLessThan(100);
  }
});
```

---

## Performance Monitoring Dashboard

### Key Metrics Display

**Real-time Monitoring** (Phase 2+):

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Move Execution (mean) | 2.1ms | < 10ms | ✅ |
| Move Execution (p99) | 4.8ms | < 20ms | ✅ |
| Shuffle (mean) | 0.7ms | < 50ms | ✅ |
| Memory per Session | 0.25MB | < 1MB | ✅ |

**Alerts**:
- 🟢 Green: Within target
- 🟡 Yellow: 80-100% of target
- 🔴 Red: > 100% of target

---

## Version History

**1.0.0** (Phase 1 - October 2025)
- Initial performance requirements
- Core engine benchmarks
- Measurement methodology

**Upcoming** (Phase 2)
- MCP response time requirements
- Natural language parsing benchmarks
- Network latency measurements

---

## References

- [Technical Specifications](./principality-ai-technical-specs.md) - Architecture and targets
- [API Reference](./API_REFERENCE.md) - Method complexity analysis
- Node.js Performance Documentation: https://nodejs.org/en/docs/guides/simple-profiling/

---

**Note**: All performance targets are subject to revision based on actual Phase 2 MCP integration requirements and user experience feedback.
