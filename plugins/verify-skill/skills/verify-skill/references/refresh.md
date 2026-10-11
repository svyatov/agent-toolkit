# Refresh the saved guidance

Read only for a self-check or an explicit `--refresh`. This is the update procedure, not a source of verification rules.

1. Read all four guidance files listed in Step 2 of SKILL.md. Extract their `Source:` URLs and fetch the unique URLs in parallel into a fresh temporary directory. Use `curl -fsSL` with a timeout and keep final HTTP status and effective URL. Prefer the site's Markdown or llms endpoints; fall back to HTML when necessary. A redirect is acceptable only when the response contains the expected documentation, not an error or sign-in page.
2. Compare every saved rule and excerpt with the fresh source, then stage revised guidance files in the temporary directory. Preserve the small topic-based files. Keep source URLs, short exact supporting excerpts and clearly labeled rule summaries. Add relevant new guidance and remove contradicted rules; do not copy whole documentation pages. Set a file's `Refreshed` date to today only when all its sources and rules have been checked successfully.
3. For names or fields the fresh pages do not settle, fetch only the relevant official documentation. Use the Claude Code changelog only to settle a specific unresolved name. If the saved Claude guidance is more than a month old, read the what's-new index and at most the eight newest relevant weekly pages since that date; report a capped window or missing pages. Record any new enduring rule's source in the corresponding guidance file.
4. Verify the target against the staged guidance. For a self-check, also compare the verifier's instructions and bundled references with the fresh sources. Use the staged files as the authority, so outdated saved rules cannot validate themselves. Failed source fetches leave dependent live checks Not checked. Keep the old reference file and its original date intact; it may be reported separately as a cached check, never as a successful refresh.
5. Present the reference diff with the target findings in Step 8. For a self-check, propose updates beside the target verifier; for `--refresh` on another skill, propose them beside the executing verifier. Apply only approved updates, including date-only changes after a successful recheck. Preserve failed groups unchanged. Follow the destination repository's version, changelog and validation rules. If the user declines, leave the saved references unchanged and report that fresh guidance was used for this run only.

Additional refresh-only sources:

- https://code.claude.com/docs/en/changelog.md
- https://code.claude.com/docs/en/whats-new/index.md

After approved updates, check every local reference link, excerpt provenance, date and affected verification rule against the already-fetched evidence. A normal verification never performs this refresh procedure implicitly. Remove temporary scripts at the end; retain source evidence only when needed for the pending review.
