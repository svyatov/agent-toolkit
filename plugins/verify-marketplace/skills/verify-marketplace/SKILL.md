---
name: verify-marketplace
description: 'Verify plugin marketplaces for Claude Code, Codex, Cursor IDE and CLI, and OMP against live official guidance: catalogs, manifests, layout, installation, and updates.'
license: MIT
compatibility: >
  Requires curl and network access to official Claude Code, Codex, Cursor and
  OMP documentation and repositories. Uses available host CLIs only for their
  documented inspection scopes, never requires new CLIs or dependencies.
  OMP source pinning uses the available GitHub CLI (gh); if unavailable,
  dependent checks are Not checked.
  Read-only until the user approves a fix. No install.
allowed-tools: Bash Read Grep Glob Edit
disable-model-invocation: true
argument-hint: "[repo path, marketplace.json, or owner/repo]"
---

# Verify Marketplace

Marketplace rules change faster than any repo that copies them: reserved names
appear, path rules tighten, Codex adds a manifest format. So this skill stores
none of the normative platform rules. Fetch applicable first-party guidance on
each run; every finding quotes its governing fetched evidence.

Four axes:

- **A. Catalog**: each `marketplace.json` conforms and agrees with the plugins on disk.
- **B. Plugins**: each plugin manifest and layout conforms for the hosts it targets.
- **C. Repository**: README, license, CI, and cross-file consistency.
- **D. Currency**: the fields, commands, and URLs the repo relies on still exist upstream.

SKILL.md bodies are out of scope. That is `verify-skill`, and Step 5 hands off
to it.

## Step 1: Resolve the target

| Trigger | Scope |
|---|---|
| A repo path, or no argument and the cwd holds a catalog | That repo |
| A path to a `marketplace.json` | Resolve the root above `.claude-plugin/`, `.agents/plugins/`, `.cursor-plugin/` or `.omp-plugin/` |
| `owner/repo` | `git clone --depth 1` into a temp dir, verify, delete the clone |
| No argument, no catalog, and a plugin manifest in the cwd | That plugin: Axes B to D, and Axis A reports the catalog it needs before anyone can install it |
| No argument, no catalog, and no plugin manifest in the cwd | Ask which repo using the active host's question tool, or chat |

Inventory the repo using available file/search tools, in one batch:

| File | Meaning |
|---|---|
| `.claude-plugin/marketplace.json` | Claude Code catalog. Codex also reads it, as a compatible catalog |
| `.agents/plugins/marketplace.json` | Codex native catalog |
| `.cursor-plugin/marketplace.json` | Cursor native catalog |
| `.omp-plugin/marketplace.json` | OMP native catalog, before its Claude fallback |
| `<plugin>/.claude-plugin/plugin.json` | Claude Code manifest. Codex also accepts it |
| `<plugin>/.codex-plugin/plugin.json` | Codex compatibility manifest |
| `<plugin>/.cursor-plugin/plugin.json` | Cursor native manifest |
| `<plugin>/.omp-plugin/plugin.json` | OMP native manifest; component-specific behavior still needs evidence |
| `<plugin>/plugin.json` naming an agent-plugins.org `$schema` | Portable Agent Plugins manifest |

Select hosts from catalogs/packages, explicit requests and repository support
claims. A Claude catalog selects Claude Code, existing Codex compatibility
checks and OMP's documented fallback checks. Native-only Cursor or OMP catalogs
do not require foreign catalogs. Cursor requires its native catalog, a portable
package, explicit request or support claim; imported Claude-plugin support alone
does not establish general Claude marketplace acceptance. Plain "Cursor" selects
separate IDE and CLI targets.

