#!/usr/bin/env python3
"""
Commit Reminder Hook (PostToolUse on Write|Edit)

Tracks file edits and reminds to commit after significant changes.
Uses a temp file to track edit count across tool calls.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

# Number of file edits before reminding to commit
EDIT_THRESHOLD = 8

# Temp file to track edit count (persists across tool calls in session)
STATE_FILE = Path("/tmp/claude-commit-reminder-state.json")


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
    return {"edit_count": 0, "files_edited": [], "last_reminded": 0}


def save_state(state: dict):
    """Save state to temp file."""
    try:
        STATE_FILE.write_text(json.dumps(state))
    except Exception:
        pass


def reset_state():
    """Reset state after commit reminder shown."""
    save_state({"edit_count": 0, "files_edited": [], "last_reminded": 0})


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path:
        sys.exit(0)

    # Skip non-code files
    if not any(file_path.endswith(ext) for ext in ['.ts', '.tsx', '.js', '.jsx', '.py', '.json']):
        sys.exit(0)

    # Skip files in .claude directory (hook files themselves)
    if '/.claude/' in file_path:
        sys.exit(0)

    # Load and update state
    state = load_state()
    state["edit_count"] += 1

    if file_path not in state["files_edited"]:
        state["files_edited"].append(file_path)

    # Check if we should remind
    edits_since_reminder = state["edit_count"] - state["last_reminded"]

    if edits_since_reminder >= EDIT_THRESHOLD:
        # Get current uncommitted count
        status = run_git(["status", "--porcelain"])
        uncommitted = len(status.splitlines()) if status else 0

        if uncommitted > 0:
            files_list = state["files_edited"][-5:]  # Last 5 files
            files_display = ", ".join([os.path.basename(f) for f in files_list])
            if len(state["files_edited"]) > 5:
                files_display += f" (+{len(state['files_edited']) - 5} more)"

            message = f"""
📝 **Commit Reminder**

You've made {state['edit_count']} edits across {len(state['files_edited'])} file(s).
Recent: {files_display}

Currently {uncommitted} uncommitted file(s) in the working tree.

Consider committing your progress to:
• Create a checkpoint you can return to
• Keep commits focused and reviewable
• Avoid losing work

Run `git status` to review changes, or ask me to commit when ready.
"""
            output = {"systemMessage": message}
            print(json.dumps(output))

            state["last_reminded"] = state["edit_count"]

    save_state(state)
    sys.exit(0)


if __name__ == "__main__":
    main()
