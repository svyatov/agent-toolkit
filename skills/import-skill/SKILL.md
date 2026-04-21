---
name: import-skill
description: >
  Import skills from GitHub repositories into the local toolkit. Supports copying a single skill
  from a GitHub directory URL or merging multiple skills into one. Also accepts pasted skill content.
  Use when the user asks to: (1) import, add, or copy a skill from GitHub, (2) merge multiple skills
  into one, (3) paste skill content to create a new local skill. Triggers on: "import skill",
  "add skill from", "copy skill", "merge skills", "fetch skill", "grab skill", "skill from GitHub".
---

# Import Skill

Import skills from GitHub directory URLs or pasted content. Supports single-skill copy (preserves full directory structure) and multi-skill merge (intelligently combines into one).

Only public GitHub repositories are supported.

## Speed Guidelines

This workflow involves multiple GitHub API calls and file writes. Minimize turns by following these rules:

- **Batch independent API calls** into single turns with parallel Bash calls
- **Use `curl`** for all GitHub content fetches — WebFetch summarizes HTML instead of returning raw content, making it unsuitable for fetching source files
- **Combine download + write** with `curl -s URL > path` instead of fetch-then-write-separately

## Process

### Step 1: Parse Source

Accept one of:

1. **One GitHub directory URL** — single skill copy
2. **Multiple GitHub directory URLs** — multi-skill merge
3. **Pasted content** — user pastes SKILL.md content (and optionally other files) directly

Expected URL format: `https://github.com/{owner}/{repo}/tree/{branch}/{path}`

Parse to extract `owner`, `repo`, `branch`, and `path`. If the format doesn't match, ask for clarification.

For pasted content, skip to Step 4.

### Step 2: Parallel Discovery

**Launch ALL of these in a single turn using parallel tool calls:**

```bash
# 1. Commit SHA
curl -s "https://api.github.com/repos/{owner}/{repo}/commits?sha={branch}&per_page=1" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['sha'])"

# 2. Directory listing
curl -s "https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}"

# 3. License check
curl -s "https://api.github.com/repos/{owner}/{repo}/license" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('license',{}).get('spdx_id','unknown'))"
```

```
# 4. Existing skills (Glob tool, parallel with the above)
Glob: skills/*/SKILL.md
```

If the directory listing contains subdirectories (`"type": "dir"`), list their contents too — add parallel curl calls for each subdirectory in the **same turn** or the next turn.

**Error handling:**
- 404 → invalid URL or directory doesn't exist, report and stop
- 403 / rate limit → inform the user, suggest waiting or retrying later

### Step 3: Validate License & Confirm Name

**License validation** — this repo is MIT-licensed, so imported code must be under a compatible license:

Compatible: `MIT`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, `0BSD`, `Unlicense`, `CC0-1.0`, `WTFPL`, `Zlib`, `BSL-1.0`

| Result | Action |
|--------|--------|
| SPDX ID is in the compatible list | Proceed. Record the license. |
| `NOASSERTION` or `null` / missing | **Stop.** No detectable license means all rights reserved. Offer to skip this source. |
| Anything else (GPL, LGPL, AGPL, MPL, etc.) | **Stop.** Explain the license is incompatible with MIT. Offer to skip. |

If the user explicitly overrides (e.g., "I have permission from the author"), proceed but record `"license_override": true` and the user's reason in `sources.json`.

**Name resolution** — always ask the user for the skill name via AskUserQuestion. Offer the original name (extracted from the URL path) as the recommended option. Validate: lowercase kebab-case, no conflict with existing skills, not empty.

### Step 4: Download & Write Files

**Create the directory structure, then download ALL files directly to disk in a single turn using parallel Bash calls:**

```bash
# First: create directories
mkdir -p skills/{name}/references skills/{name}/.claude-plugin  # include any subdirectories found in Step 2

# Then: parallel downloads (one Bash call per file)
curl -s "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{full-path-to-file}" > skills/{name}/{relative-path}
```

Use `download_url` values from the directory listing (these point to `raw.githubusercontent.com`) for each file. Each curl download should be a separate parallel Bash tool call so they execute concurrently.

**After writing:** if the skill name differs from the original, update the `name:` field in SKILL.md frontmatter using the Edit tool.

