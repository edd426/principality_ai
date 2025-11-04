# Testing Documentation Index

**Status**: ACTIVE
**Created**: 2025-10-24
**Last-Updated**: 2025-10-24
**Owner**: requirements-architect
**Phase**: 2.1

---

## Overview

This directory contains comprehensive testing documentation and guides for the Principality AI project.

---

## Documentation Files

### 1. E2E Testing with Claude API

**File**: [`E2E_TESTING_GUIDE.md`](./E2E_TESTING_GUIDE.md)

Complete guide for end-to-end testing that validates Claude API integration with MCP tools.

**Topics covered:**
- Real Claude API E2E tests
- Test groups and validation criteria
- Files created and their purposes
- Setup and execution instructions

**When to use**: When implementing or understanding how Claude interacts with game tools

---

### 2. E2E Quick Start

**File**: [`E2E_TESTING_QUICK_START.md`](./E2E_TESTING_QUICK_START.md)

30-second quick start guide for running E2E tests with the Claude API.

**Topics covered:**
- Installation and API key setup
- Quick test execution commands
- Expected output format
- Run options and test suites
- Cost tracking and budget
- Troubleshooting

**When to use**: When you need to quickly run E2E tests or verify API integration

---

### 3. Test Patterns and Performance

**File**: [`TEST_PATTERNS_AND_PERFORMANCE.md`](./TEST_PATTERNS_AND_PERFORMANCE.md)

Reference documentation for test patterns, best practices, and performance benchmarks.

**Topics covered:**
- Unit test patterns
- Integration test patterns
- Performance requirements and benchmarks
- Test structure best practices

**When to use**: When writing new tests or reviewing test code

---

## Quick Links by Use Case

### I want to...

- **Run E2E tests** → See [E2E Quick Start](./E2E_TESTING_QUICK_START.md)
- **Understand how E2E tests work** → See [E2E Testing Guide](./E2E_TESTING_GUIDE.md)
- **Write new tests** → See [Test Patterns](./TEST_PATTERNS_AND_PERFORMANCE.md)
- **Check performance requirements** → See [Test Patterns: Performance](./TEST_PATTERNS_AND_PERFORMANCE.md#performance)
- **Troubleshoot test failures** → See [E2E Quick Start: Troubleshooting](./E2E_TESTING_QUICK_START.md#troubleshooting)

---

## Test Audit Results

For comprehensive testing audit results and quality metrics, see:
- `.claude/audits/tests/2025-10-23-test-audit.md` - Full audit with detailed analysis
- `.claude/audits/tests/REMEDIATION_GUIDE.md` - Test improvement recommendations

---

## Related Documentation

- **Game Rules**: See `docs/reference/API.md` for game mechanics
- **Development Guide**: See `docs/reference/DEVELOPMENT_GUIDE.md` for development workflow
- **MCP Integration**: See `docs/reference/INTERACTIVE_GAMEPLAY_SETUP.md` for MCP server setup

---

**Last Updated**: 2025-10-24
**Maintained by**: requirements-architect
