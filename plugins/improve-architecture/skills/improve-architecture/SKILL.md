---
name: improve-architecture
description: "Explore a codebase to find architectural improvement opportunities with an assessment gate that stops if architecture is already healthy. Prevents god objects through cohesion checks and includes mandatory test writing for new module boundaries. Use to improve architecture, consolidate tightly-coupled modules, simplify module boundaries, deepen shallow modules, or improve testability."
license: MIT
disable-model-invocation: true
---

# Improve Codebase Architecture

Explore a codebase, surface architectural friction, and propose module-deepening refactors with mandatory cohesion checks and test writing. Starts with an assessment — if the architecture is already healthy, say so and stop.

**Architecture vs Refactoring:** This skill handles structural changes — module boundaries, interfaces, testability. If the problem is code-level (complexity, duplication, naming, dead code within a well-bounded module), that's refactoring, not architecture — recommend handling it separately, calling the Skill tool with "refactor" if it is installed. The same applies after completing an architectural change: cleaning up the new module's internals is a separate refactoring pass.

## What is a deep module?

A **deep module** (John Ousterhout, "A Philosophy of Software Design") has a small interface hiding a large implementation. Deep modules are more testable, more AI-navigable, and let you test at the boundary instead of inside.

**Shallow** (before): `UserValidator` calls `isEmail()`, `isStrongPassword()`, `isUniqueUsername()` — each in its own file. The interface (3 functions) is as complex as the implementation. Tests mock the database to test `isUniqueUsername` in isolation, but the real bugs live in how these are composed during registration.

**Deep** (after): `UserRegistration` exposes `register(credentials) → Session | Error`. Internally it delegates to focused collaborators (validator, password hasher, session store), but callers don't see or configure those parts. Tests hit `register()` with a local-substitute database. The boundary is deep because callers interact with one method, not five scattered functions — but the module is cohesive (one responsibility: orchestrating registration) and internally decomposed.

## Guardrails

1. **Deep ≠ big.** A deep module hides complexity behind a small interface — it does not own every concern it touches. If describing the proposed module requires "and" more than once, it's a god object, not a deep module. Split it. Deep modules can delegate internally to focused collaborators while presenting a simple boundary.

2. **Separate, don't combine.** Deepening means consolidating a *single concept* scattered across many files. It does not mean merging unrelated concepts that happen to be called together. Before proposing a merge, ask: "Are these the same concern, or just co-located?"

3. **Architecture has a ceiling.** Not every codebase benefits from restructuring. Small projects (<20 files) with low coupling rarely need architectural intervention. The default verdict is **Healthy** — do not invent structural work.

4. **Every new element must pay for itself.** An interface, an argument, a class, a port — each one adds complexity, because someone has to learn it. To be a net gain it must remove more complexity than it introduces. Applies to anything this skill proposes creating.

## Process

### Step 1: Explore the codebase

#### 1a. Scope before you scan

Deepening a module pays off by making future changes to it easier, so weight the parts that actually keep changing. Decide *where* to look before you look:

- If the user named a direction — a module, a subsystem, a pain point — take it and skip the rest of this step.
- Otherwise, walk back a good stretch of `git log --oneline` to find the hot spots: the files and areas that keep coming up. Let those paths pull your attention first.
- If the changes are scattered with no clear hot spot, widen the net to the whole codebase.

Everything below operates on the scoped area, not necessarily the whole repository.

#### 1b. Map the structure

Before exploring for friction, produce a structural inventory of the scoped area:

- List all modules/packages in scope with approximate size (file count, rough line count)
- Trace the dependency graph: which modules import which
- Flag circular dependencies
- For each module: number of exported symbols, number of callers

This map is your baseline. It prevents incomplete analysis across multiple sessions. Record the scope you chose in 1a alongside it.

#### 1c. Explore for friction

Read `references/red-flags.md` first — it gives each structural defect a name, and naming the flag is half the diagnosis.

Use the Agent tool with subagent_type=Explore to navigate the codebase, guided by the map from 1b. Note where you experience friction:

- Where does understanding one concept require bouncing between many small files?
- Where are modules so shallow that the interface is nearly as complex as the implementation?
- Where is the same design decision encoded in two or more modules? This is **information leakage**, the most expensive structural defect to leave in place. Watch especially for *back-door* leakage: knowledge shared between modules without appearing in either interface, so nothing in the signatures reveals it.
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called?
- Where do tightly-coupled modules create integration risk in the seams between them?
- Which parts of the codebase are untested, or hard to test?

