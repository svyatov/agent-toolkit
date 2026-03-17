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

## Conventional Commit Format

Follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) strictly. Description: present tense, imperative mood, under 72 chars.

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no logic change) |
| `refactor` | Refactor (no feature/fix) |
| `perf` | Performance improvement |
| `test` | Add/update tests |
| `build` | Build system/dependencies |
| `ci` | CI/config changes |
| `chore` | Maintenance/misc |
| `revert` | Revert commit |

## Writing Quality

Invoke the `writing-clearly-and-concisely` skill and apply its principles to all text you produce — commit descriptions, commit bodies, PR titles, and PR descriptions.

Pay special attention to active voice, concrete language, and concision:

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
git diff --staged
git diff
git status --porcelain
```

If no changes exist — warn user and stop.

Determine from the diff:
- **type**, **scope**, **description** — for the commit message
- **short-description** — for branch name (modes that create branches)

Use staged diff if files are already staged, otherwise use working tree diff.

### 2. Create Branch (commit-branch, commit-pr)

```bash
git branch --show-current
```

- **commit-branch**: always create a new branch.
- **commit-pr**: create a new branch only if currently on `main` or `master`. Otherwise skip — stay on the current feature branch.

Generate branch name from step 1: `<type>/<short-description>`. Uncommitted changes carry over to the new branch automatically.

```bash
git checkout -b <branch-name>
```

### 3. Stage Files (all modes)

Stage relevant files by specific paths — this keeps commits focused and avoids accidentally including secrets or unrelated changes.

```bash
git add path/to/file1 path/to/file2
```

Never stage secrets (.env, credentials, private keys). Prefer specific paths over `git add .`.

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

Generate PR **title** in conventional commit format (same type/scope/description pattern as the commit).
Generate PR **body** with a summary section and test plan. Apply `writing-clearly-and-concisely` principles — active voice, concrete language, no filler:

```text
## Summary
- <bullet points describing changes>

## Test plan
- [ ] <verification steps>
```

**No existing PR** — create one (ready for review, not draft):

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
...

## Test plan
...
EOF
)"
```

**Existing PR** — update title and body to reflect all commits on the branch. Use `git log main..HEAD --oneline` (or `master..HEAD`) to understand the full scope of changes, then regenerate both:

```bash
gh pr edit --title "<title>" --body "$(cat <<'EOF'
## Summary
...

## Test plan
...
EOF
)"
```

After creating or updating, return the PR URL to the user.

## Safety

- Never update git config
- Never run destructive commands (--force, hard reset) without explicit user request
- Never skip hooks (--no-verify) unless user asks
- Never force push to main/master
- If commit fails from hook: fix issue, create new commit (never amend previous)
