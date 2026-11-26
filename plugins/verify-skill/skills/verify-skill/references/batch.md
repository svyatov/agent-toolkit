# Verify multiple skills

For a fan-out, select the Step 2 guidance once and give each subagent the same reference paths, dates and mode. If the batch includes this verifier or uses `--refresh`, prepare the refreshed guidance once before dispatch. Workers run Steps 1 and 3 to 7 and load only the references their targets need. Step 8 stays with you.

Before dispatch, the coordinator assigns shared metadata parsing, file identities, change dates, and URL checks to available tools. Run each shared check once; give workers its evidence or name the owner of the pending result. Workers return their case checks and findings in the audit record format in Step 1, using the same target keys. Only the coordinator writes the shared record and merges completed evidence into final reports. A worker's missing capability is not automatically a batch-level **Not checked** result.

Determine capacity from the active host's limits, configuration, and already-running workers. On Claude Code, check `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` against the selected Claude reference; use its default only when no valid override is set. If capacity is unknown, use one worker at a time. If subagents are unavailable, verify the skills sequentially in the current session.

Use the active host's available delegation, read and search tools, not assumed Claude tool names or concurrency settings. A worker without write access returns findings in its response; sequential verification and chat questions are valid fallbacks.

When every report is in, the coordinator reconciles each declared skill dependency once: compare invocation policy, arguments, prerequisites, permitted side effects, approval gates, independence, and completion assumptions against the callee and shared contract. Assign each edge to one reviewer and resolve shared-policy interpretations for the whole batch. Reuse worker evidence rather than repeating the per-skill audits.

Then print one table (skill, Blocking, Should fix, Consider), every finding grouped by severity and tagged with its skill, and the clean skills on one line. Number findings F1, F2, and so on across the whole printout, so Step 8 can take them by code.
