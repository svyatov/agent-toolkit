# Changelog

Each plugin carries its own version in `plugins/<name>/.claude-plugin/plugin.json`. Entries below are grouped by plugin; repository-level changes sit under `Marketplace`. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Marketplace

- Add a native Codex catalog at `.agents/plugins/marketplace.json` and a Codex install section in the README.
- Add `renames` for the nine plugin names removed since the `leo` bundle was split, so old installs migrate instead of failing.
- Point the catalog `$schema` at SchemaStore and move `description` to the top level.
- Add a CI workflow that runs `claude plugin validate --strict` on the catalog and every plugin.