**For merge (multiple sources):**

1. Download all files from all sources first
2. Read the fetched SKILL.md files
3. Synthesize a merged SKILL.md combining capabilities — merged description, unified process steps, deduplicated where they overlap
4. Copy all supporting files (`references/`, `scripts/`, `assets/`) from all sources
5. On filename conflicts: suggest a descriptive alternative name, ask user to confirm

### Step 5: Finalize

Each skill is its own installable plugin. Finalizing writes three things: `sources.json` (provenance), `.claude-plugin/plugin.json` (plugin manifest), and a new entry in the top-level `.claude-plugin/marketplace.json`.

**Do ALL of these in a single turn using parallel tool calls:**

1. **Write `sources.json`** (Write tool):

```json
{
  "created_at": "YYYY-MM-DDTHH:mm:ss.000Z",
  "type": "copy",
  "sources": [
    {
      "url": "https://github.com/{owner}/{repo}/tree/{branch}/{path}",
      "repository": "{owner}/{repo}",
      "path": "{path}",
      "branch": "{branch}",
      "sha": "{full-commit-sha}",
      "original_name": "{original-name}",
      "fetched_at": "YYYY-MM-DDTHH:mm:ss.000Z"
    }
  ],
  "license": "{spdx-id}",
  "copyright": "Copyright (c) {owner}",
  "license_override": false,
  "license_override_reason": null
}
```

- `type`: `"copy"` for single source, `"merge"` for multiple, `"paste"` for pasted content
- `sha`: full commit SHA at fetch time — used to check for upstream updates later

2. **Write `skills/{name}/.claude-plugin/plugin.json`** (Write tool) using the per-skill manifest template:

```json
{
  "name": "{name}",
  "description": "{one-line description taken from SKILL.md frontmatter}",
  "version": "1.0.0",
  "author": {
    "name": "Leonid Svyatov",
    "email": "leonid@svyatov.com",
    "url": "https://www.svyatov.com"
  },
  "homepage": "https://github.com/svyatov/agent-toolkit",
  "repository": "https://github.com/svyatov/agent-toolkit",
  "license": "MIT",
  "skills": ["./"]
}
```

- `"skills": ["./"]` tells Claude Code the plugin root itself is the skill directory — `SKILL.md` sits next to `.claude-plugin/`. The invocation name comes from the `name:` in `SKILL.md` frontmatter.
- New plugins start at `1.0.0`. Version bumps happen per-skill in that skill's own `plugin.json`.

3. **Append new plugin entry to `.claude-plugin/marketplace.json`** (Read tool, then Edit tool) — add an object to the top-level `plugins` array:

```json
{
  "name": "{name}",
  "source": "{name}",
  "description": "{one-line description — same as plugin.json}",
  "category": "productivity",
  "tags": ["{relevant}", "{tags}"]
}
```

Marketplace `metadata.pluginRoot` is `./skills`, so `source` is just the bare `{name}` (no `./` prefix — the `./` form bypasses `pluginRoot` and resolves from marketplace root). Pick 3–5 discovery tags that match the skill's domain; reuse `productivity` for most skills, `writing` for editing/copy skills.

4. **Verify JSON** (Bash call, parallel with above):
   ```bash
   python3 -c "import json; json.load(open('skills/{name}/sources.json')); json.load(open('skills/{name}/.claude-plugin/plugin.json')); json.load(open('.claude-plugin/marketplace.json')); print('all JSON valid')"
   ```

Present a summary: skill name, source(s), files created, license, plugin manifest path, marketplace entry added.

### Step 6: Post-Import Review

Invoke the `skill-creator:skill-creator` skill to analyze the imported skill and suggest improvements — simplifications, better structure, clearer instructions, or anything else that would make the skill more effective.

**Important:** Present all suggested changes to the user and wait for explicit confirmation before applying anything. Do not auto-apply improvements.

## Edge Cases

- **No SKILL.md in fetched directory** — warn. Ask whether to treat all files as references and create a minimal SKILL.md, or abort.
- **Large files (>1MB)** — warn and ask whether to include.
- **Binary files** — detect by extension, warn, and ask whether to include.
- **Nested subdirectories** — recurse: list contents via API, then download all files in parallel.
