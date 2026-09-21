# Changelog

Each plugin carries its own version in `plugins/<name>/.claude-plugin/plugin.json`. Entries below are grouped by plugin; repository-level changes sit under `Marketplace`. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Marketplace

- Add a native Codex catalog at `.agents/plugins/marketplace.json` and a Codex install section in the README.
- Add `renames` for the nine plugin names removed since the `leo` bundle was split, so old installs migrate instead of failing.
- Point the catalog `$schema` at SchemaStore and move `description` to the top level.
- Add a CI workflow that runs `claude plugin validate --strict` on the catalog and every plugin.

### All plugins

- Add `$schema` to every `plugin.json` (patch bump on each).
- Every slash-only skill (all except astro) gains `agents/openai.yaml` with `allow_implicit_invocation: false`, so Codex also waits for an explicit `$skill` call instead of triggering on a matching prompt (patch bump on each).
- astro 1.2.1, generate-favicon, grill-me, llms-visibility: manifest description now matches the catalog and README wording.

### verify-skill

- 1.2.0: new host-parity check compares `disable-model-invocation` in the frontmatter with `allow_implicit_invocation` in `agents/openai.yaml`, fetching the rule from developers.openai.com. Catalog and README wording now match the manifest.
