---
name: cprw
description: Commit, push, open a pull request, wait for green CI, then squash merge
license: MIT
compatibility: Requires git, an authenticated gh CLI, and permitted network access to GitHub
disable-model-invocation: true
argument-hint: [message hint]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git branch:*), Bash(git switch:*), Bash(git symbolic-ref:*), Bash(git push:*), Bash(git fetch:*), Bash(git merge:*), Bash(git rev-parse:*), Bash(git update-ref:*), Bash(gh pr:*), Bash(gh run:*), Bash(git worktree:*), Bash(sleep:*)
---

Commit the session's work, push, create or reuse its PR, wait for passing CI, and squash merge it. `$ARGUMENTS` is a message hint.

1. Use the checkout containing this session's work. Inspect status, the full uncommitted diff, untracked files, and the branch diff against the PR base. Stop for secrets, detached HEAD, or an unfinished Git operation.
2. On the default branch, create `type/kebab-description` first. Stage explicit paths and make Conventional Commits, splitting unrelated changes. Skip committing when there are no changes. Keep hooks enabled and stop on failure.
3. Push to the configured upstream, setting `origin` as upstream when absent. Create or reuse the branch's PR. Its title and body must cover the whole branch and follow the repository's template and wording rules.
4. Record the PR head SHA and wait for all applicable checks to pass. If no checks appear, confirm that none apply or stop with CI unverified. Failed or unresolved checks, a draft, a conflict, or blocked merging stop the workflow.
5. Re-read the head SHA; if it changed, repeat validation. Run `gh pr merge <PR> --repo <owner/repo> --squash --match-head-commit <validated-sha>`. Wait through any merge queue and confirm the PR merged at the validated head before local cleanup. Leave linked-issue closure to GitHub.
6. Fetch the default branch (usually `main`) from the PR's base repository. Use its existing worktree, or switch the clean session checkout to that branch. Create the local branch at the fetched tip if missing. Fast-forward with `git merge --ff-only <fetched-tip>` and verify HEAD equals that tip. Preserve local changes and commits if synchronization is blocked.
7. Once synced, release the dev branch. If it is still checked out in the session's clean linked worktree, detach that worktree at the synced tip. Preserve dirty or unrelated worktrees. Once no worktree holds the dev branch, delete its local ref with `git update-ref -d refs/heads/<dev-branch> <validated-sha>` so newer commits survive. Verify the branch is absent. Report the PR URL, local sync and cleanup results, including any blocker.
