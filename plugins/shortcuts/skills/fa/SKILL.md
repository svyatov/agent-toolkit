---
name: fa
description: Apply every finding from the most recent review, audit, verification, or check in this session
license: MIT
disable-model-invocation: true
argument-hint: [which findings, e.g. 2-4 or S1 C1]
---

Apply the latest findings report in this session, or finding text supplied in `$ARGUMENTS`. Codes or numbers select findings; no selection means all severities.

1. Stop when no report or supplied findings exist. For a choice, use the option the user names or the report explicitly recommends; otherwise leave it pending.
2. Apply each proposed fix and its required changes within the finding's scope. Fix root causes and inspect affected callers when changing shared code. Report incorrect, impossible, or partly applicable findings instead of substituting another fix.
3. Follow each edited repository's instructions, required metadata updates, and checks. Use an execution context that supports those checks. Report missing or blocked checks explicitly.
4. Report each finding as fixed, partly fixed, or skipped, with the reason where needed, then the checks for each edited repository. Do not commit.
