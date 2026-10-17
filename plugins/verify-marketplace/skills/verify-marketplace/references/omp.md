# OMP live verification map

Read when OMP is selected, including a Claude catalog's documented fallback route. This is a procedure/source map, not a dated rule snapshot. Fetch current evidence on every audit.

## Pin the source group

Resolve one current commit with `gh api repos/can1357/oh-my-pi/commits/HEAD --jq .sha`. With `curl`, fetch raw GitHub files at that same SHA: `packages/coding-agent/package.json`, `docs/marketplace.md`, `docs/skills.md`, and `docs/skills/authoring-marketplaces.md`. Record revision/version and cite public `https://github.com/can1357/oh-my-pi/blob/<sha>/<path>#L...` URLs with exact excerpts.

When prose cannot settle runtime behavior, fetch only the relevant files below at that SHA:

| Question | Source path within upstream repository |
|---|---|
| Catalog precedence, required fields, duplicate entries | `packages/coding-agent/src/extensibility/plugins/marketplace/fetcher.ts` |
| Source forms, containment, npm installation | `packages/coding-agent/src/extensibility/plugins/marketplace/source-resolver.ts` |
| Cache/name/version constraints | `packages/coding-agent/src/extensibility/plugins/marketplace/types.ts`, `cache.ts` in that same directory |
| Version resolution and update checks | `packages/coding-agent/src/extensibility/plugins/marketplace/manager.ts` |
| Skill/command remapping, MCP manifest selection, exact `./` source | `packages/coding-agent/src/discovery/claude-plugins.ts` |
| Portable schema, per-skill rejection and containment | `packages/coding-agent/src/discovery/agent-plugin-format.ts`, `agent-plugins.ts` |
| CLI inspection scope and side effects | `packages/coding-agent/src/cli/plugin-cli.ts` |

An unavailable group leaves its dependent checks Not checked. Do not substitute remembered rules, mix revisions, or treat prose/source disagreement as agreement. Pinned executable branches can govern implementation-specific findings; disclose the conflicting documentation.

## Effective catalog and entry checks

1. Verify `.omp-plugin/marketplace.json` before the `.claude-plugin/marketplace.json` fallback, without merging. Confirm behavior for an invalid existing native catalog rather than assuming fallback. Compare listings only where the repository claims equivalence; different target audiences can intentionally differ. Scope orphan roots to the effective catalog.
2. Derive required fields (`name`, `owner.name`, `plugins`, entry `name`/`source`), case-insensitive duplicate rules, supported name/cache-version constraints and `metadata.pluginRoot` behavior from fetched evidence. Distinguish top-level catalog failure from entries that are warned about and skipped independently.
3. Relative string sources require `./` where the fetched resolver says so. Direct JSON URL catalogs cannot resolve relative plugins. Distinguish source parsing from installation: an npm object may parse while installation is unsupported, Blocking only that entry. Continue checking valid entries.
4. Preserved `strict` and catalog metadata do not establish runtime enforcement. Check their actual consumers before reporting enforcement.

## Component/provider checks

Check conventional skills, portable skills/MCP and executable OMP extensions separately. Skills/commands remapping can read Claude manifests while MCP prefers OMP manifests; do not invent one global precedence rule. Confirm whether skill paths augment defaults and command paths replace defaults in the current branch. For source exactly `./`, inspect matching root catalog-entry selection: configured paths can suppress defaults, while absence of configured paths can still fall back. Do not generalize that special case to all local sources.

Portable root schema and skill frontmatter use distinct validators. One rejected skill need not reject all package components. A Claude shell hook is not proven equivalent to OMP JS/TS hook factories or extensions. Missing essential behavior is a finding for the affected host/component, not a blanket marketplace incompatibility claim.

## Update distribution, separate from schema

Read both version resolver and its update-check caller. Determine which manifest paths are consulted for local sources, and whether remote sources depend on catalog-entry versions. Documentation has described catalog-only bulk upgrades while executable code can resolve local manifest versions first: do not issue a missing-entry-version warning on that assumption alone. If the actual source type can miss manifest-only updates, report Should fix with pinned evidence and an OMP-scoped publishing fix, not JSON/schema failure. Never silently add fields to a shared Claude catalog.

## Passive audit boundary

Optional `omp plugin list`, `omp plugin marketplace list` and `omp plugin doctor` inspect different installed/configured scopes; verify available help first and never use doctor `--fix`. No universal `omp plugin validate` is established. Missing CLI access does not block static conformance. Do not add/install/update/remove, copy into discovery roots, launch plugins, execute hooks/extensions/scripts or start MCP. Install dry-run is not an unrestricted safe validator: package-manager paths can create state. Prefer session-provided/effective profile/XDG roots over hardcoded caches. Separate static evidence, installed-state inspection and explicitly approved runtime execution.
