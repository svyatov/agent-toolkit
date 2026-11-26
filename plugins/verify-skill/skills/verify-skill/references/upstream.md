# Compare an imported source

Resolve the source branch to an immutable head SHA. Compare the stored SHA to that head using GitHub's compare endpoint. Pin all pages, history lookups and content reads to these revisions. Batch independent sources.

## Establish the change set

- **Identical:** record the equal SHAs as in sync.
- **Ahead:** collect commit SHAs, messages and all changed files. Use the GitHub reference selected in Step 2 for pagination and file limits. If the list reaches the cap, obtain a complete diff from a checkout containing both revisions.
- **Behind or diverged:** record both SHAs and the status. Compare the endpoint trees directly, for example with `git diff --name-status -M <base-sha> <head-sha>`. Compare the whole trees before filtering so renames across the boundary remain visible. A merge-base diff or zero ahead count cannot establish equality. Inspect the endpoint patch and relevant history on both sides to account for reversals and removals.
- **Unavailable:** on a 404, check repository access and both refs. If only the base is unresolved, inspect path-filtered history at the pinned head and label observations unanchored. A rate-limit response or other fetch failure leaves dependent checks **Not checked**. Incomplete evidence disqualifies the source from SHA advancement.

Keep changes whose old or new path matches the tracked file, falls within the tracked directory, or belongs to a whole-repository source (`.`). A complete comparison with no matching change passes. For a rewind or divergence, report the history change even when the tracked contents match.

## Review each retained change by source type

- **Copy:** compare the pinned head content with the corresponding relative path in the local skill. For a rename within scope, use the old path locally and the new path upstream. Treat renames into scope as additions and renames out as deletions. Check deletions against the local file without requesting a deleted path at the head.
- **Fork or merge:** read the pinned upstream patch and commit messages. Use old-side hunks for deletions and renames out of scope, new-side hunks for additions and renames into scope, and both sides for in-scope edits. Assess each idea against the local skill wherever it is implemented. A matching local filename is unnecessary.

Batch required content reads in separate temporary files. Missing required history, diffs or content leaves the source **Not checked** and ineligible for SHA advancement. A failed request is never evidence of deletion.

Keep changes that fix a local error, add a relevant case or rule, or remove guidance the local skill still gives. Check intentional differences in `modifications` and per-source notes. Ignore restyling. Grade a borrowing choice **Consider**. Use **Should fix** when the change corrects an error still present locally, quoting both lines. Cite the upstream commit SHA, message and hunk; identify both endpoints when reporting a reversal. Offer an adapted fix or no borrowing. Step 8 governs approval for updating either the skill or its baseline.
