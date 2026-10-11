# GitHub comparison guidance

Refreshed: 2026-10-11

Use for axis D. These are saved API rules; every target repository comparison still runs live. Rules summarize the linked sources; blockquotes are exact excerpts.

## Comparison completeness

Source: https://docs.github.com/en/rest/commits/commits#compare-two-commits

> it includes up to 300 changed files for the entire comparison

Compare `BASE...HEAD` using the REST comparison endpoint. Without pagination, at most 250 commits are returned, with the comparison's latest commit last. Paginated commit results are chronological; a page's last commit need not be the head. The changed-file list appears only on the first page and remains capped at 300 across the comparison. Pagination cannot recover omitted files. Check `total_commits`, page through commits as needed, and use a complete local comparison of the pinned revisions when the file cap is reached. Mark incomplete evidence Not checked rather than declaring the source in sync or advancing its SHA.

Read changed-file status and account for renames and removals when mapping upstream files to the target. Pin follow-up content reads to the compared head SHA. Path-filtered commit history is a fallback when a comparison cannot be anchored; it is not proof of a complete comparison.

## Failed requests

Source: https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api

> you should check your authentication.

A 404 can mean inaccessible resources or an incorrect request, not only a missing commit. Check repository access, the URL and both refs before assigning a cause. A working head with an unresolved base permits an explicitly unanchored history review. Unresolved access or head refs leave the comparison Not checked.

Source: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

> The primary rate limit for unauthenticated requests is 60 requests per hour.

Report rate-limited requests as fetch failures. Inspect the response before treating a 403 as a rate-limit response; respect retry guidance rather than repeatedly issuing the same request.
