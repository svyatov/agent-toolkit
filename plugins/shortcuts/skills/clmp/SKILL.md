---
name: clmp
description: Commit all changes, squash merge the current branch into main, and push main
license: MIT
compatibility: Requires git and push access to the main remote
disable-model-invocation: true
argument-hint: [message hint]
allowed-tools: Bash(git status:*), Bash(git symbolic-ref:*), Bash(git rev-parse:*), Bash(git worktree:*), Bash(git config:*), Bash(git remote:*), Bash(git fetch:*), Bash(git merge-base:*), Bash(git log:*), Bash(git diff:*), Bash(git add:*), Bash(git switch:*), Bash(git merge:*), Bash(git commit:*), Bash(git push:*), Bash(git ls-remote:*)
---

Branch and status: !`git status --short --branch`
Changed files: !`git diff HEAD --stat || true`
Recent subjects: !`git log --oneline -10 || true`
Worktrees: !`git worktree list --porcelain`

Commit all changes on the current branch, then squash merge that branch into `main` and push `main`.

1. Record the current branch with `git symbolic-ref --quiet --short HEAD`.
   Stop before committing on `main`, detached HEAD, or an active merge, rebase, cherry-pick, or revert.
   Keep the current branch until the commit phase finishes. Keep commit and push hooks enabled.
2. Read the full diff (`git diff HEAD`) and every untracked file listed by `git status`.
   Scan for credentials, tokens, private keys, and values that do not belong in the repository.
   If any appear, stop before staging or committing.
3. Add untracked local tool state directories, such as `.codegraph/`, to the root `.gitignore`.
   Commit that ignore entry with the changes, even when the directory contains its own `.gitignore`.
4. Stage explicit paths. Derive Conventional Commit subjects from the full changes and repository conventions.
   Treat $ARGUMENTS as a message hint. Split unrelated changes into separate commits.
   If there are no changes to commit, continue with the branch's committed work.
5. Commit each staged change. A failed check or hook stops the entire workflow.
   If hooks change files, stop and report the actual state before any merge or push.
   Require the recorded source branch to remain checked out.
   Require a clean index and worktree, including untracked files.
6. Read [the squash merge and push procedure](../../references/squash-merge-push.md). Follow all six steps with the recorded source branch.
   Every stop condition stops this workflow. Retain source commits if merging or pushing fails.
   Report the source commits, any added ignore entry, and the merge and push result.
