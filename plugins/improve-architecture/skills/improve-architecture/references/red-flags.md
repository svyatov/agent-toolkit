# Structural red flags

Named diagnostics for Step 1c. Naming the flag is half the diagnosis — use
these names verbatim when recording friction and when writing candidates in
Step 3.

These are the structural flags only. Code-level flags (repetition, vague
names, comments that repeat the code, nonobvious code) belong to the
`refactor` skill, not here.

| Flag | What it looks like |
|---|---|
| **Shallow Module** | Interface complexity ≈ implementation complexity. Trivial wrapper methods, single-line classes, anything where the interface costs more to learn than it saves. |
| **Information Leakage** | The same design decision encoded in two or more modules — a file format known to both reader and writer, a parameter shape duplicated across parser and serializer. The most expensive flag on this list. |
| **Back-door Leakage** | Knowledge shared between modules without appearing in any interface. More dangerous than the visible kind, because nothing in the signatures reveals it. |
| **Temporal Decomposition** | Modules carved by execution order ("first read, then parse, then write") instead of by knowledge, so the same knowledge lives in several stages. |
| **Overexposure** | The common path forces callers to learn rarely-used features before they can do the ordinary thing. |
| **Pass-Through Method** | A method that does nothing but forward its arguments to another method with the same signature. |
| **Special-General Mixture** | Special-purpose code embedded inside a general-purpose mechanism, leaking one use case into the mechanism everyone shares. |
| **Conjoined Methods** | Two methods that cannot be understood without reading each other. They are one module wearing two names. |
| **Hard to Describe** | A complete-yet-simple description of the module is hard to write. The difficulty is the diagnosis, not a writing problem. |
| **Hard to Pick Name** | The concept resists naming because it is muddled — usually two things in one. Splitting it produces two things that name themselves. |

## Classitis

"Classes are good, so more classes are better" produces many small shallow
classes whose interfaces sum into system-wide complexity. This is the failure
mode this skill exists to correct: splitting an already-shallow module further
is the wrong direction. This does not exempt an over-broad module — Guardrail 1
still splits a proposed module that owns more than one responsibility.

Length is rarely a reason to split. A long function with a simple signature and
clear internal blocks is deep — leave it alone.

## Reading the flags

A single flag on a single module is not a candidate. Look for clusters: several
flags landing on the same group of modules is what makes a Step 3 candidate.
One pass-through method is noise; a layer of them is a layer with nothing in it.
