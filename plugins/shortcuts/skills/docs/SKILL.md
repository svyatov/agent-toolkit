---
name: docs
description: Bring README, CHANGELOG, CLAUDE.md, and manifests in line with the current changes
license: MIT
disable-model-invocation: true
argument-hint: [base ref, e.g. main]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git symbolic-ref:*)
---

Branch and status: !`git status --short --branch`
Changed files: !`git diff HEAD --stat || true`

Sync the documentation with the code. Scope: the uncommitted changes plus the commits since
$ARGUMENTS. Empty means the uncommitted changes, or, when the tree is clean, this branch's commits
since the default branch.

1. Read the diff. List every user-visible change: commands, flags, config keys, defaults, public API,
   install steps, version.
2. For each one, find where the docs describe it: README, CHANGELOG Unreleased, CLAUDE.md or
   AGENTS.md, docs/, manifests (gemspec, package.json, plugin.json), help text. Update what is now
   wrong or missing. Delete what describes removed things.
3. Verify every command and path you leave in the docs exists in the repository.
4. Do not add sections for things the docs never covered unless the change introduced them. Do not
   restyle prose you did not need to touch.
5. Follow the repository's documentation and wording conventions.
6. Report one line per file: what changed. Say plainly when the docs were already correct. Do not
   commit.
