# OMP guidance

Refreshed: 2026-10-17

Use for OMP discovery and axis B host parity. Rules summarize the linked sources; blockquotes are exact excerpts. Checked upstream revision: `d36b26bab1350214ce3678acbfa309fe68f984d1`, resolved through GitHub's commits API; package version: `18.11.3`. These are revision-specific runtime findings, not universal Agent Skills requirements.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/packages/coding-agent/package.json#L1-L4

> "version": "18.11.3",

## Discovery and provider identity

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/docs/skills.md#L23-L81

> Nested patterns like `<skills-root>/group/<skill>/SKILL.md` are not discovered recursively.

Conventional providers and `skills.customDirectories` scan immediate child directories for `SKILL.md`, unlike Cursor's recursive discovery. A Claude-plugin manifest can additionally name a directory containing `SKILL.md` directly. Portable Agent Plugins use the fixed `skills/<name>/SKILL.md` layout; registry-installed Skillshare packages use a root `SKILL.md`.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/packages/coding-agent/src/discovery/builtin.ts#L308-L366

> // Walk up from cwd finding .omp/skills/ in ancestors (closest first). Home is

Native project discovery walks ancestor `.omp/skills` roots, with the project's discovery boundary and user-config exclusions; the default user root is `~/.omp/agent/skills`. Managed auto-learn skills are a separate, lowest-priority provider, not an authored-skill directory.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/docs/marketplace.md#L20-L29

> The `~/.omp` paths below are the default-profile, non-XDG defaults.

**Audit policy:** Prefer session-provided skill paths and effective custom/profile/XDG roots to guessed default or cache paths. Establish provider, source toggles, custom-directory configuration and package type before diagnosing discovery. Failure to locate a skill without that evidence is **Not checked**, not a proven loader rejection.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/docs/skills.md#L124-L135

> Custom-directory skills are merged after provider skills and outrank a same-named default-path provider skill regardless of admission order

Same-name handling depends on provider priority, custom-directory order, content equality and namespaces. Identical copies can collapse; different copies can retain namespaced identities. Finding a same-name file alone does not establish runtime bare-name ownership. Check session discovery evidence before reporting which copy is invoked.

## Conventional frontmatter versus authoring conformance

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/docs/skills.md#L50-L73

> the claude/codex/agents/opencode/claude-plugins providers can load skills without description

Conventional `name` defaults to the containing directory name. Native `.omp`, `omp-plugins`, GitHub `.github/skills`, and custom-directory providers require descriptions; the compatibility providers quoted above permit omissions. Agent Plugins require both name and description. Conventional scanners preserve additional frontmatter metadata; `enabled: false` skips discovery. Raw names containing `/` or `\` are rejected because separators are reserved for namespaces and resource addressing.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/packages/coding-agent/src/discovery/helpers.ts#L480-L527

> if (requireDescription && !frontmatter.description) {

**Audit policy:** Keep shared Agent Skills authoring conformance separate from provider-specific OMP loading. Missing explicit name/description can violate shared authoring guidance without proving every OMP provider rejects the file. Reuse the shared checks rather than duplicating limits as OMP findings. An undocumented field is **Not checked** unless this package's positively identified validator rejects it.

## Visibility, invocation and authorization

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/docs/skills.md#L50-L63

> `globs` and `alwaysApply` are metadata here, not automatic skill-invocation controls.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/packages/coding-agent/src/extensibility/skills.ts#L453-L465

> hide: capSkill.frontmatter?.hide === true || capSkill.frontmatter?.disableModelInvocation === true,

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/docs/skills.md#L139-L175

> `hide: true` does not disable the skill. Hidden skills are still loaded and remain reachable through `skill://<name>` and `/skill:<name>` when skill commands are enabled.

`hide` and normalized `disable-model-invocation` suppress advertising in the rendered skill list; they are not an authorization barrier. Explicit invocation uses `/skill:<name> [args]` when `skills.enableSkillCommands` is enabled. Skill-list advertising also depends on a tool capable of reading skill URIs. A hidden skill can still be read and explicitly invoked; a claim that hiding prevents model access is incorrect.

**Audit policy:** Neither Claude `allowed-tools` nor Codex `agents/openai.yaml` establishes an OMP authorization policy. Do not recommend either as an OMP access-control mechanism. Require separate, affirmative runtime evidence for an authorization claim; undocumented enforcement is **Not checked**. Base catalog-summary recommendations on whether descriptions are advertised, not a claim that no host can read hidden skills.

## Bundled resources and containment

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/docs/skills.md#L178-L217

> resolved path must remain lexically within `baseDir`

`read` resolves `skill://<name>` to the skill's `SKILL.md`; `skill://<name>/<relative-path>` accesses bundled resources. Namespaced identities use `skill://<namespace>/<name>[/<path>]`. Paths are URL-decoded; absolute paths, `..` traversal and lexical escapes are rejected. Missing resources have no fallback search. Resolve ordinary instruction-relative paths against the skill directory, not the session working directory.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/packages/coding-agent/src/internal-urls/skill-protocol.ts#L85-L113

> if (!skill.containRoot) return resolvedPath;

General skill-resource containment is lexical, not a universal symlink sandbox. Agent Plugins and Skillshare skills additionally carry a package containment root: realpath resolution must stay within that package. Symlinks to another location inside the same package are allowed. Do not conflate the package boundary with the narrower individual skill directory or claim all conventional skills have this stronger realpath protection.

## Portable Agent Plugins: closed skill schema

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/packages/coding-agent/src/discovery/agent-plugin-format.ts#L20-L25

> export const AGENT_PLUGIN_MANIFEST_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/packages/coding-agent/src/discovery/agent-plugin-format.ts#L89-L160

> if (!SKILL_FIELDS[key]) return `unexpected frontmatter field "${key}"`;

At this revision, a root `plugin.json` declaring the Agent Plugins 1.0.0 schema selects the portable branch. Its skill validator accepts only `name`, `description`, `license`, `allowed-tools`, `metadata`, and `compatibility`. It requires name/description, checks directory-name agreement and naming/field limits, and rejects every other raw frontmatter key, including `disable-model-invocation`, `hide`, and `enabled`. Acceptance of `allowed-tools` as a string is schema acceptance, not proof of permission enforcement.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/packages/coding-agent/src/discovery/agent-plugins.ts#L157-L179

> // Non-conforming skills are skipped without affecting other components.

Source: https://github.com/can1357/oh-my-pi/blob/d36b26bab1350214ce3678acbfa309fe68f984d1/docs/skills.md#L52-L73

> `disableModelInvocation?: boolean` (Agent Skills equivalent of `hide`; normalized from kebab-case `disable-model-invocation`)

**Documentation/source qualification:** The general supported-field table describes `disable-model-invocation` as an Agent Skills equivalent of hiding, while the executable portable validator excludes it. The adjacent documentation explicitly distinguishes the stricter portable schema, but does not enumerate all excluded keys. Do not extend the general table to portable packages: cite the six-field validator for this runtime restriction and disclose the documentation gap. Conversely, do not extend the portable rejection to conventional providers.

**Audit policy:** Label a rejected portable skill as an OMP portable-provider finding, not a universal Agent Skills ban or an entire-package failure. A fatally invalid portable root manifest can reject the whole package; one invalid skill is skipped independently. Preserve governing revision/date and provider/package evidence on every host finding. Static source checks do not certify native runtime execution.
