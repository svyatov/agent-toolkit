---
name: lmp
description: Squash merge the current branch into main, commit, and push main
license: MIT
compatibility: Requires git and push access to the main remote
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git symbolic-ref:*), Bash(git rev-parse:*), Bash(git worktree:*), Bash(git config:*), Bash(git remote:*), Bash(git fetch:*), Bash(git merge-base:*), Bash(git log:*), Bash(git diff:*), Bash(git switch:*), Bash(git merge:*), Bash(git commit:*), Bash(git push:*), Bash(git ls-remote:*)
---

Branch and status: !`git status --short --branch`
Worktrees: !`git worktree list --porcelain`

Read [the squash merge and push procedure](../../references/squash-merge-push.md). Follow all six steps.
