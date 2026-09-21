---
name: p
description: Push the current branch, setting the upstream when it has none
license: MIT
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git push:*)
---

Branch and status: !`git status --short --branch`
Unpushed commits: !`git log --oneline @{upstream}..HEAD 2>&1 || true`

Push the current branch. Do not commit, stage, or touch the working tree.

1. An upstream exists and nothing is unpushed: say so and stop.
2. `git push`, or `git push -u origin HEAD` when the branch has no upstream.
3. Never force-push. A rejected push means the remote moved: report it and stop.
4. Report the branch and the subjects pushed.
