---
name: wm
description: Wait for CI to pass on this branch's pull request, then squash merge it
license: MIT
compatibility: Requires git and an authenticated gh CLI
disable-model-invocation: true
allowed-tools: Bash(gh pr:*), Bash(gh run:*), Bash(git status:*), Bash(git branch:*), Bash(sleep:*)
---

Pull request: !`gh pr view --json number,title,url,isDraft,mergeable,mergeStateStatus,headRefOid 2>&1 || true`

1. Stop if this branch has no open PR, or the PR is a draft or conflicted.
2. Record the PR identity and head SHA. Run `gh pr checks <PR> --watch` until all applicable checks pass. If none appear, establish from CI configuration and PR requirements that none apply; otherwise stop with CI unverified. Disabled Actions alone proves nothing about other checks. Failed, cancelled, or unresolved checks stop the merge.
3. Re-read the head SHA; if it changed, repeat validation. Stop if merging remains blocked. Run `gh pr merge <PR> --squash --delete-branch --match-head-commit <validated-sha>`. Keep repository enforcement intact; stop on refusal.
4. Verify that the PR merged, waiting if it entered a merge queue. Report the URL and actual result. Do not fix or retry failed checks.
