#!/usr/bin/env node

/**
 * Orphan Detection Script for Requirements Traceability Matrix
 *
 * Purpose: Identify unmapped requirements and tests for traceability gaps
 *
 * Checks:
 * 1. Orphan Requirements: Requirements in RTM without corresponding test files
 * 2. Orphan Tests: Test files without @req tags (unmapped tests)
 * 3. Invalid Requirements: @req tags referencing non-existent requirements
 * 4. Summary: Statistics and recommendations
 *
 * Usage: npm run check-traceability
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface Requirement {
  id: string;
  name: string;
  testFiles: string[];
}

interface TestFile {
  path: string;
  hasReqTag: boolean;
  reqIds: string[];
}

interface OrphanReport {
  orphanRequirements: Requirement[];
  orphanTests: TestFile[];
  invalidReqTags: Array<{ testFile: string; reqId: string }>;
  summary: {
    totalRequirements: number;
    mappedRequirements: number;
    totalTests: number;
    taggedTests: number;
    orphanCount: number;
    coverage: string;
  };
}

class TraceabilityChecker {
  private rootDir: string;
  private requirements: Map<string, Requirement> = new Map();
  private testFiles: TestFile[] = [];
  private report: OrphanReport;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.report = {
      orphanRequirements: [],
      orphanTests: [],
      invalidReqTags: [],
      summary: {
        totalRequirements: 0,
        mappedRequirements: 0,
        totalTests: 0,
        taggedTests: 0,
        orphanCount: 0,
        coverage: '0%'
      }
    };
  }

  /**
   * Load requirements from TRACEABILITY_MATRIX.md
   */
  loadRequirements(): void {
    const rtmPath = path.join(this.rootDir, 'docs/requirements/TRACEABILITY_MATRIX.md');

    if (!fs.existsSync(rtmPath)) {
      console.error(`❌ TRACEABILITY_MATRIX.md not found at ${rtmPath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(rtmPath, 'utf-8');

    // Extract requirement IDs from RTM (e.g., R1.5-01, R2.0-03)
    const reqPattern = /\|\s*([R][\d.]+[-]\d+)\s*\|/g;
    let match;

    while ((match = reqPattern.exec(content)) !== null) {
      const reqId = match[1];
      if (!this.requirements.has(reqId)) {
        this.requirements.set(reqId, {
          id: reqId,
          name: '',
          testFiles: []
        });
      }
    }

    this.report.summary.totalRequirements = this.requirements.size;
  }

  /**
   * Find all test files and extract @req tags
   */
  findTestFiles(): void {
    const testDirs = [
      'packages/cli/tests',
      'packages/core/tests',
      'packages/mcp-server/tests'
    ];

    for (const dir of testDirs) {
      const testDir = path.join(this.rootDir, dir);
      if (!fs.existsSync(testDir)) continue;

      this.findTestFilesRecursive(testDir);
    }

    this.report.summary.totalTests = this.testFiles.length;
  }

  /**
   * Recursively find test files
   */
  private findTestFilesRecursive(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.findTestFilesRecursive(fullPath);
      } else if (entry.name.endsWith('.test.ts')) {
        const relPath = path.relative(this.rootDir, fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Extract @req tags (e.g., @req: R1.5-01 or @req: UTIL-DISPLAY)
        const reqPattern = /@req:\s*([R\w\-\.]+)/g;
        const reqIds: string[] = [];
        let match;
        let hasReqTag = false;

        while ((match = reqPattern.exec(content)) !== null) {
          hasReqTag = true;
          reqIds.push(match[1]);

          // Track this test file for requirement
          if (this.requirements.has(match[1])) {
            const req = this.requirements.get(match[1])!;
            if (!req.testFiles.includes(relPath)) {
              req.testFiles.push(relPath);
            }
          }
        }

        this.testFiles.push({
          path: relPath,
          hasReqTag,
          reqIds
        });

        if (hasReqTag) {
          this.report.summary.taggedTests++;
        }
      }
    }
  }

  /**
   * Identify orphan requirements (no test files)
   */
  findOrphanRequirements(): void {
    for (const [reqId, req] of this.requirements) {
      if (req.testFiles.length === 0) {
        this.report.orphanRequirements.push(req);
      } else {
        this.report.summary.mappedRequirements++;
      }
    }
  }

  /**
   * Identify orphan tests (no @req tag)
   */
  findOrphanTests(): void {
    this.report.orphanTests = this.testFiles.filter(test => !test.hasReqTag);
  }

  /**
   * Identify invalid @req tags (requirement doesn't exist)
   */
  findInvalidReqTags(): void {
    for (const test of this.testFiles) {
      for (const reqId of test.reqIds) {
        // Skip utility tags (UTIL-*)
        if (reqId.startsWith('UTIL-')) continue;

        if (!this.requirements.has(reqId)) {
          this.report.invalidReqTags.push({
            testFile: test.path,
            reqId
          });
        }
      }
    }
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(): void {
    const orphanCount = this.report.orphanRequirements.length + this.report.orphanTests.length;
    this.report.summary.orphanCount = orphanCount;

    const coverage = Math.round(
      (this.report.summary.mappedRequirements / this.report.summary.totalRequirements) * 100
    );
    this.report.summary.coverage = `${coverage}%`;
  }

  /**
   * Generate and print report
   */
  printReport(): void {
    console.log('\n📊 TRACEABILITY ORPHAN DETECTION REPORT');
    console.log('═'.repeat(60));

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log(`   Total Requirements: ${this.report.summary.totalRequirements}`);
    console.log(`   Mapped Requirements: ${this.report.summary.mappedRequirements}`);
    console.log(`   Total Tests: ${this.report.summary.totalTests}`);
    console.log(`   Tagged Tests: ${this.report.summary.taggedTests}`);
    console.log(`   Coverage: ${this.report.summary.coverage}`);
    console.log(`   Orphans Found: ${this.report.summary.orphanCount}`);

    // Orphan Requirements
    if (this.report.orphanRequirements.length > 0) {
      console.log(`\n❌ ORPHAN REQUIREMENTS (${this.report.orphanRequirements.length}):`);
      console.log('   Requirements without test coverage:');
      for (const req of this.report.orphanRequirements) {
        console.log(`   - ${req.id}`);
      }
    }

    // Orphan Tests
    if (this.report.orphanTests.length > 0) {
      console.log(`\n❌ ORPHAN TESTS (${this.report.orphanTests.length}):`);
      console.log('   Tests without @req tags:');
      for (const test of this.report.orphanTests.slice(0, 10)) {
        console.log(`   - ${test.path}`);
      }
      if (this.report.orphanTests.length > 10) {
        console.log(`   ... and ${this.report.orphanTests.length - 10} more`);
      }
    }

    // Invalid @req tags
    if (this.report.invalidReqTags.length > 0) {
      console.log(`\n⚠️  INVALID @req TAGS (${this.report.invalidReqTags.length}):`);
      console.log('   @req tags referencing non-existent requirements:');
      for (const invalid of this.report.invalidReqTags.slice(0, 10)) {
        console.log(`   - ${invalid.testFile}: @req: ${invalid.reqId}`);
      }
      if (this.report.invalidReqTags.length > 10) {
        console.log(`   ... and ${this.report.invalidReqTags.length - 10} more`);
      }
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.report.summary.orphanCount === 0) {
      console.log('   ✅ All requirements are properly mapped to tests!');
    } else {
      if (this.report.orphanRequirements.length > 0) {
        console.log(`   1. Add tests for ${this.report.orphanRequirements.length} orphan requirements`);
      }
      if (this.report.orphanTests.length > 0) {
        console.log(`   2. Add @req tags to ${this.report.orphanTests.length} untagged tests`);
      }
      if (this.report.invalidReqTags.length > 0) {
        console.log(`   3. Fix ${this.report.invalidReqTags.length} invalid @req tags`);
      }
    }

    console.log('\n═'.repeat(60));
  }

  /**
   * Save detailed report to JSON
   */
  saveDetailedReport(): void {
    const reportPath = path.join(this.rootDir, 'traceability-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  /**
   * Run complete analysis
   */
  run(): void {
    console.log('🔍 Starting traceability analysis...\n');

    this.loadRequirements();
    this.findTestFiles();
    this.findOrphanRequirements();
    this.findOrphanTests();
    this.findInvalidReqTags();
    this.calculateSummary();

    this.printReport();
    this.saveDetailedReport();

    // Exit with error code if orphans found
    if (this.report.summary.orphanCount > 0) {
      process.exit(1);
    }
  }
}

// Run the checker
const checker = new TraceabilityChecker();
checker.run();
