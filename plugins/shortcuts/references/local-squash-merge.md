# Local squash merge

1. Resolve the source and `main` with `git rev-parse --verify refs/heads/<branch>`, and record both
   commit IDs. Stop if either local branch is missing, the source is `main`, or no source was
   supplied from a detached HEAD. Use `git worktree list --porcelain` to find the worktree holding
   `main`; if none holds it, use the current worktree. Before changing anything, require a clean
   index and working tree, including untracked files, and no merge, rebase, cherry-pick, or revert
   in progress in the current, source, and target worktrees that exist. Stop and name any blocker;
   leave the user's work intact.
2. Read the source commits (`git log main..<source>`) and their full diff
   (`git diff main...<source>`). Stop if the branches have no common ancestor or the diff exposes
   credentials or private keys. If the source commit is already an ancestor of `main`, report
   that it is already merged and stop. Derive a Conventional Commit subject from the complete
   change, following the repository's wording rules.
3. If `main` has a worktree, run the remaining commands there. Otherwise, `git switch main` in
   the current worktree. Confirm that source and target still match the recorded commit IDs and
   the target is still clean. Run `git merge --squash <recorded-source-commit>`. A conflict or
   other failure stops the workflow before committing: report the target path and conflicting
   files, and leave the result for inspection. A squash merge has no `MERGE_HEAD`; do not suggest
   `git merge --abort` as recovery.
4. If `git diff --cached --quiet` reports no staged changes, report that there is nothing new to
   commit and stop. Otherwise, inspect the staged diff and run the repository's required checks
   in the target worktree. A failed check, a changed staged diff, or new unstaged or untracked
   files stops before committing. Commit the squash with the derived subject, keeping commit
   hooks enabled. If a hook fails or changes files, inspect and report the actual state; stop
   rather than silently adding files, bypassing the hook, or retrying the commit.
5. Confirm that the new commit has the recorded `main` commit as its sole parent and the target
   worktree is clean, and that the source branch still points to its recorded commit. Report the
   source branch, commit subject and short hash, and target worktree path. If verification fails,
   report the actual state and stop without resetting history.
