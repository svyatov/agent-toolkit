---
name: commit
description: >
  Git commit workflow with conventional commits, branch creation, push, and PR support.
  Use when the user asks to commit, save changes, push, ship it, open a PR, send a PR,
  or says "/commit". Also triggers on short aliases: "cp" (commit and push), "cb" (commit
  to new branch), "cpr" (commit and PR). Trigger phrases: "commit", "commit and push",
  "commit new branch", "commit to new branch", "commit and pr", "commit push pr",
  "commit pr", "cp", "cb", "cpr", "push this up", "save my changes", "ship it".
license: MIT
allowed-tools: Bash
---

# Git Commit

Conventional commits with optional branch creation, push, and PR.

## Modes

| Mode | Triggers | Steps |
|------|----------|-------|
| commit | "commit", "/commit" | analyze → stage → commit |
| commit-branch | "commit new branch", "commit to new branch", "cb" | analyze → create branch → stage → commit |
| commit-push | "commit and push", "cp" | analyze → stage → commit → push |
| commit-pr | "commit and pr", "commit push pr", "commit pr", "cpr" | analyze → (create branch if on main/master) → stage → commit → push → PR |

Detect mode from user input. Default to **commit** if ambiguous.

## Message Format

Follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) strictly: `<type>(<scope>): <description>`. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. Description: present tense, imperative mood, under 72 chars.

Use active voice, concrete language, and concision in all text you produce — commit messages, PR titles, and PR descriptions:

| Weak | Strong |
|------|--------|
| JWT refresh token rotation was added | add JWT refresh token rotation |
| fix issue with users | fix null pointer in user lookup |
| refactor code to extract the database connection pool logic | extract DB connection pool |

## Branch Naming

Format: `<type>/<short-description>` — lowercase kebab-case, max 50 chars total.
Derive the type and description from the same diff analysis used for the commit message.
Examples: `feat/add-user-auth`, `fix/null-pointer-in-parser`, `refactor/extract-db-layer`

## Workflow

### 1. Analyze Diff (all modes)

```bash
git branch --show-current && git status --porcelain && git diff HEAD
```

If no changes exist — warn user and stop. Untracked files (`??` in status) don't appear in the diff — read them directly before writing the message.

Determine from the output: current branch, **type**/**scope**/**description** for the commit message, and **short-description** for the branch name (modes that create branches).

### 2. Create Branch (commit-branch, commit-pr)

- **commit-branch**: always create a new branch.
- **commit-pr**: create a new branch only if currently on `main` or `master`. Otherwise stay on the current feature branch.

```bash
git checkout -b <type>/<short-description>
```

Uncommitted changes carry over automatically.

### 3. Stage Files (all modes)

Stage relevant files by specific paths — this keeps commits focused and avoids accidentally including secrets or unrelated changes. Never stage secrets (.env, credentials, private keys). Prefer specific paths over `git add .`.

### 4. Commit (all modes)

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<optional body>

<optional footer>
EOF
)"
```

One logical change per commit. Reference issues in footers when applicable: `Closes #123`, `Refs #456`.
If a pre-commit hook fails, fix the issue and create a NEW commit — never amend the previous one, as it may contain unrelated changes.

### 5. Push (commit-push, commit-pr)

```bash
git push -u origin HEAD
```

The `-u` flag is idempotent — safe whether or not upstream is already configured.

### 6. Pull Request (commit-pr only)

Check for an existing PR on this branch:

```bash
gh pr view --json number,title,url 2>/dev/null
```

PR **title**: conventional commit format (same type/scope/description pattern as the commit).
PR **body**: a `## Summary` section with bullet points and a `## Test plan` section with checkbox verification steps.

**No existing PR** — create one (ready for review, not draft) with `gh pr create --title ... --body ...` (heredoc for the body).

**Existing PR** — update title and body to reflect all commits on the branch: run `git log main..HEAD --oneline` (or `master..HEAD`) to see the full scope, then regenerate both via `gh pr edit`.

After creating or updating, return the PR URL to the user.
