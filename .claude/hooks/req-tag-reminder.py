#!/usr/bin/env python3
"""
@req Tag Reminder Hook (PreToolUse on test files)

Reminds to include @req tags when writing test files.
Non-blocking - just provides a gentle reminder.
"""

import json
import sys
import re


def is_test_file(file_path: str) -> bool:
    """Check if file is a test file."""
    if not file_path:
        return False

    # Check for test patterns
    if '.test.' in file_path or '.spec.' in file_path:
        return True

    if '/tests/' in file_path or '/__tests__/' in file_path:
        return True

    return False


def has_req_tags(content: str) -> bool:
    """Check if content contains @req tags."""
    return bool(re.search(r'@req\s*[:\s]', content, re.IGNORECASE))


def count_test_blocks(content: str) -> int:
    """Count test/it/describe blocks in content."""
    patterns = [
        r'\btest\s*\(',
        r'\bit\s*\(',
        r'\bdescribe\s*\(',
    ]
    count = 0
    for pattern in patterns:
        count += len(re.findall(pattern, content))
    return count


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only check Write operations on test files (Edit might be small changes)
    if tool_name != "Write" or not is_test_file(file_path):
        sys.exit(0)

    content = tool_input.get("content", "")

    # Check if writing tests without @req tags
    test_count = count_test_blocks(content)
    has_reqs = has_req_tags(content)

    if test_count > 0 and not has_reqs:
        # Output reminder
        message = f"""
💡 **@req Tag Reminder**

You're writing {test_count} test(s) without `@req` tags.

Consider adding requirement tags to link tests to specifications:
```typescript
// @req: FR-1.2 - User can log in with valid credentials
test('should authenticate user with correct password', () => {{
  // ...
}});
```

Benefits:
• Links tests to requirements for traceability
• Helps test-architect understand test coverage
• Makes it clear what behavior is being verified

File: {file_path}
"""
        # Use systemMessage to show reminder without blocking
        output = {"systemMessage": message}
        print(json.dumps(output))

    sys.exit(0)


if __name__ == "__main__":
    main()
