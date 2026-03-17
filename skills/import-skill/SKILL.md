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

## Process

### Step 1: Get Source

Ask the user for the source. Accept one of:

1. **One GitHub directory URL** — single skill copy
2. **Multiple GitHub directory URLs** — multi-skill merge
3. **Pasted content** — user pastes SKILL.md content (and optionally other files) directly

Expected URL format: `https://github.com/{owner}/{repo}/tree/{branch}/{path}`

If the URL doesn't match this pattern, ask for clarification.

### Step 2: Get New Skill Name

Ask the user for a name. Validate:

- Lowercase kebab-case (letters, numbers, hyphens)
- Doesn't already exist in the `skills/` directory
- Not empty

If the name conflicts with an existing skill, list existing skills and ask for a different name.

### Step 3: Check License Compatibility

This repo is MIT-licensed. Any imported code must be under a compatible license — otherwise incorporating it would violate the source's license terms or force a license change on this repo.

For each unique `{owner}/{repo}`, fetch the repo metadata:

```
GET https://api.github.com/repos/{owner}/{repo}
```

Extract `license.spdx_id` from the response.

**Compatible licenses** (permissive, safe to include in an MIT project):

`MIT`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, `0BSD`, `Unlicense`, `CC0-1.0`, `WTFPL`, `Zlib`, `BSL-1.0`

**Decision logic:**

| Result | Action |
|--------|--------|
| SPDX ID is in the compatible list | Proceed. Record the license. |
| SPDX ID is `NOASSERTION` or `null` / missing | **Stop.** Tell the user: no detectable license means all rights reserved by default — copying is not permitted. Offer to skip this source. |
| SPDX ID is anything else (GPL, LGPL, AGPL, MPL, CC-BY-SA, CC-BY-NC, etc.) | **Stop.** Tell the user the license (`{spdx_id}`) is incompatible with MIT. Explain briefly why (e.g., copyleft would require relicensing this repo). Offer to skip this source. |

If the user explicitly asks to override (e.g., "I have permission from the author"), proceed but record the override in `sources.json` — set `"license_override": true` and `"license_override_reason"` with the user's stated justification.

Also look for a LICENSE or NOTICE file in the fetched directory (or repo root) to capture the copyright line for `sources.json`.

### Step 4: Fetch from GitHub

For each URL, parse it to extract `owner`, `repo`, `branch`, and `path`.

**Get commit SHA:**

```
GET https://api.github.com/repos/{owner}/{repo}/commits?sha={branch}&per_page=1
```

Extract `[0].sha` from the JSON response.

**List directory contents:**

```
GET https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}
```

Returns a JSON array. Each entry has `name`, `type` (`"file"` or `"dir"`), and `download_url`.

**Fetch files recursively:**

- Files: fetch content via `download_url`
- Directories: recurse by calling the contents API on that subpath

Collect all files with their paths relative to the skill root.

**Error handling:**

- 404 → the URL is invalid or the directory doesn't exist, report and stop
- 403 / rate limit → inform the user they've hit GitHub's rate limit, suggest waiting or retry later
- Individual file fetch failure → report which file failed, ask whether to continue without it

### Step 5: Write Files

**Single skill (copy):**

Write all fetched files into `skills/{new-name}/`, preserving directory structure. Update the `name:` field in `SKILL.md` frontmatter to match the new skill name.

**Multiple skills (merge):**

1. Read all fetched `SKILL.md` files
2. Understand each skill's purpose, capabilities, and process
3. Synthesize a new `SKILL.md` that combines the capabilities — merged description, unified process steps, deduplicated where they overlap
4. Copy all supporting files (`references/`, `scripts/`, `assets/`) from all sources
5. **On filename conflicts:** suggest a descriptive alternative name and ask the user to confirm or provide their own. Don't just mechanically prefix — pick a name that makes sense for what the file contains.

**Pasted content:**

Ask the user which file each pasted block represents (default: `SKILL.md`). Write files into `skills/{new-name}/`. Update the `name:` field in frontmatter.

### Step 6: Create `sources.json`

Write `skills/{new-name}/sources.json`:

```json
{
  "created_at": "2026-03-17T12:00:00.000Z",
  "type": "copy",
  "sources": [
    {
      "url": "https://github.com/user/repo/tree/main/skills/example",
      "repository": "user/repo",
      "path": "skills/example",
      "branch": "main",
      "sha": "abc123...",
      "original_name": "example",
      "fetched_at": "2026-03-17T12:00:00.000Z"
    }
  ],
  "license": "MIT",
  "copyright": "Copyright (c) 2025 Example Author",
  "license_override": false,
  "license_override_reason": null
}
```

- `type`: `"copy"` for single source, `"merge"` for multiple, `"paste"` for pasted content
- `sources`: array of source entries (empty for `"paste"`)
- `sha`: full commit SHA at fetch time — used to check for upstream updates later
- `license`: SPDX identifier from the source repo (e.g., `"MIT"`, `"Apache-2.0"`)
- `copyright`: copyright line from the source repo's LICENSE file
- `license_override` / `license_override_reason`: only present when the user overrode an incompatible or missing license check

### Step 7: Register in Plugin

Create a symlink:

```bash
ln -s ../../../skills/{new-name} plugins/leo/skills/{new-name}
```

Verify it resolves:

```bash
ls -la plugins/leo/skills/{new-name}
```

### Step 8: Verify and Report

Confirm:
1. `skills/{new-name}/SKILL.md` exists with correct frontmatter
2. `skills/{new-name}/sources.json` is valid JSON
3. Symlink resolves correctly

Present a summary: skill name, source(s), files created, symlink status.

### Step 9: Post-Import Review

After the import is complete, invoke the `skill-creator:skill-creator` skill to analyze the imported skill. The goal is to review the skill and suggest improvements — simplifications, better structure, clearer instructions, or anything else that would make the skill more effective.

**Important:** present all suggested changes to the user and wait for explicit confirmation before applying anything. Do not auto-apply improvements.

## Edge Cases

- **No SKILL.md in fetched directory** — warn the user. Ask whether to treat all files as references and create a minimal SKILL.md, or abort.
- **Large files (>1MB)** — warn and ask whether to include.
- **Binary files** — detect by extension, warn, and ask whether to include.
