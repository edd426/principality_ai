# Project Organization Best Practices Reference

**Status**: AUTHORITATIVE SOURCE
**Created**: 2025-10-24
**Sources**: Twelve-Factor App, Software Engineering at Google, Monorepo Research (2024), TypeScript Standards
**Last Updated**: 2025-10-24

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Best Practices by Category](#best-practices-by-category)
3. [Anti-Patterns](#anti-patterns)
4. [Evaluation Framework](#evaluation-framework)
5. [References](#references)

---

## Core Principles

### 1. One Codebase, Multiple Deploys

**Source**: Twelve-Factor App (Factor I)

A single source repository contains all code for the application, supporting multiple deployment instances across different environments (development, staging, production).

**Application**:
- ✅ All source code in one repository
- ✅ Multiple deployment configurations (environment-specific)
- ✅ Single source of truth for requirements
- ❌ Code split across multiple repositories unless logical separation justified
- ❌ Different versions in different environments

---

### 2. Explicit Dependency Declaration

**Source**: Twelve-Factor App (Factor II), Google SWE Chapter 18

Dependencies must be explicitly declared and isolated, not relying on system-wide installations.

**Application**:
- ✅ package.json/npm workspaces for JavaScript/TypeScript
- ✅ Dependency manifest at root level
- ✅ Lock files (package-lock.json) committed
- ✅ No reliance on system-installed packages
- ❌ Implicit dependencies on globally installed tools
- ❌ Assuming development environment matches production

---

### 3. Configuration Separation

**Source**: Twelve-Factor App (Factor III)

Configuration (environment variables, secrets, deployment settings) separate from code.

**Application**:
- ✅ Environment variables for deployment settings
- ✅ No hardcoded credentials, API keys, or URLs
- ✅ Configuration files excluded from version control (.env)
- ✅ Same code artifact deployed to different environments
- ❌ Configuration embedded in source code
- ❌ Different code versions for different environments

---

### 4. Build, Release, Run Separation

**Source**: Twelve-Factor App (Factor V), Google SWE Chapter 18

Three distinct stages: code compilation (build), configuration application (release), execution (run).

**Application**:
- ✅ Build: Compile source code into deployable artifact
- ✅ Release: Apply environment configuration to build
- ✅ Run: Execute release in target environment
- ✅ Each stage clearly defined and separated
- ❌ Configuration applied during build
- ❌ Build steps mixed with deployment

---

### 5. Monorepo Clarity & Modular Design

**Source**: Monorepo Best Practices (2024 Industry Consensus)

Clear directory organization with logical separation of concerns within a single repository.

**Application**:
- ✅ Clear, descriptive folder names
- ✅ Related libraries and projects grouped together
- ✅ Modular architecture with reusable components
- ✅ Shared configuration and utilities isolated
- ✅ Test files colocated with source (or in clear tests/ structure)
- ❌ Unclear folder purposes ("utils", "misc", "temp")
- ❌ Mixed concerns in single directory
- ❌ Inconsistent naming conventions

---

## Best Practices by Category

### A. Directory Structure

**Standard**: Clear, hierarchical organization that immediately communicates purpose.

**Checklist**:
- [ ] Root-level clear: `packages/`, `docs/`, `src/`, `.claude/`, tests clearly separated
- [ ] Package names descriptive: `@principality/core`, `@principality/cli` (not `pkg1`, `module2`)
- [ ] Configuration at root: `package.json`, `tsconfig.json`, `.gitignore`, `CLAUDE.md`
- [ ] Monorepo structure clear: `packages/*/src/`, `packages/*/tests/` patterns consistent
- [ ] No ambiguous folders: Avoid "utils", "helpers", "misc" without context
- [ ] Documentation co-located: README.md at appropriate hierarchy levels

**Example - Good Structure**:
```
principality-ai/
├── packages/
│   ├── core/              # Game engine
│   │   ├── src/
│   │   ├── tests/
│   │   ├── README.md
│   │   └── package.json
│   ├── cli/               # CLI interface
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   └── mcp-server/        # MCP integration
│       ├── src/
│       ├── tests/
│       └── package.json
├── docs/                  # Documentation
│   ├── reference/
│   ├── requirements/
│   └── testing/
├── .claude/               # Claude Code configuration
│   ├── agents/
│   ├── audits/
│   └── commands/
├── CLAUDE.md              # Project instructions
├── package.json           # Root workspaces
└── README.md              # Project overview
```

**Example - Bad Structure**:
```
principality-ai/
├── src/                   # Unclear what this contains
├── lib/                   # Generic, unclear purpose
├── utils/                 # Where do utils go? Which package?
├── dist/                  # Build artifacts shouldn't be in repo
├── node_modules/          # Package files shouldn't be in repo
├── docs/
├── config/
├── scripts/
└── (no clear workspace structure)
```

---

### B. Monorepo Configuration

**Standard**: npm workspaces or equivalent, clear package interdependencies.

**Checklist**:
- [ ] Root `package.json` defines workspaces: `"workspaces": ["packages/*"]`
- [ ] Each package has own `package.json` with scope: `"name": "@principality/core"`
- [ ] Shared dependencies defined at root (npm v7+)
- [ ] Lock file (package-lock.json) committed
- [ ] TypeScript project references used (if TypeScript monorepo)
- [ ] Clear dependency graph documented

**Reference Implementation**:
```json
{
  "name": "@principality/monorepo",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```

---

### C. Documentation Organization

**Standard**: Clear information architecture with single sources of truth.

**Checklist**:
- [ ] `CLAUDE.md` at root: Project instructions, phases, architecture
- [ ] `docs/reference/`: API docs, architecture, patterns
- [ ] `docs/requirements/`: Phase-based requirements with acceptance criteria
- [ ] `docs/testing/`: Test patterns, coverage philosophy, frameworks
- [ ] README.md at root and package level
- [ ] Documentation hierarchy matches code hierarchy
- [ ] No orphaned doc files (all referenced from index)
- [ ] Clear metadata: Status, Created, Phase, Audience

---

### D. Build & Dependency Management

**Standard**: Consistent build configuration, incremental builds, clear dependency boundaries.

**Checklist**:
- [ ] Root `tsconfig.json` with shared settings
- [ ] Each package `tsconfig.json` extends root
- [ ] TypeScript `"composite": true` for project references
- [ ] Build script documented: `npm run build`
- [ ] Incremental builds supported
- [ ] Dependencies isolated per package (monorepo best practice)
- [ ] No circular dependencies
- [ ] Version consistency enforced (lockfile)

---

### E. Configuration Management

**Standard**: Environment separation, no secrets in repository.

**Checklist**:
- [ ] `.env` files excluded from version control (.gitignore)
- [ ] Environment variables documented (`.env.example`)
- [ ] No hardcoded API keys, credentials, URLs
- [ ] Configuration hierarchy: global → package → environment
- [ ] Development, test, production configs clearly separated
- [ ] Configuration loading documented in CLAUDE.md

---

### F. Version Control & Branching

**Standard**: Clear repository structure, meaningful commit history.

**Checklist**:
- [ ] Main branch protected (requires review)
- [ ] Feature branches descriptive: `feature/`, `bugfix/`, `docs/`
- [ ] Commit messages follow convention (conventional commits)
- [ ] `.gitignore` comprehensive: Build artifacts, secrets, dependencies
- [ ] `package-lock.json` committed (reproducible installs)
- [ ] No large binary files in repository
- [ ] Git hooks/pre-commit configured (if applicable)

---

### G. Code Organization (Within Packages)

**Standard**: Clear module boundaries, separation of concerns.

**Checklist**:
- [ ] `src/` contains production code
- [ ] `tests/` or `*.test.ts` patterns consistent
- [ ] Utilities organized by purpose: `src/utils/parsing`, `src/utils/state`
- [ ] Types/interfaces in dedicated files or alongside code
- [ ] No "catch-all" util modules
- [ ] Public API clearly documented (index.ts exports)
- [ ] Internal modules marked private

---

## Anti-Patterns

### Anti-Pattern 1: Unclear Directory Names

**Problem**:
```
src/utils/
src/helpers/
src/common/
src/misc/
src/temp/
```

**Why it's bad**: Developers don't know where to find/place code. "utils" could contain anything. "helpers" is equally vague. Code organization breaks down.

**Fix**:
```
src/parsing/      # Input parsing, validation
src/state/        # State management, immutability
src/effects/      # Card effects, game mechanics
src/display/      # Output formatting, CLI display
```

---

### Anti-Pattern 2: Mixed Monorepo & Monolith

**Problem**: One repo with monorepo structure claims, but packages are tightly coupled, cannot be developed independently.

**Example**:
```
packages/core/src/index.ts imports from packages/cli/src/
packages/cli/src/ imports from packages/core/ (circular)
No clear dependency direction
```

**Why it's bad**: Defeats purpose of modular structure. Can't reuse packages independently. Hard to test in isolation.

**Fix**: Define clear dependency boundaries:
- `core` has no dependencies on `cli` or `mcp-server`
- `cli` depends on `core` (unidirectional)
- `mcp-server` depends on `core` (unidirectional)

---

### Anti-Pattern 3: Configuration in Code

**Problem**:
```typescript
const API_KEY = "sk-ant-...";  // Hardcoded
const PROD_URL = "https://api.example.com";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
```

**Why it's bad**: Secrets in version control. Configuration locked in code. Cannot deploy same build to multiple environments.

**Fix**:
```typescript
const API_KEY = process.env.API_KEY;
const PROD_URL = process.env.API_URL;
const IS_PRODUCTION = process.env.ENVIRONMENT === "production";
```

---

### Anti-Pattern 4: Build Artifacts in Repository

**Problem**:
```
repo/
├── dist/          # ← Compiled output
├── build/         # ← Generated files
├── node_modules/  # ← Downloaded packages
```

**Why it's bad**: Repository bloats. Build artifacts from different environments conflict. CI/CD becomes unreliable.

**Fix**: `.gitignore` includes:
```
dist/
build/
node_modules/
.next/
target/
```

---

### Anti-Pattern 5: Inconsistent Package Structure

**Problem**:
```
packages/core/
├── lib/
├── test/
├── src/

packages/cli/
├── source/
├── tests/
└── (no src)

packages/web/
├── app/
├── __tests__/
```

**Why it's bad**: Developers can't find files. Tooling breaks (linting, testing, building). Onboarding difficult.

**Fix**: Consistent structure across all packages:
```
packages/*/
├── src/           # Production code
├── tests/         # Test code
├── package.json
└── tsconfig.json
```

---

### Anti-Pattern 6: Orphaned Documentation

**Problem**:
```
docs/
├── API.md
├── ARCHITECTURE.md
├── TESTING.md
(no index, no references)

.claude/
├── notes.txt
├── random-doc.md
```

**Why it's bad**: Documentation impossible to discover. Information duplicated in multiple places. Outdated docs remain.

**Fix**:
```
docs/
├── README.md              # Index with links
├── reference/
│   ├── API.md
│   └── ARCHITECTURE.md
├── requirements/
│   └── phase-1/
└── testing/
    └── TEST_PATTERNS.md
```

---

### Anti-Pattern 7: Unclear Dependencies

**Problem**:
```
// No clear version strategy
package.json has: ^1.2.3 and ~1.2.3 mixed
No package-lock.json committed
package-lock differs between dev and CI
```

**Why it's bad**: Different dependencies in different environments. "Works on my machine" syndrome. Non-reproducible builds.

**Fix**:
- Consistent version constraints (all `^` or all `~`)
- `package-lock.json` committed to repo
- CI/CD uses `npm ci` (not `npm install`)
- Regular audits of dependencies

---

### Anti-Pattern 8: No Separation of Concerns

**Problem**:
```
src/
└── index.ts       # 10,000 lines of everything
```

**Why it's bad**: Impossible to test. Cannot reuse code. Difficult to understand. Hard to maintain.

**Fix**: Modular structure:
```
src/
├── engine/        # Core game logic
├── parser/        # Input parsing
├── display/       # Output formatting
├── types.ts       # Shared types
└── index.ts       # Public exports
```

---

## Evaluation Framework

### Dimension 1: Directory Structure Clarity (0-25 points)

**Description**: How clear is the purpose of each directory/package?

| Score | Characteristics |
|-------|-----------------|
| 25 | Crystal clear structure, obvious purpose for every folder, intuitive navigation |
| 20 | Clear structure with mostly obvious purposes, minor ambiguity |
| 15 | Adequate structure but some ambiguous folder names, requires exploration |
| 10 | Unclear purposes for many folders, confusing navigation |
| 0 | No clear organization, random folder names, impossible to navigate |

**Questions**:
- Can a new developer understand what's in each folder?
- Are folder purposes self-documenting?
- Is there a clear hierarchy?

---

### Dimension 2: Monorepo Configuration (0-25 points)

**Description**: Is the monorepo properly configured for development?

| Score | Characteristics |
|-------|-----------------|
| 25 | Perfect npm workspace setup, TypeScript references, clear package interdependencies |
| 20 | Good workspace config, clear dependencies, minor optimization opportunities |
| 15 | Adequate monorepo setup but some configuration gaps |
| 10 | Minimal workspace setup, unclear dependencies |
| 0 | No monorepo configuration, packages not properly isolated |

**Questions**:
- Are workspaces properly configured?
- Can packages be developed/tested independently?
- Is the dependency graph clear?

---

### Dimension 3: Documentation Organization (0-20 points)

**Description**: Is documentation discoverable and well-organized?

| Score | Characteristics |
|-------|-----------------|
| 20 | Comprehensive docs with clear hierarchy, index/ToC, no orphaned files |
| 15 | Good documentation organization with minor gaps |
| 10 | Documentation exists but scattered or inconsistently organized |
| 5 | Minimal documentation, difficult to discover |
| 0 | No meaningful documentation structure |

**Questions**:
- Can users find documentation easily?
- Is there a clear index?
- Are docs kept current?

---

### Dimension 4: Build & Configuration (0-15 points)

**Description**: Are build processes and configuration properly managed?

| Score | Characteristics |
|-------|-----------------|
| 15 | Clear build configuration, environment separation, no secrets in repo |
| 12 | Good configuration management with minor gaps |
| 10 | Adequate build process and configuration |
| 5 | Minimal configuration, some secrets/hardcoding |
| 0 | No configuration management, secrets in repo |

**Questions**:
- Are builds reproducible?
- Is configuration separated from code?
- Are environments properly isolated?

---

### Dimension 5: Code Organization (0-15 points)

**Description**: Is code organized with clear separation of concerns?

| Score | Characteristics |
|-------|-----------------|
| 15 | Clear module boundaries, separation of concerns, tests colocated/organized |
| 12 | Good code organization with minor overlap |
| 10 | Adequate organization but some mixed concerns |
| 5 | Poor separation, unclear module purposes |
| 0 | No code organization, monolithic structure |

**Questions**:
- Is each module's purpose clear?
- Are concerns separated?
- Can modules be tested in isolation?

---

### Overall Scoring

```
Total Score = Sum of all dimensions (0-100)

90-100: Excellent - Production-ready structure
80-89:  Good - Solid organization with minor improvements
70-79:  Fair - Works but needs organization improvements
60-69:  Poor - Significant structural issues
<60:    Critically Deficient - Requires restructuring
```

---

## References

**Primary Sources** (Authoritative Standards):

1. **Twelve-Factor App Methodology**
   - URL: https://12factor.net/
   - Accessed: 2025-10-24
   - Citation: The Twelve-Factor App: A methodology for building SaaS applications
   - Factors referenced: I (Codebase), II (Dependencies), III (Config), V (Build/Release/Run)

2. **Software Engineering at Google**
   - URL: https://abseil.io/resources/swe-book/html/toc.html
   - Accessed: 2025-10-24
   - Citation: Winters, T., Manshreck, T., Wright, H. "Software Engineering at Google"
   - Chapters referenced: 8 (Style Guides), 10 (Documentation), 16 (Version Control), 18 (Build Systems)

3. **Monorepo Best Practices** (2024 Industry Consensus)
   - Sources: SonarSource, CircleCI, Anima, DhiWise, Medium articles
   - Accessed: 2025-10-24
   - Aggregate of current best practices from major DevOps platforms

4. **TypeScript Monorepo Patterns**
   - URL: https://2ality.com/2021/07/simple-monorepos.html
   - Accessed: 2025-10-24
   - Citation: Rauschmayer, A. "Simple monorepos via npm workspaces and TypeScript project references"

**Secondary Sources** (Community Standards):

- npm workspaces documentation
- TypeScript project references documentation
- GitHub project structure recommendations

---

**Version**: 1.0
**Last Updated**: 2025-10-24
**Maintainer**: Requirements Architect
**Next Review**: End of Phase 2

