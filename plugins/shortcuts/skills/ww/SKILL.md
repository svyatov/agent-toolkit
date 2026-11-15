---
name: ww
description: Explain the question you just asked and recommend an answer, with the case for and against each option
license: MIT
disable-model-invocation: true
argument-hint: '[which question, or the part I do not follow]'
---

Explain the latest open question, decision, or blocker. `$ARGUMENTS` selects another one or names what is unclear. Stop if none exists.

1. Check the project facts needed to compare the choices.
2. Explain the decision and its consequences in plain words; define unfamiliar terms.
3. Compare the available options as O1, O2, and so on, including a better option when supported. Give each option's benefit, cost, risk, and reversibility.
4. State `I recommend O#` and the deciding reason. If a missing user preference changes the answer, explain how.
5. For a close decision that is costly to reverse, offer a complete explicit `jury` invocation only when that skill is installed. Include the question, options, and constraints. End with the recommendation and wait for the user's decision.
