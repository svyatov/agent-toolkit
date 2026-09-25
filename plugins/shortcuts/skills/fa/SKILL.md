---
name: fa
description: Apply every finding from the most recent review, audit, verification, or check in this session
license: MIT
disable-model-invocation: true
argument-hint: [which findings, e.g. 2-4 or S1 C1]
---

Apply the findings from the most recent review, audit, verification, lint run, test run, or other
check reported earlier in this session, whatever produced it. $ARGUMENTS narrows which ones; empty
means all of them, at every severity. A finding the report left as a choice for the user: apply the
option $ARGUMENTS names, else the one the report recommended, worded exactly as it was offered. With
no recommendation, skip it as waiting on that choice.

1. No such report in this session: say so and stop. Do not go looking for problems to invent.
2. Fix root causes, not the symptom each finding names. Grep every caller before editing a shared
   function: one guard where the callers converge beats a guard in each of them.
3. Do not expand scope. A finding is a fix, not an invitation to refactor around it. When the finding
   proposes a fix, apply that fix, together with any change it cannot work without, and name that
   change on the finding's report line. If it cannot work even so, skip the finding and say why
   instead of choosing another.
4. For every repository you edited, this one or another, read its `AGENTS.md`, `CLAUDE.md` and
   `CONTRIBUTING.md`. Run the checks they name, and make the other edits they require of a change (a
   version bump, a changelog entry). Done when each edited repository has its checks run, or is
   named in the report as having none after you read those files.
5. Report one line per finding, `<code>: fixed` or `<code>: skipped, <why>`, then one line per edited
   repository with the checks run. Say plainly when a finding was wrong.

Do not commit. That is what /c, /cp, /cb and friends are for.
