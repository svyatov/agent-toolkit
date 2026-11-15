---
name: cprw
description: Commit, push, open a pull request, wait for green CI, then squash merge
license: MIT
compatibility: Requires git, an authenticated gh CLI, and permitted network access to GitHub
disable-model-invocation: true
argument-hint: [message hint]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git branch:*), Bash(git switch:*), Bash(git symbolic-ref:*), Bash(git push:*), Bash(gh pr:*), Bash(gh run:*), Bash(git worktree:*), Bash(sleep:*)
---

Commit the session's work, push, create or reuse its PR, wait for passing CI, and squash merge it. `$ARGUMENTS` is a message hint.

1. Use the checkout containing this session's work. Inspect status, the full uncommitted diff, untracked files, and the branch diff against the PR base. Stop for secrets, detached HEAD, or an unfinished Git operation.
2. On the default branch, create `type/kebab-description` first. Stage explicit paths and make Conventional Commits, splitting unrelated changes. Skip committing when there are no changes. Keep hooks enabled and stop on failure.
3. Push to the configured upstream, setting `origin` as upstream when absent. Create or reuse the branch's PR. Its title and body must cover the whole branch and follow the repository's template and wording rules.
4. Record the PR head SHA and wait for all applicable checks to pass. If no checks appear, confirm that none apply or stop with CI unverified. Failed or unresolved checks, a draft, a conflict, or blocked merging stop the workflow.
5. Re-read the head SHA; if it changed, repeat validation. Run `gh pr merge <PR> --repo <owner/repo> --squash --match-head-commit <validated-sha>`. Keep the local default-branch ref and worktrees intact.
6. Verify that the PR merged, waiting if it entered a merge queue. Report its URL and actual result. Leave linked-issue closure to GitHub.
