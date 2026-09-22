---
name: adopt-release
description: 'Adopt a new release of a library, runtime, or tool: read every change since the version this project is on, match each one against what the project uses, and list what must change, what to adopt, and what to watch'
license: MIT
compatibility: Requires network access, curl, and an authenticated gh CLI for GitHub-hosted release notes
disable-model-invocation: true
argument-hint: '<library, runtime, or tool> [target version; empty means latest]'
allowed-tools: Bash(curl:*), Bash(gh release:*), Bash(gh api:*), Bash(grep:*), Bash(find:*), Read
---

# Adopt release

A release can carry hundreds of changes, and only a few touch this project. Find those few, prove each one against a file, and count the rest.

## Step 1: Pin the range

The target is the version in $ARGUMENTS, else the latest stable release upstream publishes.

The start is the version this project was last adapted to. Read it from the project's pin: lockfile, manifest constraint, `.tool-versions`, `.nvmrc`, `engines`, Docker base image, CI matrix. A tool the user runs outside the project (an agent host, a CLI) often has no pin, and its installed version is already the new one: ask the user once for the start version or a date, and take every release after it.

Done when both ends are exact versions.

## Step 2: Map the surface

The **surface** is every point where this project touches the tool. Build it before you read any release notes: it is the filter for Step 4.

- **Pin sites**: every file that names the version, including type packages such as `@types/node` and docs that state a minimum.
- **Config**: the tool's config files and every key the project sets. For a tool the user runs, include its user-level directories (`~/.claude/`; `~/.codex/` and `~/.agents/skills/` for Codex) and everything the project ships to it: skills and their frontmatter, hooks, plugin manifests, `AGENTS.md`, MCP config.
- **API**: imported modules and symbols, CLI commands and flags in scripts and CI, env vars, file formats the project reads or writes.
- **Workarounds**: code and comments that exist because of the tool: `workaround`, `hack`, `until`, links to the upstream issue tracker, skipped tests, versions held back.

When the project does not make the tool's config locations obvious, take them from the tool's own docs. Done when every surface item has a file path.

## Step 3: Collect the changes

Read upstream's own record of every release in the range, most trusted first: the migration or upgrade guide (a major usually has one), `CHANGELOG.md` in the repository, GitHub releases (`gh release view <tag> --repo <owner/repo>`), then the docs' what's-new page. Fetch raw text with `curl` or `gh api`, because WebFetch summarizes and drops lines. A version whose notes you cannot find goes in the report as unread; memory is not a source.

Done when every version after the start, up to and including the target, has its notes in hand or is named as unread.

## Step 4: Triage against the surface

Put every change entry in exactly one bucket:

| Bucket | Means |
|---|---|
| **Must** | Breaks or removes something on the surface: a removed or renamed API, flag, or config key; a changed default the project relies on; a dropped runtime or platform the project runs on. |
| **Adopt** | New behavior that replaces something the project does by hand, or a fix for the bug behind a workaround, so the workaround can go. |
| **Watch** | A deprecation of something on the surface that still works, or a change whose effect reading alone cannot settle. |
| **Skip** | Touches nothing on the surface. Counted, not listed. |

A range with more than about 50 entries: split it by version into chunks and dispatch one subagent per chunk, all in one message. Give each the Step 2 surface, its version range, and the source URLs. Each returns its Must, Adopt, and Watch entries, every one with the quoted release-note line and its version, plus a Skip count.

Done when every entry sits in one bucket.

## Step 5: Prove each item

For every Must and Adopt item, open the project file it touches and confirm the match: the release note says X, and `path:line` does X. An item that fails the check moves to Skip; one the file cannot settle moves to Watch. Then check the target's own requirements (runtime minimum, peer dependencies, OS support) against the project.

Done when every Must and Adopt item carries a quote, its version, and a `path:line`.

## Step 6: Report and apply

```markdown
## <tool> <start> → <target>

**Verdict:** <nothing to change | N changes needed, K worth adopting>
Read R releases, E entries, skipped S. Unread: <versions or none>.

### Must
- M1 `path:line`: <what to change>. <version>: "<quote>" <link>

### Adopt
- A1 `path:line`: <what to add or delete>. <version>: "<quote>" <link>

### Watch
- W1 <what, and what turns it into a Must>. <version>: "<quote>"

### Pin sites
- `path`: <old> → <target>
```

An empty section reads "none". Ask which items to apply. Apply the chosen ones and bump the pin sites, then run the project's tests and linters and report the result.
