#!/usr/bin/env python3
"""
TDD Reminder Hook (PreToolUse on production files)

Gentle reminder when editing production code to consider TDD workflow.
Non-blocking - advisory only.
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

    # Exclude type definition files
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
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if is_production_code(file_path):
        # Concise reminder
        print(json.dumps({
            "systemMessage": (
                "💡 **Production Code Edit**\n"
                f"File: `{file_path.split('/')[-1]}`\n\n"
                "Consider: Does a failing test define this change?\n"
                "For complex changes, use `test-architect` → `dev-agent` workflow."
            )
        }))

    sys.exit(0)


if __name__ == "__main__":
    main()
