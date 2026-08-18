---
description: How to pin the current behavior of untested code before refactoring it. Read when Step 3.5 finds no tests over the target.
---

# Characterization Tests

A characterization test does not describe what the code *should* do. It records what the code
*does*, so that a refactor that changes it fails loudly.

## The Recipe

You do not need to read the code to work out the expected value. Let the test tell you.

1. Call the target in a test harness with a realistic input.
2. Assert something you know is wrong: `expect(total).toBe(-1)`.
3. Run it. The failure message contains the actual value.
4. Replace the absurd value with the observed one. The test now pins current behavior.

Repeat for each input class that reaches a different branch. This is faster than reading the code
and it cannot be fooled by a misleading name.

## What To Pin

- **Test at the public interface**, not at the internals you are about to move. A test bound to a
  private helper breaks during the refactor and proves nothing.
- **Cover the branches you are about to touch.** Coverage over the blast radius is what matters;
  the repository's overall percentage is not the number to look at.
- **Include the ugly inputs**: empty, zero, negative, null, the boundary, the duplicate. That is
  where behavior is most likely to shift unnoticed.
- **Errors are behavior too.** Pin the exception type and the message if callers can see them.

## When You Find A Bug

You will. The pinned value will sometimes be plainly wrong.

Do not fix it here. Pin the wrong behavior, add a comment saying it is wrong, and raise it
separately. Callers may already depend on it, and a bug fix smuggled into a refactor is exactly
the mix this skill exists to prevent. Fixing it is a separate change, with its own commit, after
the refactor lands.

## When To Stop

Enough is when a change to the code you are about to restructure makes at least one test fail.
Test that: break the target on purpose, confirm something goes red, undo it. A safety net that
catches nothing is worse than none, because it feels like coverage.

## Flaky Tests

Fix or quarantine a flaky test before starting. An unreliable net cannot tell you whether your
refactor broke something, and a red run you have learned to ignore is the same as no run.
