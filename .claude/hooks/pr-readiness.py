#!/usr/bin/env python3
"""
PR Readiness Hook (Stop)

When Claude finishes responding, checks if the branch might be ready for a PR.
Suggests creating a PR if:
- On a feature/fix branch (not main)
- Has commits ahead of main
- Has no uncommitted changes (or minimal)
- Recent work suggests feature completion
"""

import json
import os
import subprocess
import sys
from pathlib import Path

# State file to track if we've already suggested PR this session
STATE_FILE = Path("/tmp/claude-pr-readiness-state.json")

# Keywords that suggest feature completion
COMPLETION_KEYWORDS = [
    "fixed", "implemented", "complete", "done", "finished",
    "added", "resolved", "working", "passes", "all tests pass"
]


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


def load_state() -> dict:
    """Load state from temp file."""
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text())
    except Exception:
        pass
    return {"pr_suggested": False, "suggestion_count": 0}


def save_state(state: dict):
    """Save state to temp file."""
    try:
        STATE_FILE.write_text(json.dumps(state))
    except Exception:
        pass


def has_completion_signals(transcript_path: str) -> bool:
    """Check if recent conversation suggests work completion."""
    # This is a simplified check - in practice, the hook could analyze
    # the transcript for completion signals
    # For now, we'll just check based on git state
    return True


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    # Load state to avoid repeated suggestions
    state = load_state()

    # Limit suggestions to once per session (avoid being annoying)
    if state.get("pr_suggested"):
        sys.exit(0)

    # Get branch info
    branch = run_git(["branch", "--show-current"]) or ""

    # Skip if on main/master
    if branch in ["main", "master", ""]:
        sys.exit(0)

    # Check commits ahead of main
    commits_ahead = run_git(["rev-list", "--count", "main..HEAD"]) or "0"

    # Need at least some commits to suggest PR
    if int(commits_ahead) < 1:
        sys.exit(0)

    # Check uncommitted changes
    status = run_git(["status", "--porcelain"])
    uncommitted = len(status.splitlines()) if status else 0

    # If many uncommitted changes, don't suggest PR yet
    if uncommitted > 3:
        sys.exit(0)

    # Check if this looks like a feature branch
    is_feature_branch = any(
        prefix in branch.lower()
        for prefix in ["feature/", "fix/", "feat/", "bugfix/", "issue-", "issue/"]
    )

    # For feature branches with commits and minimal uncommitted work, suggest PR
    if is_feature_branch and int(commits_ahead) >= 1:
        # Check if there's already an open PR for this branch
        existing_pr = run_git(["ls-remote", "origin", f"refs/pull/*/head"])
        # This is a simplified check - gh pr list would be more accurate

        message = f"""
🚀 **PR Readiness Check**

Branch `{branch}` has {commits_ahead} commit(s) ahead of main.
{"Uncommitted changes: " + str(uncommitted) + " file(s)" if uncommitted > 0 else "No uncommitted changes."}

This branch looks ready for a pull request!

**Next steps:**
1. {"Commit remaining changes" if uncommitted > 0 else "Review your commits"}
2. Run `npm test` to verify all tests pass
3. Create PR with: `gh pr create` or ask me to create one

Would you like me to create a PR for this branch?
"""
        output = {"systemMessage": message}
        print(json.dumps(output))

        # Mark that we've suggested a PR
        state["pr_suggested"] = True
        state["suggestion_count"] = state.get("suggestion_count", 0) + 1
        save_state(state)

    sys.exit(0)


if __name__ == "__main__":
    main()
