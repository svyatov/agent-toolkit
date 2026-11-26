# Resolve a skill name

To find a skill by name, first use a matching target path supplied by the user
or the current session's skill listing. Otherwise search these repository
patterns in order and stop at the first hit. Use Glob when available, or an
equivalent shell file search when it is not:

```
plugins/*/skills/*/SKILL.md
skills/*/SKILL.md
```

Then search the active host's locations:

- Claude Code: `.claude/skills/*/SKILL.md`, `~/.claude/skills/*/SKILL.md`, then `~/.claude/plugins/cache/*/*/*/skills/**/SKILL.md`.
- Codex: `.agents/skills/*/SKILL.md` at each directory from the current directory up to the repository root, then `~/.agents/skills/*/SKILL.md` and `/etc/codex/skills/*/SKILL.md`. Use the session's supplied paths for bundled system and plugin skills.
- Cursor IDE and CLI: recursively search project/user `.agents/skills` and `.cursor/skills`, plus documented `.claude/skills` and `.codex/skills` compatibility roots. Include nested project roots; they scope surfacing to their subtree. Identity is the directory containing `SKILL.md`. Do not infer collision precedence from search order.
- OMP: scan immediate children of ancestor `.omp/skills` roots and the effective user root (default `~/.omp/agent/skills`). Prefer session-resolved paths and effective custom/profile/XDG configuration. Managed skills are distinct, lower priority. Establish the provider before diagnosing discovery; a same-name file does not establish bare-name ownership.

If the target is still missing, check the active host's local reference from
Step 2. Missing discovery evidence is **Not checked**, not proof of rejection.
Offer `--refresh` if saved discovery guidance cannot resolve it; do not fetch automatically.
