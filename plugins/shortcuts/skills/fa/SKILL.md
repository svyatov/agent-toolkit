---
name: fa
description: Apply every finding from the most recent review, audit, verification, or check in this session
license: MIT
disable-model-invocation: true
argument-hint: [which findings, e.g. 2-4 or S1 C1]
---

Apply the findings from the most recent review, audit, verification, lint run, test run, or other
check reported earlier in this session, whatever produced it. $ARGUMENTS narrows which ones; empty
means all of them, at every severity.

1. No such report in this session: say so and stop. Do not go looking for problems to invent.
2. Fix root causes, not the symptom each finding names. Grep every caller before editing a shared
   function: one guard where the callers converge beats a guard in each of them.
3. Do not expand scope. A finding is a fix, not an invitation to refactor around it.
4. Run whatever check the repository already has for the code you touched.
5. Report one line per finding: fixed, or skipped and why. Say plainly when a finding was wrong.

Do not commit. That is what /c, /cp, /cb and friends are for.