Classify each selected host's effective catalog and package/provider before
applying rules. OMP uses native before Claude fallback, without merging.
Cursor uses its native catalog; undocumented mixed-manifest precedence is
Not checked. Read [Cursor's live map](references/cursor.md) when either Cursor
surface is selected and [OMP's live map](references/omp.md) when OMP is selected.
These independently installed references define the applicable fetch/check branches.

Codex-native-only constraints on a compatible Claude catalog remain Consider
where the fetched Codex guidance supports that distinction; suggest a native
Codex catalog rather than inserting unknown fields into the shared Claude one.
Compare plugin sets, descriptions and versions across hosts only where equivalent
listings are claimed. Intentional audience-specific listings may differ.
Inventory entries and orphan directories within each host's effective source
roots, not a union that turns another host's directories into orphans.

Record the repo's last change date with `git log -1 --format=%cs`. Step 2
needs it. Uncommitted changes count as newer than any commit, and a plugin
with no history has no version drift to check.

## Step 2: Fetch the current guidance

Fetch the selected groups in **one turn with parallel calls**, into temporary
files. Use the active host's available fetch/read/search tools. Fetch these
Claude and Codex sources only for their selected checks:

```bash
curl -sSL -o "$T/cc-marketplaces.md" https://code.claude.com/docs/en/plugin-marketplaces.md
curl -sSL -o "$T/cc-reference.md"    https://code.claude.com/docs/en/plugins-reference.md
curl -sSL -o "$T/codex-build.md"     https://developers.openai.com/plugins/build/plugins.md
curl -sSL -o "$T/codex-errors.md"    https://developers.openai.com/plugins/deploy/submission-errors.md
```

Fetch Cursor and OMP sources from their conditional maps in the same phase.
OMP resolves one current upstream revision and pins all files to it, including
the package version. A failed group leaves only dependent checks Not checked.

The Claude Code pages can exceed 100 KB. Locate relevant headings with the
available search tool, then read bounded sections to the next heading; do not
read entire large pages.

| File | Sections to grep for |
|---|---|
| `cc-marketplaces.md` | Required fields, Optional fields, Plugin entries, Plugin sources, Relative paths, Strict mode, Version resolution, Rename or remove a plugin, Marketplace validation errors, Troubleshooting |
| `cc-reference.md` | Plugin manifest schema, Component path fields, Path behavior rules, Path traversal limitations, Version management, Standard plugin layout, File locations reference, plugin validate |
| `codex-build.md` | Plugin structure, Manifest fields, Marketplace metadata, How local marketplaces work, Path rules |
| `codex-errors.md` | Plugin manifest errors, Skill errors, Listing and interface errors, Package warnings |

Then fetch by condition, again in one parallel batch:

| Condition | Also fetch |
|---|---|
| Claude selected and any entry or manifest has `dependencies` | `https://code.claude.com/docs/en/plugin-dependencies.md` |
| Claude selected and any entry has `relevance` | `https://code.claude.com/docs/en/plugin-relevance.md` |
| Claude selected and a plugin ships `evals/` or sets `experimental.evals` | `https://code.claude.com/docs/en/plugin-evals.md` |
| Claude/Codex selected and plugins ship hooks, agents, commands, MCP or LSP | Fetch applicable `https://code.claude.com/docs/en/plugins.md` and `https://developers.openai.com/plugins/guides/submit-claude-plugin.md` |
| The user asks about ChatGPT workspace import | `https://learn.chatgpt.com/docs/enterprise/plugin-management.md` |
| Claude selected and the repo is more than a month older than today | `https://code.claude.com/docs/en/whats-new/index.md` |

From `whats-new/index.md`, take the weeks dated after the repo's last change,
read the one-line summaries, and open only the weeks that mention plugins or
marketplaces. Cap it at eight pages and say so in the report header when the
cap applied.

`https://learn.chatgpt.com/docs/build-plugins.md` is a stub that points at
developers.openai.com. Do not fetch it in place of the builder docs.

If a fetch fails, say so in the report header and mark every check that
depended on it as **Not checked**. Never fall back to remembered rules: a
remembered rule is the failure this skill exists to prevent.

## Step 3: Mechanized evidence

Run these only for Claude-format targets when `claude` is available on `PATH`.
Otherwise report the specific skipped evidence, without blocking static checks:

```bash
claude plugin validate --strict --json <marketplace root>   # catalog, every local plugin.json, entry-vs-manifest version
claude plugin validate --strict --json <plugin dir>          # one per plugin, one batch: opens skills, agents, commands, hooks
```

A plugin whose `source` is the marketplace root (`"./"`) has no plugin run of
its own: the validator treats that directory as the marketplace and opens no
component file. Validate its component directories instead, such as
`claude plugin validate --strict --json ./skills`, with the path rule from
the fetched "Validate a plugin or a directory without a manifest" section.

Take the exit code meanings and the JSON shape from the fetched reference and
quote them. `contents` lists only the files that had a problem, so an empty
array on a plugin run means every skill file was opened and was clean. The
validator ships with the CLI, so it can lag or lead the docs:
treat its output as evidence, and confirm each rule it reports against a
fetched line before it becomes a finding. `claude plugin details <name>` adds a
component inventory and token cost for an installed plugin, useful for a
Consider finding on a heavy plugin, never required.

Separate **static checks**, optional **installed-state inspection**, and
**explicit opt-in runtime checks**. Available Cursor help/list commands and
OMP list/doctor describe only their documented scopes; never use doctor `--fix`.
No documented universal `agent plugin validate` or `omp plugin validate` exists
in these contracts. Verify actual help before suggesting CLI commands.

Passive audits never add/install/update/remove marketplaces or plugins, copy
plugins into active discovery roots, launch with `--plugin-dir`, start MCP or
execute hooks/scripts/extensions. Headless mode is not read-only. Install
dry-run is not an unrestricted safe validator because package-manager paths
can create state. Runtime execution requires separate approval and a bounded
side-effect description; missing CLI access affects only dependent evidence.

## Step 4: Axis A, catalog

For each catalog present, find the governing line in the fetched text first,
then check:

The bullets below are Claude/Codex checks only where the fetched host rule
applies, not universal constraints. For Cursor and OMP, use their selected live
map instead. Unsupported restrictions require affirmative schema/runtime
evidence: omission from a summary table alone is Not checked, not rejection.

- JSON parses. The required top-level fields for that host are present and
  non-empty. Take the list from the fetched page for each host.
- The marketplace `name` passes every name rule the fetched page lists:
  case and character rules, the reserved-name list, the package-manager
  names, and the Claude Desktop rules. Quote the list, do not recite it.
- A marketplace `description` is present, at the location the fetched page
  calls current rather than the one it keeps for backward compatibility.
- Every `plugins[].source`. Relative paths carry the required prefix, no `..`,
  no backslash, and resolve to a directory on disk. A bare name appears only
  with the field that permits it. A remote source carries the required fields
  for its type. A Codex `source` uses one of the object forms the Codex doc
  lists.
- Orphans and danglers: every plugin directory under the referenced roots has
  an entry, and every entry resolves. A dangling entry is Blocking.
- Names are unique. Each entry `name` equals the manifest `name`, and each
  entry `description` and `version` agree with the manifest. A `version` set
  in both places is Should fix: the fetched doc says which one wins and that
  it wins silently.
- `renames`. List the entry names the catalog has ever carried
  (`git log -p --format= -- <catalog> | grep '^-.*"name"'`) and compare with
  the current ones. A name that disappeared without a `renames` entry is
  Should fix. When the map exists, each chain ends at `null` or a listed
  name, and old entries are still there.
- `strict: false` entries do not sit next to a `plugin.json` that declares
  components.
- Entries in a native Codex catalog carry the fields the Codex doc marks as
  always required, and `policy` values come from its lists. Neither host
  lists allowed entry `category` values, so only consistency across entries
  is a finding there.
- Where equivalent listings are claimed: compare plugin sets, effective
  versions and descriptions; merge shared drift into one finding with a table.

## Step 5: Axis B, plugins

Fewer than four plugins: check inline. Otherwise use available delegation tools
up to the active host's effective capacity, dispatching independent work together
and queuing excess. Preserve Claude capacity checks when on Claude; do not use
its settings on other hosts. Unknown capacity means one worker; no delegation
means sequential audits. Read-only workers return findings in their response.
Give workers selected host/package classifications and fetched evidence.
The following checks are Claude/Codex-scoped; apply Cursor/OMP maps for those hosts:

- The manifest parses. `name` follows the character rule and equals the
  directory name. `version` is semver. `description`, `author.name`,
  `license`, `homepage`, and `repository` are present when the plugin ships
  to other people. A missing manifest `$schema` is Consider, with the URL the
  fetched reference gives.
- Component paths start with the required prefix, stay inside the plugin,
  and use forward slashes. Which fields add to the default scan and which
  replace it comes from the fetched reference.
- Layout: only the manifest sits inside the manifest directory. A skills
  plugin has `skills/<x>/SKILL.md`, and that SKILL.md has a frontmatter
  `name` equal to its directory. Frontmatter identity and the length limits
  below are the only skill rules applied here; the body belongs to
  `verify-skill`. No `CLAUDE.md` at the plugin root, no
  top-level `bin/`, and `commands/` reported as the legacy form when the
  fetched reference says so.
- Codex: the manifest is one of the forms the Codex doc accepts. Skills are
  immediate children of `skills/`, none hidden, none symlinked. Name and
  description length limits come from the fetched error list. A component
  Codex ignores is Should fix when it carries the plugin's essential
  behaviour, and Consider otherwise. When a `.codex-plugin` manifest exists,
  its `interface` fields and `category` value are checked against the
  fetched lists.
- Version drift: establish the last published plugin version and payload
  from the repository's release or distribution mechanism. A newer pending
  version can cover multiple unreleased commits, reviews, and fixes; commit
  timestamps alone do not prove that an edit shipped. Report Should fix only
  when publication evidence shows changed payload distributed under an
  already-published version, quoting the fetched update rule. Skip plugins
  documented to load in place. If the published baseline cannot be established,
  mark the check Not checked instead of inferring a release from local history.

Close the axis with one line: "N skills not content-verified. Run
`/verify-skill` on each." When `verify-skill` is installed, Glob the same roots
it lists for itself and offer to dispatch it, one subagent per skill.

## Step 6: Axis C, repository

- README: require installation instructions only for hosts the repository
  claims, not every compatible consumer selected for checks. Verify commands,
  names, catalog suffixes and descriptions against those hosts' fetched rules.
  Check claimed equivalent README listings against effective manifests.
- `LICENSE` at the root, and every manifest `license` agrees with it. When at
  least one plugin carries a `sources.json`, every plugin copied from another
  repository does. A skill that only cites an article is authored, not copied.
- A CI workflow runs the validator with `--strict` on every target Step 3
  ran, including a root plugin's component directories. Consider when absent
  or partial, quoting the fetched line that recommends it.
- `CHANGELOG.md` when versions are explicit. Consider, with the quote.
- Content the install path copies but should not ship: `.claude/*.local.md`,
  plan files, scratch, LFS-tracked files.
- `.claude/settings.json` `extraKnownMarketplaces`, when present, names the
  same marketplace as the catalog.

## Step 7: Axis D, currency

- **Dead links.** Collect every URL in the catalogs, the manifests, and the
  README, then batch one check. Feed the list on stdin: a URL with `&` or `?`
  in it breaks an unquoted `for` loop.

  ```bash
  while IFS= read -r u; do printf "%-70s " "$u"; \
    curl -sS -o /dev/null -w "%{http_code}\n" -L --max-time 20 "$u"; done <<'EOF'
  https://example.com/one
  https://example.com/two?a=1&b=2
  EOF
  ```

  Report each non-2xx with its code. A 404 on a `$schema`, a `homepage`, or an
  install source is Should fix. For a dead `$schema`, take the replacement URL
  from the fetched docs; when they give none for that file, look it up in the
  SchemaStore catalog with
  `curl -sSL https://www.schemastore.org/api/json/catalog.json | grep -io '"url": *"[^"]*<name>[^"]*"'`,
  and when that has none either the fix is to drop the field.
- **Stale commands.** Every CLI command the README quotes exists in the
  fetched docs with those flags.
- **Unknown fields.** A field in a manifest or entry that the fetched schema
  does not list, including one left over from another tool's manifest.
- **Missing fields the docs now recommend.** Consider unless the fetched doc
  says required.

## Step 8: Report

| Level | Meaning |
|---|---|
| **Blocking** | The marketplace fails to load, an entry fails to install, or the README tells the reader to run something that no longer works |
| **Should fix** | It installs, but is less reliable than it should be, or omits something it should carry |
| **Consider** | A judgment call. The author may have had a reason |

Report skeleton:

````markdown
# Marketplace verification: <repo>

Verified against sources fetched <date>:
- <applicable source URLs, access dates, OMP revision/version and conflicts>

Hosts: list Claude Code, Codex, Cursor IDE, Cursor CLI and OMP separately:
- <host>: checked native | checked compatible | not targeted | Not checked: <reason>
Effective catalog/package/provider: <classification and evidence per selected host>
Static checks: <performed and limits>
Installed-state inspection: <performed | not requested | unavailable, scoped reason>
Opt-in runtime checks: <separately approved evidence | not performed>
Validator: <Claude-format targets and exit results | skipped, reason>

Blocking: N · Should fix: N · Consider: N
<Not checked: which checks, and which fetch failed>

## Blocking

### <one-line summary>
**Axis**: A catalog | B plugins | C repository | D currency
**Hosts**: <affected hosts/surfaces; merge one shared problem across applicable hosts>
**Location**: `path/to/file:LINE`
**Problem**: what is wrong
**Evidence**: governing fetched quote and URL/access date, pinned OMP source
revision where applicable, validator message, HTTP result or conflicting repo lines
**Fix**:
```diff
- old
+ new
```

## Checks that passed

One line per check, with the number or the rule it met.
````

Repeat the findings section per severity, and omit a severity that has no
findings. Always keep **Checks that passed**: without it the reader cannot tell
a check that passed from one that never ran. When nothing at all is found, that
section plus one line is the whole report.

## Step 9: Offer to apply the fixes

Present the changes and wait for explicit confirmation. Do not apply anything
before that, and do not apply the **Consider** findings at all unless the user
names them. Group the offer by severity so the user can take the Blocking
findings alone.

Follow the repository's version policy when offering a plugin fix. Reuse an
existing pending version for unreleased work. Propose a new version only when
the fix needs a release beyond the published version, and state the baseline
and proposed version in the offer. A local follow-up commit is not a release.

After applying, re-run Steps 3 to 7 on the changed files, reusing the docs
already fetched. Expect an empty report. If a fix introduced a new finding, say
so rather than closing out.

## Notes

- **A clean repo produces no findings.** Verifying a healthy marketplace and
  returning a list of near-findings is the main failure mode of this skill. A
  finding needs the quote that makes it a finding, and Step 8 names the four
  things that count as one. No quote, no finding: drop it, and let **Checks
  that passed** carry the work you did.
- **Steps 4 to 7 are a checklist of where to look, not of what to report.** A
  category with nothing under it is a normal outcome, not a failed run.
- **Use governing first-party evidence.** Fetched documentation governs documented
  contracts; pinned executable OMP source can settle implementation-specific
  branches. Disclose documentation/source conflicts and cite both. A validator
  message alone does not establish a rule for another host.
- **Style is not a finding.** Report what the fetched guidance calls wrong.
  A repo that is organized differently from your preference is not defective.
- **Verifying this skill.** Run this skill on the repo that ships it, and run
  `verify-skill` on this file.
