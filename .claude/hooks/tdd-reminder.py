#!/usr/bin/env python3
"""
TDD Reminder Hook

Triggers before Edit/Write on production code files to remind about TDD workflow.
This hook does NOT block edits - it outputs a reminder that Claude will see.
"""

import json
import sys
import re

def is_production_code(file_path: str) -> bool:
    """Check if file is production code (not test, not config, not docs)."""
    if not file_path:
        return False

    # Must be in packages/*/src/ directory
    if not re.search(r'packages/[^/]+/src/', file_path):
        return False

    # Exclude test files
    if '.test.' in file_path or '.spec.' in file_path or '/tests/' in file_path:
        return False

    # Exclude type definition files that are just interfaces
    if file_path.endswith('.d.ts'):
        return False

    # Must be a code file
    if not file_path.endswith(('.ts', '.tsx', '.js', '.jsx')):
        return False

    return True


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)  # Don't block on parse errors

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if is_production_code(file_path):
        # Output reminder to stderr (Claude sees this)
        print("""
================================================================================
WORKFLOW REMINDER: You are editing production code.

This project follows: Requirements -> Tests -> Implementation

Before proceeding, verify:
  1. Are requirements defined? (Check @req tags in tests or GitHub issues)
  2. Is there a failing test that defines this change?
  3. Have you run 'npm test' to confirm the current state?

If this is a bug fix: Write a test that reproduces the bug FIRST.
If this is a new feature: Define requirements, then write failing tests FIRST.

Consider using:
  - test-architect agent: For writing requirements and tests
  - dev-agent: For implementing code to make tests pass

File: {}
================================================================================
""".format(file_path), file=sys.stderr)

    # Always allow the edit (exit 0) - this is advisory, not blocking
    sys.exit(0)


if __name__ == "__main__":
    main()