**Deletion test.** For anything you suspect is shallow, ask: would deleting it concentrate complexity, or just move it? "Concentrates" is the signal you want. "Moves it" means the module was a pass-through and the candidate is elsewhere.

**Repairing a leak.** Two options only: merge the modules that share the knowledge, or extract the knowledge into a new module — but extract only if that new module can have a *simple* interface. Otherwise you have moved the leak, not fixed it, and added a module to learn.

**Completeness check:** Every module in the map must be visited. Record what you skip and why — this prevents re-examination in future sessions.

**Skip these** — some things are shallow by design: thin adapters, DTOs/data classes with no logic, configuration loaders, one-liner wrappers.

### Step 2: Assess — Is Architectural Change Warranted?

**This step is mandatory.** Evaluate the codebase against these criteria:

- **Coupling** — Are modules tightly coupled (high fan-out, circular dependencies, shared mutable state)?
- **Cohesion** — Are modules internally cohesive (single responsibility)?
- **Testability** — Are modules hard to test due to structural issues (not code-level issues)?
- **Navigability** — Does understanding one concept require reading many files?

**Evidence rule:** every finding on these axes must name the symptom a reader actually experiences because of it:

- **Change amplification** — a simple change touches many places.
- **Cognitive load** — readers must hold a lot in their head to change anything safely.
- **Unknown unknowns** — readers cannot tell what they need to know. Worst of the three: the only check left is reading every line.

A finding that produces none of these three is a structural preference, not a problem. Drop it.

Produce a verdict:

| Verdict | Meaning | Action |
|---------|---------|--------|
| **Healthy** | Sound architecture, minor friction only | Tell the user. **Stop.** Suggest code-level cleanup instead — call the Skill tool with "refactor" if it is installed. |
| **Localized** | 1-2 areas have structural problems | Present only those candidates. Max 2 per session. |
| **Systemic** | Widespread structural issues | Present ranked candidates. Recommend tackling 2-3 per session. |

**Idempotency rule:** If this skill was recently run and the proposed changes were implemented, the verdict must be Healthy. Do not re-refactor the refactored code.

**Recorded decisions:** If the project keeps architecture decision records (`docs/adr/` or equivalent), read the ones covering the scoped area before producing the verdict. A candidate that contradicts a recorded decision is surfaced only when the friction is real enough to reopen it — say which record it contradicts and why it is worth revisiting. Do not list every refactor an ADR forbids.

**User override:** If the user gives a specific reason to proceed on Healthy code, scope strictly to their request.

### Step 3: Present candidates

Present a numbered list of deepening opportunities. For each candidate:

- **Cluster**: Which modules/concepts are involved
- **Single responsibility**: One sentence describing what this module does — no "and"
- **What it owns**: Logic that moves inside the boundary
- **What stays out**: Related logic that remains separate (and why)
- **Why they're coupled**: Shared types, call patterns, co-ownership of a concept
- **Dependency category**: Which of the four categories applies (see table below)
- **Test impact**: What existing tests would be replaced by boundary tests
- **Impact**: High / Medium / Low

**Cohesion check:** If a candidate's single-responsibility statement requires "and" more than once, split it into multiple candidates or reject it. The stronger form of the same test: if a complete-yet-simple description is hard to write at all, the design is wrong — the difficulty is the diagnosis, not a writing problem.

Do NOT propose interfaces yet. Put the choice to the user with `AskUserQuestion`: one option per candidate, the label naming the cluster, the description carrying the single-responsibility sentence and the impact rating. The tool's built-in "Other" covers "none of these".

### Step 4: Frame the problem space

Once the user picks a candidate, write a user-facing explanation:

- The constraints any new interface would need to satisfy
- The dependencies it would need to rely on
- The "what stays out" boundary from Step 3 — sub-agents must respect it
- A before/after code sketch showing the current shallow structure vs what a deep module boundary might look like

Show this to the user, then immediately proceed to Step 5.

### Step 5: Design multiple interfaces

Spawn 2-3 sub-agents in parallel using the Agent tool (2 for simple refactors, 3 for complex ones). Each must produce a **radically different** interface for the deepened module.

