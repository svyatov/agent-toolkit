---
name: lm
description: Squash merge a local branch into main and commit the result
license: MIT
compatibility: Requires git
disable-model-invocation: true
argument-hint: "[branch]"
allowed-tools: Bash(git status:*), Bash(git symbolic-ref:*), Bash(git rev-parse:*), Bash(git worktree:*), Bash(git merge-base:*), Bash(git log:*), Bash(git diff:*), Bash(git switch:*), Bash(git merge:*), Bash(git commit:*)
---

Branch and status: !`git status --short --branch`
Worktrees: !`git worktree list --porcelain`

Squash merge the local branch named by $ARGUMENTS into local `main`. With no argument, use the
current branch. Merge committed work only. Keep the source branch and its commits. This is a local
operation: do not fetch, pull, push, open a pull request, or delete branches or worktrees.

Read [the local squash merge procedure](../../references/local-squash-merge.md). Follow all five steps.
