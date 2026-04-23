---
name: refactor
description: "ALWAYS use this skill before refactoring any code. This skill prevents over-refactoring and wrong refactoring by requiring an assessment before changes. It catches cases where code is already clean (stopping unnecessary work), where the real problem is architecture not code (handing off to improve-architecture), and where test coverage must exist before touching business logic. Without this skill, you will skip assessment and jump straight to changes — which risks refactoring code that doesn't need it, or making code-level changes when the real fix is structural. Trigger on: refactor, clean up, simplify, reduce complexity, code smells, messy code, break up function, reduce nesting, remove dead code, file too big, extract method, too many parameters, duplicated code, cognitive complexity, god class, magic numbers. Also trigger when a linter or static analysis tool flags complexity issues. Language-agnostic."
---

# Refactor

Improve code structure without changing behavior. Works at three scopes: **project**, **file**, or **method**. Starts by assessing whether refactoring is even warranted — if the code is already clean, say so and stop.

**Refactoring vs Architecture:** This skill handles code-level improvements — complexity, duplication, naming, dead code, method extraction. If the assessment reveals that the real problem is module boundaries, coupling between packages, or shallow modules that need deepening, suggest the `improve-architecture` skill instead.

## Philosophy

These principles calibrate what "good enough" means and guide every step below:

- **Measure the end state, not the effort.** Writing 50 lines that delete 200 is a win.
- **Simple over easy.** Simple means one concept, not intertwined. Easy means familiar. Choose simple.
- **Separate, don't combine.** Good design is taking things apart — removing dependencies, not adding abstractions.
- **Data over abstractions.** 100 functions on one data structure beat 10 functions on 10 custom types.
- **Less total code.** If "better organized" means more lines, it's more entropy, not less.
- **When in doubt, leave it alone.** The default verdict is Clean. Don't invent work.

See `references/` for deeper exploration of these ideas.

## Step 1: Determine Scope

Infer from the user's request:

| Trigger | Scope |
|---------|-------|
| "refactor this method/function" or a specific symbol name | **method** |
| "refactor this file" or a file path | **file** |
| "refactor this project/codebase" or no specific target | **project** |

If ambiguous, ask.

For **project** scope, read at least one reference from `references/` before proceeding — pick whichever resonates with the codebase you're about to assess:
- `simplicity-vs-easy.md` — when choosing between familiar and simple approaches
- `data-over-abstractions.md` — when evaluating custom types vs generic data
- `design-is-taking-apart.md` — when decomposing coupled systems
- `expensive-to-add-later.md` — when deciding what to keep vs remove

## Step 2: Assess — Is Refactoring Warranted?

**This step is mandatory.** Read the target code and evaluate it against the criteria below. The default verdict is **Clean** — only escalate when there's clear evidence.

### Method scope

- Cognitive complexity — nesting depth >3, boolean expressions with >2 operators, or branch count that makes the flow hard to follow. Investigate, but a long method that reads linearly is not automatically a smell.
- Length — functions over ~50 lines warrant a look, but length alone isn't a verdict. A 70-line function with clear flow is better than 5 tiny functions that scatter the logic.
- Parameter count — >4 parameters on a public API boundary suggests grouping. Internal helpers can have more.
- Single responsibility — does it do one thing?
- Naming clarity — do names describe intent or mechanics?

### File scope

All method-level checks, plus:
- Dead code (unused functions, imports, variables)
- Duplicated logic across functions in the same file
- God class / kitchen-sink module — too many unrelated responsibilities
- Cohesion — do all parts belong together?

### Project scope

All file-level checks, plus:
- Circular dependencies between modules
- Duplicated logic across files/modules
- Overly deep module nesting or excessive file count for what the code does
- Total codebase size — could fewer files/functions achieve the same result?

### The Verdict

| Rating | Meaning | Action |
|--------|---------|--------|
| **Clean** | No meaningful improvements available | Tell the user the code looks good. **Stop here** unless they provide a specific reason to continue. |
| **Minor** | Small improvements possible (naming, minor duplication) | List findings. Ask if the user wants to proceed — these are optional. |
| **Significant** | Clear code smells or structural issues | List findings with priorities. Proceed to Step 3. |
| **Critical** | Major structural problems blocking maintainability | List findings urgently. Proceed to Step 3. |

**Idempotency rule:** If you run this skill on the same code twice and it's already been refactored, the verdict must be **Clean**. Do not invent work. Do not refactor for the sake of refactoring.

