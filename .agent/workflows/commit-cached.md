---
description: Commit local changes to the current branch only (no push)
---

# Commit Only (Current Branch)

Commits staged changes only. Does not push or create PR.

## Prerequisites

- User has already staged files via `git add`
- Follow the commit message conventions defined in `.agent/rules/commit-msg.md`

## Execution Steps

1. Review staged diffs (`git diff --cached`)
2. Commit with appropriate message

```bash
git commit -m "<Prefix>: <Summary (imperative/concise)>"
```

## Notes

- Follow the commit message format in `.agent/rules/commit-msg.md`.
- This workflow does NOT stage files - user must run `git add` beforehand.