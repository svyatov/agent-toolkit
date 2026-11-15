---
name: p
description: Push the current branch, setting the upstream when it has none
license: MIT
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git push:*)
---

Branch and status: !`git status --short --branch`

Push the current branch. Do not commit, stage, or touch the working tree.

1. Before pushing, record the commits ahead of the actual push destination for the report.
2. `git push`, or `git push -u origin HEAD` when the branch has no upstream.
3. Never force-push. If the push is rejected, report the remote's reason (non-fast-forward, branch protection, ruleset) and stop.
4. Report the branch and the subjects actually pushed, or that it was already up to date.