**User override:** If the user provides a specific reason to refactor code rated Clean (e.g., "I know it looks fine but I want to extract this into smaller functions"), proceed with their request — but scope the changes strictly to what they asked for. Don't expand into a broader refactoring.

**Architecture signal:** If the assessment reveals problems that are really about module boundaries (tightly coupled packages, shallow modules, missing abstractions at the architectural level), say so and suggest `improve-architecture` instead. Refactoring code inside a badly-bounded module won't fix the real problem.

## Step 3: Plan

For **method** scope, skip to Step 4 — planning is unnecessary for single-symbol changes.

For **file** scope with 1-3 changes, a bullet list is sufficient:
```
Changes:
- Extract X into helper function
- Remove unused imports
- Rename Y to describe intent
```

For **file** scope with 4+ changes or **project** scope, produce a structured plan:

```
## Refactor Plan: [title]

### Current State
[What's wrong and why it matters]

### Target State
[What the code looks like after — fewer lines, fewer concepts, clearer boundaries]

### Changes
| File | Action | Why | Blocked by |
|------|--------|-----|------------|
| path | modify/create/delete | reason | dependencies |

### Sequence
Phase 1: [types/interfaces if applicable]
Phase 2: [implementation changes]
Phase 3: [test updates]
Phase 4: [cleanup — delete dead code]

### Risks
- [What could go wrong and how to mitigate]
```

**Key principle:** The target state should have **less or equal** total code. If your plan adds net lines without removing complexity, reconsider. "Better organized but more code" is not a win — it's more entropy.

Present the plan. Wait for user approval before proceeding.

## Step 3.5: Verify Test Coverage

**Before changing any code**, check that tests exist for the target:

1. Search for test files covering the target code (look for test files matching the module/class name, grep for the function name in test directories)
2. If tests exist — note which behaviors they cover. Proceed to Step 4.
3. If tests are missing or sparse — **stop and tell the user.** Refactoring without tests risks silently changing business logic. Recommend writing tests first, targeting the current behavior at the public interface. Ask: "Should I write tests before refactoring, or do you want to proceed without them?"

This gate is especially important for code with business logic (calculations, validation rules, state transitions, money). Structural code (routing, configuration, glue) is lower-risk without tests, but still worth flagging.

Do not skip this step. Refactoring means "change structure, preserve behavior" — you can only guarantee "preserve behavior" if there are tests to prove it.

## Step 4: Refactor

### Ground Rules

1. **Behavior is preserved** — refactoring changes structure, not behavior
2. **Small steps** — one change at a time, verify after each
3. **One concern at a time** — don't mix refactoring with feature work
4. **Bias toward deletion** — every refactoring is a chance to remove code. Ask: what does this make obsolete?

### Common Refactoring Moves

Apply whichever are relevant. Do not apply moves that don't improve the specific code:

**Reduce complexity:**
- Replace nested conditionals with guard clauses / early returns
- Extract focused helper functions from long methods
- Replace complex boolean expressions with named predicates
- Break god classes into cohesive modules

**Eliminate duplication:**
- Extract shared logic into a single function
- Replace copy-pasted code with parameterized functions
- Consolidate duplicate type definitions

**Improve clarity:**
- Rename variables/functions to describe intent, not mechanics
- Replace magic numbers/strings with named constants
- Group related parameters into objects/records
- Move logic to the object that owns the data (fix feature envy)

**Reduce entropy:**
- Delete dead code — unused functions, imports, variables, commented-out blocks
- Inline single-use abstractions (unnecessary wrappers, thin delegators)
- Prefer data structures over custom types when custom behavior isn't needed
- Ask: could this be fewer functions? Fewer files? Fewer concepts?

### Method Complexity Reduction

When refactoring a specific method for complexity:

1. Identify complexity sources: nesting, long if/else chains, repeated blocks, complex booleans
2. Extract focused helpers — each with a single clear responsibility
3. Use guard clauses to reduce nesting depth
4. The main method should read as a high-level flow
5. Preserve all input/output behavior, error handling, and edge cases

## Step 5: Verify

After refactoring:

1. **Run all tests** that cover the refactored code. If any fail, fix your refactoring, not the tests.
2. **Confirm behavior is unchanged** — same inputs produce same outputs. If tests were written in Step 3.5, they serve as the proof.
3. **Check the result** — re-evaluate the code against Step 2 criteria. The verdict should be **Clean** or **Minor**. If only Minor issues remain, note them but do not re-enter the refactoring loop.
