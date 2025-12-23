#!/usr/bin/env python3
"""
Session Context Hook (SessionStart)

Loads context at session start:
- Branch info and age
- Uncommitted changes summary
- TDD workflow reminder
- Suggestions based on branch state
"""

import json
import subprocess
import sys
from datetime import datetime


def run_git(args: list[str]) -> str:
    """Run a git command and return output."""
    try:
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout.strip()
    except Exception:
        return ""


def get_branch_age_days(branch: str) -> int:
    """Get days since last commit on branch."""
    try:
        timestamp = run_git(["log", "-1", "--format=%ct", branch])
        if timestamp:
            last_commit = datetime.fromtimestamp(int(timestamp))
            return (datetime.now() - last_commit).days
    except Exception:
        pass
    return 0


def main():
    try:
        # Get branch info
        branch = run_git(["branch", "--show-current"]) or "unknown"
        commits_ahead = run_git(["rev-list", "--count", "main..HEAD"]) or "0"
        branch_age_days = get_branch_age_days(branch)

        # Get uncommitted changes
        status = run_git(["status", "--porcelain"])
        uncommitted_files = len(status.splitlines()) if status else 0

        # Get modified production files without corresponding test changes
        diff_files = run_git(["diff", "--name-only"]).splitlines()
        prod_files = [f for f in diff_files if "/src/" in f and ".test." not in f]
        test_files = [f for f in diff_files if ".test." in f or "/tests/" in f]

        # Build context message
        lines = ["📋 **Session Context**"]
        lines.append(f"• Branch: `{branch}` ({commits_ahead} commits ahead of main)")

        if branch_age_days > 0:
            lines.append(f"• Last commit: {branch_age_days} day(s) ago")

        if uncommitted_files > 0:
            lines.append(f"• Uncommitted changes: {uncommitted_files} file(s)")

        # Warnings
        warnings = []

        if int(commits_ahead) > 10:
            warnings.append("Branch has many commits - consider creating a PR")

        if branch_age_days > 3:
            warnings.append("Branch is getting stale - consider merging or rebasing")

        if prod_files and not test_files:
            warnings.append(f"Production files modified without test changes: {', '.join(prod_files[:3])}")

        if warnings:
            lines.append("")
            lines.append("⚠️ **Suggestions:**")
            for w in warnings:
                lines.append(f"  • {w}")

        # Workflow reminder
        lines.append("")
        lines.append("💡 **Workflow:** Requirements → Tests (@req tags) → Implementation")
        lines.append("   Use `test-architect` for tests, `dev-agent` for implementation")
        lines.append("   Use `game-tester` agent or `/playtest` skill for MCP game testing")

        message = "\n".join(lines)

        # Output as JSON with systemMessage
        output = {"systemMessage": message}
        print(json.dumps(output))

    except Exception as e:
        # Don't fail the session on errors
        print(json.dumps({"systemMessage": f"Session context hook error: {e}"}))

    sys.exit(0)


if __name__ == "__main__":
    main()