Each sub-agent brief should include:
- The specific files involved (paths + key line ranges)
- The coupling pattern (what's shared, what's duplicated)
- The dependency category and what it implies for testing
- What the deepened module should hide vs expose
- The "what stays out" boundary — sub-agents must not cross it
- The specific design constraint for this agent

Design constraints:
- Agent 1: "Minimize the interface — aim for 1-3 entry points max"
- Agent 2: "Maximize flexibility — support many use cases and extension"
- Agent 3: "Optimize for the most common caller — make the default case trivial"

Each sub-agent outputs:

1. Interface signature (types, methods, params)
2. Usage example showing how callers use it
3. What complexity it hides internally
4. Dependency strategy (how deps are handled — see Dependency Categories below)
5. Trade-offs
6. Cohesion assessment — does this interface own exactly one responsibility?

Present designs sequentially, then compare them in prose. **If any design creates a god object (multiple unrelated responsibilities behind one interface), reject it and explain why.**

Give your own recommendation: which design is strongest and why. Be opinionated.

### Step 6: Present refactoring plan

Once the user picks an interface (or accepts your recommendation), present a structured plan:

```
## Problem
- Which modules are shallow and tightly coupled
- What integration risk exists in the seams between them
- Why this makes the codebase harder to navigate and maintain

## Proposed Interface
- Interface signature (types, methods, params)
- Usage example showing how callers use it
- What complexity it hides internally

## Cohesion Statement
- Single responsibility: [one sentence, no "and"]
- What this module owns: [bulleted list]
- What stays out: [bulleted list with reasons]

## Dependency Strategy
Which category applies and how dependencies are handled.

## Testing Strategy
- **New boundary tests**: behaviors to verify at the new interface
- **Old tests to update/remove**: tests on removed shallow modules
- **Test environment needs**: local stand-ins or adapters
Note: Tests are written in Step 7, not here.

The core principle: **replace, don't layer.** Old unit tests on shallow
modules are waste once boundary tests exist — delete them. Write new tests
at the deepened module's interface boundary. Tests assert on observable
outcomes through the public interface, not internal state.

## Migration Strategy
Incremental (old and new coexist temporarily) or single switchover?
For high-traffic modules, prefer incremental with a deprecation path.

## Implementation Steps
Concrete, ordered steps. Each names files to modify, what to change,
and any caller migration. Include estimated scope.
```

Present this plan through plan mode and wait for approval. Step 7 edits production code — do not start it until the plan is approved.

### Step 7: Implement and Test

**Phase A: Write boundary tests first.**

Before modifying production code, write tests for the new module's interface:

- Cover behaviors listed in the Testing Strategy from Step 6
- Use real dependencies where possible (in-process, local-substitutable); mock only remote/external
- For compiled languages: write interface type/signature stubs first, then tests
- Tests may initially fail — that's expected

**Critical:** When a test for *existing* behavior fails unexpectedly, read the actual code to understand real behavior before correcting the test expectation. Don't spec tests from your understanding of the code — spec them from the code itself.

**Phase B: Implement the refactoring.**

Follow the Implementation Steps from the plan. After each step:
1. Run new boundary tests — they should progressively pass
2. Run existing tests — they should continue passing

After all steps are complete:
- Delete tests marked for removal in the plan
- Run the full test suite
- All tests must pass before proceeding

### Step 8: Verify and Close

1. Re-run the assessment from Step 2, scoped to the changed modules only
2. The verdict for the changed area should be **Healthy**
3. If still problematic for the *same* reasons, diagnose what went wrong — do not propose another round of the same skill
4. Record a summary: what changed, what was tested, current state — this serves as context for future sessions

## Dependency Categories

| Category | Example | Test strategy |
|----------|---------|---------------|
| **In-process** | Pure computation, in-memory state, no I/O | Merge modules, test directly |
| **Local-substitutable** | Postgres → PGLite, filesystem → in-memory | Test with local stand-in |
| **Remote but owned** | Internal microservices, own APIs | Ports & adapters; in-memory adapter for tests |
| **True external** | Stripe, Twilio, third-party APIs | Mock at the boundary via injected port |

**Seam discipline:** one adapter means a hypothetical seam, two means a real one. Do not introduce a port unless at least two adapters are justified — typically production plus test. A single-adapter seam is indirection with no payoff, and Guardrail 4 rejects it.
