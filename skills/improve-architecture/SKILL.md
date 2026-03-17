---
name: improve-architecture
description: Explore a codebase to find opportunities for architectural improvement, focusing on making the codebase more testable by deepening shallow modules. Use when user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, reduce complexity, simplify module boundaries, or make a codebase more AI-navigable. Also triggers on: "clean up the architecture", "too many small files", "these modules are tangled", "hard to test", "refactor for testability".
---

# Improve Codebase Architecture

Explore a codebase like an AI would, surface architectural friction, discover opportunities for improving testability, and propose module-deepening refactors as actionable plans.

## What is a deep module?

A **deep module** (John Ousterhout, "A Philosophy of Software Design") has a small interface hiding a large implementation. Deep modules are more testable, more AI-navigable, and let you test at the boundary instead of inside.

**Shallow** (before): `UserValidator` calls `isEmail()`, `isStrongPassword()`, `isUniqueUsername()` — each in its own file. The interface (3 functions) is as complex as the implementation. Tests mock the database to test `isUniqueUsername` in isolation, but the real bugs live in how these are composed during registration.

**Deep** (after): `UserRegistration` owns validation, uniqueness checking, password hashing, and session creation. It exposes `register(credentials) → Session | Error`. Tests hit the boundary with a real (or local-substitute) database. Internal refactors don't break tests.

## Process

### 1. Explore the codebase

Start by understanding the project's size. For small projects (<50 files), explore broadly. For larger codebases, ask the user which area to focus on.

Use the Agent tool with subagent_type=Explore to navigate the codebase naturally. Do NOT follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small files?
- Where are modules so shallow that the interface is nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called?
- Where do tightly-coupled modules create integration risk in the seams between them?
- Which parts of the codebase are untested, or hard to test?

The friction you encounter IS the signal.

**Skip these** — some things are shallow by design and should stay that way: thin adapters that translate between formats, DTOs/data classes with no logic, configuration loaders, one-liner wrappers. Deepening these would add unnecessary complexity.

### 2. Present candidates

Present a numbered list of deepening opportunities. For each candidate, show:

- **Cluster**: Which modules/concepts are involved
- **Why they're coupled**: Shared types, call patterns, co-ownership of a concept
- **Dependency category**: Which of the four categories applies (see table below)
- **Test impact**: What existing tests would be replaced by boundary tests
- **Impact**: High / Medium / Low — based on how many callers are affected, how much test coverage improves, and how much navigability friction it removes

Do NOT propose interfaces yet. Ask the user: "Which of these would you like to explore?"

### 3. Frame the problem space

Once the user picks a candidate, write a user-facing explanation of the problem space:

- The constraints any new interface would need to satisfy
- The dependencies it would need to rely on
- A before/after code sketch showing the current shallow structure vs what a deep module boundary might look like — this is not a final proposal, just a way to ground the constraints

Show this to the user, then immediately proceed to Step 4. The user reads and thinks about the problem while the sub-agents work in parallel.

### 4. Design multiple interfaces

Spawn 2-3 sub-agents in parallel using the Agent tool (2 for simple refactors, 3 for complex ones). Each must produce a **radically different** interface for the deepened module.

Each sub-agent brief should include:
- The specific files involved (paths + key line ranges)
- The coupling pattern (what's shared, what's duplicated)
- The dependency category and what it implies for testing
- What the deepened module should hide vs expose
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

Present designs sequentially, then compare them in prose.

After comparing, give your own recommendation: which design you think is strongest and why. If elements from different designs would combine well, propose a hybrid. Be opinionated — the user wants a strong read, not just a menu.

### 5. Present refactoring plan

Once the user picks an interface (or accepts your recommendation), present a structured refactoring plan using the template below. The plan should be concrete and actionable — include specific file paths, implementation order, and testing steps.

After presenting the plan, ask the user if they'd like to proceed with execution. If yes, begin implementing the first step.

## Plan Template

```
## Problem
- Which modules are shallow and tightly coupled
- What integration risk exists in the seams between them
- Why this makes the codebase harder to navigate and maintain

## Proposed Interface
- Interface signature (types, methods, params)
- Usage example showing how callers use it
- What complexity it hides internally

## Dependency Strategy
Which category applies and how dependencies are handled (see Dependency
Categories table).

## Testing Strategy
- **New boundary tests to write**: behaviors to verify at the interface
- **Old tests to delete**: shallow module tests that become redundant
- **Test environment needs**: any local stand-ins or adapters required

If the codebase has no existing tests, skip "Old tests to delete" and focus on
establishing the first boundary tests. This is one of the highest-value outcomes
of deepening — the new module gives you a natural, testable boundary that didn't
exist before.

The core testing principle: **replace, don't layer.** Old unit tests on shallow
modules are waste once boundary tests exist — delete them. Write new tests at
the deepened module's interface boundary. Tests assert on observable outcomes
through the public interface, not internal state. Tests should survive internal
refactors — they describe behavior, not implementation.

## Migration Strategy
Can this be done incrementally (old and new interfaces coexist temporarily) or
does it require a single switchover? For high-traffic modules, prefer incremental
migration with a deprecation path.

## Implementation Steps
List concrete, ordered steps specific to this refactor. Each step should name
the file(s) to modify, what to change, and any migration needed for callers.
Include estimated scope (e.g., "~3 files, ~50 lines changed").
```

## Dependency Categories

| Category | Example | Test strategy |
|----------|---------|---------------|
| **In-process** | Pure computation, in-memory state, no I/O | Merge modules, test directly |
| **Local-substitutable** | Postgres → PGLite, filesystem → in-memory | Test with local stand-in |
| **Remote but owned** | Internal microservices, own APIs | Ports & adapters; in-memory adapter for tests |
| **True external** | Stripe, Twilio, third-party APIs | Mock at the boundary via injected port |
