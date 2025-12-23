#!/usr/bin/env python3
"""
Game Session Validation Hook (PreToolUse on mcp__principality__game_session)

Blocks game_session "new" calls that don't specify the edition parameter.
This ensures playtests use the correct edition to find target cards.
"""

import json
import sys


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    command = tool_input.get("command", "")
    edition = tool_input.get("edition")
    seed = tool_input.get("seed")

    # Only validate "new" commands
    if command != "new":
        sys.exit(0)

    # Check if edition is missing
    if not edition:
        print(json.dumps({
            "decision": "block",
            "reason": (
                "Missing `edition` parameter in game_session call.\n\n"
                "**Required**: You must specify `edition` when starting a new game:\n"
                "- `edition: \"mixed\"` - All 25 kingdom cards (recommended for testing)\n"
                "- `edition: \"2E\"` - Second Edition only (excludes Chapel, Adventurer, etc.)\n"
                "- `edition: \"1E\"` - First Edition only\n\n"
                "**Example**: `game_session(command: \"new\", seed: \"test-1\", edition: \"mixed\")`\n\n"
                "Consult `/docs/testing/mcp-playtests/SCENARIOS.md` for correct seed/edition values."
            )
        }))
        sys.exit(0)

    # Advisory: warn if seed not specified (but don't block)
    if not seed:
        print(json.dumps({
            "systemMessage": (
                "**Note**: No `seed` specified. Game will use random kingdom.\n"
                "For reproducible tests, specify a seed from SCENARIOS.md."
            )
        }))

    sys.exit(0)


if __name__ == "__main__":
    main()
