---
name: fci
description: Diagnose the failing CI run on this branch, fix the cause, push, and watch the rerun
license: MIT
compatibility: Requires git and an authenticated gh CLI
disable-model-invocation: true
allowed-tools: Bash(gh pr:*), Bash(gh run:*), Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git push:*)
---

Branch: !`git status --short --branch`
PR checks: !`gh pr checks 2>&1 || true`

1. No PR: first run `gh run list --branch <branch from the Branch line> --limit 5` to inspect the
   branch's runs. Nothing red in the PR checks or those runs: say so and stop.
2. `gh run view <id> --log-failed` for every failing job, where `<id>` is the number after `/actions/runs/`
   in its PR checks link, or the failing run's ID from step 1 when there is no PR. Read the whole
   failure, not the last line.
3. Reproduce locally when the repository has the same check (test suite, linter, build). Fix the root
   cause in the code or the workflow. Do not retry, skip, or mark the check as allowed to fail, and do
   not loosen the check so it passes.
4. A failure that is not ours (flaky runner, upstream outage, expired secret): report it and stop.
5. Commit the fix as a Conventional Commit and push. With a PR, use `gh pr checks --watch`.
   Without a PR, use `gh run list --commit <pushed-sha> --branch <branch>` to find the new run for
   each affected workflow, then `gh run watch <new-run-id> --exit-status` for each. If a new run
   has not registered yet, wait and check again; never substitute a run from an older commit.
   These watchers exit non-zero on failure; read the result. Still red after one round:
   report what remains and stop.
6. Report what failed, the cause, the fix, and the rerun result.
