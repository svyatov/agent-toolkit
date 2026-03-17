# Agent Toolkit

Personal agent toolkit — reusable skills and plugins for Claude Code, Cursor, Codex, and Gemini CLI.

## Structure

- **`skills/`** — Universal skills installable via `npx skills add`
- **`plugins/`** — Claude Code plugins
- **`.claude-plugin/marketplace.json`** — Claude plugin marketplace catalog

## Claude Code Plugin Installation

```bash
claude plugin marketplace add svyatov/agent-toolkit
claude plugin install leo@leo-toolkit
```

## Skills

| Skill | Description |
|-------|-------------|
| `generate-cicd` | Generate CI/CD workflows (GitHub Actions) |
| `generate-dockerfile` | Generate optimized, multi-stage Dockerfiles |
| `import-skill` | Import skills from GitHub repos (copy or merge) |

## License

MIT
