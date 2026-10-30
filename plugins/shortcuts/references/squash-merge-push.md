# Squash merge and push

Squash merge the current branch's committed work into `main`, then push `main`.
Keep the source branch and its commits. Keep commit and push hooks enabled.
Do not force push, open a pull request, or delete branches or worktrees.

1. Read [the local squash merge procedure](local-squash-merge.md).
   Use the current branch as the source. Run step 1 before any fetch or branch switch.
   A detached HEAD, `main` as source, or any failed precondition stops the workflow.
2. Resolve `main`'s configured upstream remote and branch. Without an upstream, use `origin` and `refs/heads/main`.
   Require an existing, nonlocal remote and `refs/heads/main` as the destination.
   Fetch with `git fetch <remote> refs/heads/main`. Record the commit from `git rev-parse FETCH_HEAD`.
   A fetch failure stops before merging or committing.
   Require the recorded local `main` commit to be an ancestor of the fetched commit.
   Otherwise, stop and report that local `main` has unpublished commits or divergent history.
3. Use the worktree holding `main`; otherwise, switch the current worktree to `main`.
   Recheck the clean worktree, operation state, and recorded source and target commit IDs.
   Fast-forward with `git merge --ff-only <fetched-commit>`. Stop on failure.
   Replace the recorded `main` commit with the fetched commit.
4. Follow steps 2 through 5 of the local squash merge procedure with these recorded commits.
   Every stop condition also stops this workflow, including an already merged source or an empty squash.
   Continue only after a new squash commit passes all checks and verification.
5. Record the squash commit ID. Confirm `main` still points there and the target worktree remains clean.
   Push with `git push <remote> refs/heads/main:refs/heads/main`.
   On rejection or hook failure, stop and report the reason and retained local commit.
   Never retry with force, bypass hooks, reset history, or substitute a pull request.
6. Verify `git ls-remote <remote> refs/heads/main` returns the squash commit ID.
   If verification fails, report the actual state without claiming success.
   Report the source branch, squash subject and short hash, target worktree, and remote branch pushed.
