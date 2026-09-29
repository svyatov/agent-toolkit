---
name: orchestrate
description: Work through a repository's GitHub issues unattended, driving worker Claude Code sessions in herdr panes to verify specs, triage bugs, implement, refactor, and merge each issue, and store the lessons of each run in the repo
license: MIT
compatibility: Designed for Claude Code. Requires herdr, gh, and Node.js 18.17 or later (built-in modules only). Workers call /triage, /implement, /qa, /code-review, and /retro from github.com/svyatov/supermatt, and /refactor, /cprw, /fa, /c, and /ww from this marketplace.
argument-hint: "[max issues]"
disable-model-invocation: true
disallowed-tools: AskUserQuestion
allowed-tools: Bash(herdr:*), Bash(gh:*), Bash(git:*), Bash(node ${CLAUDE_SKILL_DIR}/scripts/next-issue.mjs:*), Bash(sleep:*), Bash(osascript:*)
---

# orchestrate

You are the orchestrator. You do not write code. You pick issues, drive worker Claude Code sessions in a herdr pane beside yours, and check their results. A spec whose tickets are all closed comes first: one worker session **V** checks the whole spec against the code (see Verify a spec). Bugs come next, then the other tickets. Each ticket runs through up to four worker sessions, each with a fresh context:

1. **T**: `/triage #N`, only for a bug that is not triaged yet, to make it ready for an agent.
2. **A**: `/implement #N`, which QAs, reviews, and fixes its own work, then any fixes it left.
3. **B**: `/refactor`, then `/cprw` to merge.
4. **C**: `/retro` over A and B, then the lessons it finds, merged into the repo so the next `/implement` starts from them.

Repeat until a stop condition is met.

## Setup

1. Run `test "${HERDR_ENV:-}" = 1`. If it fails, say you are not inside herdr and stop.
2. PROJECT is the repo folder name (`basename "$(git rev-parse --show-toplevel)"`) made into a valid herdr agent name: lowercase it, change each character outside `a-z`, `0-9`, `_` and `-` to `-`, drop leading characters that are not letters, and keep at most 24 characters. K is the lowest number from 1 up that no live agent in `herdr agent list` uses in the name `PROJECT-orch-K`, so several orchestrators in one project stay apart. Now, before any check that can stop, run `herdr agent rename "$HERDR_PANE_ID" PROJECT-orch-K` and `herdr pane report-metadata "$HERDR_PANE_ID" --source orchestrate --display-agent orchestrator`. WORKER is `PROJECT-work-K`.
3. Run `herdr --skill` and follow its rules. Parse every ID from JSON output. Never close a tab or pane you did not create.
4. Read `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`. If either is missing, or the tracker is not GitHub, say so and stop. READY, BUG, and TRIAGE are the label strings that `triage-labels.md` maps to the ready-for-agent, bug, and needs-triage roles.
5. Your working directory is the repo's main checkout, and the workers use the same checkout. DEFAULT is the output of `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`. Run `git switch DEFAULT && git pull --ff-only`. The tree must be clean. If it is not, stop.
6. LIMIT is the number in `$ARGUMENTS`, or no limit when it is empty. RUN_START is `date -u +%Y-%m-%dT%H:%M:%SZ`. Run `node ${CLAUDE_SKILL_DIR}/scripts/next-issue.mjs READY BUG TRIAGE` and print the queue it lists, so the operator sees what will run.

## Worker

Each session runs its own model and effort:

| Session | Phases | Model | Effort |
|---|---|---|---|
| V | verify | `opus` | `xhigh` |
| T | triage | `opus` | `high` |
| A | implement, the QA and review restarts in step 3, fix | `sonnet` | `medium` |
| B | refactor, ship | `opus` | `high` |
| C | retro, lessons | `opus` | `high` |

- **Open the worker**: `herdr pane split "$HERDR_PANE_ID" --direction right --no-focus --cwd "$PWD"`. Save `.result.pane.pane_id` as PANE. Then `herdr agent start WORKER --kind claude --pane PANE -- --model MODEL --effort EFFORT`, with MODEL and EFFORT from the current session's row, and `herdr pane report-metadata PANE --source orchestrate --display-agent worker`. A new pane's shell can still be starting: if `agent start` returns `agent_pane_busy`, run `sleep 3` and start it once more.
- **Close the worker**: add `herdr agent get WORKER` `.result.agent.agent_session.value` to SESSIONS (the issue's list of worker session IDs, for the retro), then `herdr pane close PANE`.
- **Restart the worker**: close it, then open it.
- **Show phase P**: `herdr tab rename "$HERDR_TAB_ID" "#N P"`. Do this at the start of each phase below.
- **Wait for the worker**: after every `herdr agent prompt ... --wait`, run `herdr agent wait WORKER --until idle --until done --until blocked` in the background and let it notify you. The wait can return `done` between two turns while sub-agents are still running, so then run `sleep 15` and `herdr agent get WORKER`: if it is `working`, wait for the worker again. If the worker is `blocked`, answer the dialog (see Answer a dialog) and wait for the worker again.
- **Read the worker's reply**: `herdr agent read WORKER --source recent-unwrapped --lines <n>`. If that does not show the reply (the pane is scrolled up and shows a "new message" marker), read the last assistant text blocks from `~/.claude/projects/*/<session>.jsonl`, where `<session>` is `.result.agent.agent_session.value` from `herdr agent get WORKER`.

## Safe actions

An action is safe when everything it deletes, overwrites, or rewrites is inside the repo checkout, or it is one of these:

- Clear a cache that rebuilds itself: a subfolder of `~/.cache`, or a package manager's own clean command (`bun pm cache rm`, `npm cache clean`).
- Remove a git worktree of this repo whose tree is clean (`git -C <path> status --porcelain` prints nothing).
- Push the issue branch or the lessons branch, `--force-with-lease` included, and delete it locally or on the remote after its PR merged.
- In the retro phase, edit a file outside the checkout that a retro candidate names as its source (a skill, a global steering file such as `~/.claude/CLAUDE.md`), left uncommitted for the operator.

Every other delete, overwrite, or rewrite outside the checkout is unsafe: files elsewhere in the home folder, another repo, system config, anything with `sudo`, a push to DEFAULT, or a force-push to any other branch.

## Answer a dialog

A blocked worker shows a permission prompt or a question dialog. Answer it yourself; this overrides the herdr rule to ask the user first. Add each answer to the friction log.

1. Read its last 40 lines (`herdr agent read WORKER --source recent-unwrapped --lines 40`).
2. A permission prompt ("Do you want to proceed?", "Yes / No"): if the action is unsafe (see Safe actions), do not answer: report it and stop. Otherwise run `herdr agent send-keys WORKER enter`, which takes the highlighted first option, Yes.
3. A question dialog: take the option marked "(Recommended)", else the first. Move to it with one `down` key per step from the highlighted option, then `enter`.
4. Read the pane again. If the same dialog is still there after two tries, report it and stop.

## Answer a question

When the worker has an open question (QUESTION is not NONE, or it ended its turn on a question). Add each answer to the friction log.

1. A question that only asks whether to commit, push, open a PR, or ship is step 6's job: treat it as QUESTION=NONE.
2. A yes/no question ("Should I proceed?", "Want me to fix it?"): if a yes would run an unsafe action (see Safe actions), report it and stop. Otherwise prompt the worker with `Yes.` (`--wait`), wait for the worker, and go to step 5.
3. Otherwise prompt the worker with `/ww` (`--wait`) and wait for the worker. Read its last 80 lines and find the option it recommends ("I recommend O2"). When it offers a `/jury` line, take its lean instead.
4. Prompt the worker with `Go with <option>.` (`--wait`) and wait for the worker.
5. In session A, ask the five-line question again. In other sessions, read the worker's last 40 lines for a new question. After three answer rounds with a question still open (five in session T, since triage asks one question at a time), report it and stop.

## Triage a bug (session T)

1. Show phase `triage`. Open the worker.
2. Prompt `/triage #N. I am away: where you would ask me, decide with the option you recommend. The goal is an agent brief and the READY label, unless the evidence says otherwise.` (`--wait`, no timeout) and wait for the worker. Its questions go through Answer a question: take the clear answer yourself, and use `/ww` when the choice is not clear.
3. Run `gh issue view N --json state,labels`.
   - Open with READY: close the worker (its session stays in SESSIONS for the retro), and go on to Implement.
   - Still TRIAGE: report it and stop.
   - Anything else (closed, needs-info, ready-for-human, wontfix): add `#N triaged as <label or closed>` to the friction log, close the worker, and go back to step 1 without counting it toward LIMIT.

## Verify a spec (session V)

A spec is a parent issue: its tickets are its sub-issues, or the issues whose `## Parent` section names it. Once the last ticket closes, check that the tickets together delivered what the spec asked for.

1. Show phase `verify`. Open the worker.
2. Prompt (`--wait`, no timeout) and wait for the worker: `Verify spec #N: all of its tickets are closed. The fixed point is the parent of the oldest commit on DEFAULT that references one of its tickets. From that fixed point, run the qa skill and then the code-review skill, with #N as the spec. Change no file. Then reply with the fixed point, both verdict lines, and one line per gap: each QA fail, and each verified P0 or P1 finding.`
3. No gap: run `gh issue close N --comment "Verified since <fixed point>: QA <verdict>, review <verdict>."`. Add each P2 or P3 finding to the friction log.
4. Gaps: prompt `File one ticket per gap as a child of #N, the way docs/agents/issue-tracker.md creates children, with acceptance criteria and the READY label. Reply with their numbers.` (`--wait`) and wait for the worker. The spec now has open tickets, so the loop implements them, and the spec comes back here once they close. If this is the spec's second verification in this run that found gaps, report it and stop instead of filing.
5. Close the worker. Report one line: `#N spec -> verified, closed` or `#N spec -> gaps #M, #M`. Go back to step 1; a verification does not count toward LIMIT.

## Loop

### 1. Pick the issue

If LIMIT issues have merged, stop. Otherwise run `node ${CLAUDE_SKILL_DIR}/scripts/next-issue.mjs READY BUG TRIAGE` in the checkout. It lists the open, unassigned issues to work on, with an open blocker (native, or a `Blocked by:` line) dropped: specs whose tickets are all closed, then bugs, then the rest, lowest number first. Each line is `number<TAB>title<TAB>spec|ready|triage`. Specs and TRIAGE bugs count only when the repo's own team filed them.

Take the first line. If there is none, report "no unblocked issues" and stop. Say which issue you picked, as `#N title`. Empty SESSIONS. If its last column is `spec`, verify it (see Verify a spec). If it is `triage`, triage it first (see Triage a bug).

### 2. Implement (session A)

1. Show phase `implement`. Open the worker.
2. `herdr agent prompt WORKER "/implement #N" --wait` with no `--timeout`, then wait for the worker. This can take a long time.
3. Run `git log --oneline origin/DEFAULT..HEAD`. If it is empty, ask the five-line question from step 3. If QUESTION is not NONE, answer it, wait for the worker, and run this check again. Otherwise read the pane, report what the worker said, and stop.

### 3. Check the worker

Ask the worker, do not guess from scrollback:

```bash
herdr agent prompt WORKER "Reply with exactly five lines and nothing else. Line 1: BUSY=<yes if a background task or sub-agent you started is still running, else no>. Line 2: QA=<the verdict line of the last QA pass in this session, or NONE if none ran>. Line 3: REVIEW=<the verdict line of the /code-review you ran in this session, or NONE if you did not run it>. Line 4: UNFIXED=<the code, or file:line if it has no code, of each verified finding and each QA fail that is still open: not fixed, and not settled by an answer to your question, or NONE>. Line 5: QUESTION=<a question you asked the user in this session that has no answer yet, or NONE>." --wait
herdr agent read WORKER --source recent-unwrapped --lines 40
```

- BUSY=yes: run `sleep 60`, then ask again. If BUSY is still yes after 30 minutes, report it and stop.
- QUESTION is not NONE: answer it (see Answer a question).
- QA=NONE: restart the worker, prompt it with `/qa origin/DEFAULT #N` (`--wait`, no timeout), and wait for the worker. Ask it the same five-line question.
- REVIEW=NONE: restart the worker, prompt it with `/code-review` (`--wait`, no timeout), and wait for the worker. Ask it the same five-line question.

### 4. Fix findings

If UNFIXED is not NONE, show phase `fix`, prompt the current worker with `/fa <the UNFIXED value>` (`--wait`) and wait for the worker. Then ask the five-line question again, and answer any open question. A finding that `/fa` settled with no edit, because the option it applied (its own recommendation, or what the issue asks for) keeps the code as it is, counts as fixed. If UNFIXED still names a finding that is open, report it and stop. Then prompt `/c` (`--wait`) and wait for the worker, so the tree is clean for session B.

### 5. Refactor (session B)

1. Show phase `refactor`. Restart the worker.
2. Prompt `/refactor the changes on this branch since origin/DEFAULT` (`--wait`, no timeout) and wait for the worker. Its questions and plan approval go through Answer a dialog and Answer a question.
3. If `git status --porcelain` prints anything, prompt `/c` (`--wait`) and wait for the worker.

### 6. Ship

1. Show phase `ship`. Prompt the current worker with `/cprw` (`--wait`, no timeout), then wait for the worker.
2. Read its last 60 lines. Find the PR URL and whether it merged.
3. Confirm with `gh pr view <url> --json state,mergedAt`. If the state is not MERGED (red CI, refused push, anything else), report the reason and stop. Do not retry and do not fix.

### 7. Close out

1. If issue N is still open, run `gh issue close N --comment "Merged in <PR URL>."`. A closed issue unblocks the issues that wait on it.
2. In your checkout: `git switch DEFAULT && git pull --ff-only`. The tree must be clean.

### 8. Retro (session C)

1. Show phase `retro`. Restart the worker.
2. Prompt `/retro the sessions <SESSIONS>, each at ~/.claude/projects/*/<id>.jsonl` (`--wait`, no timeout) and wait for the worker.
3. Prompt `Apply every surviving candidate, most severe first, a check before a rule, including those whose source is outside this repo. Do not commit. Then list each candidate, one per line, as applied or not applied, with its target file and, if not applied, why.` (`--wait`) and wait for the worker.
4. Add each applied candidate whose target file is outside the checkout to OUTSIDE (the run's list of outside changes: file, issue, one line on what changed). Add each candidate not applied to the friction log.

### 9. Store the lessons

Show phase `lessons`. Run `git status --porcelain`.

- Nothing changed: LESSONS is `none`. Go to step 10.
- Anything changed: prompt `/cprw lessons from #N` (`--wait`, no timeout) and wait for the worker. Do not add `[skip ci]`: a ruleset that requires checks blocks the merge of a PR whose checks never ran.

Find the PR URL in the worker's last 60 lines and confirm with `gh pr view <url> --json state`. If it is not MERGED, report the reason and stop. LESSONS is the PR URL. Run `git switch DEFAULT && git pull --ff-only`.

### 10. Report

1. Close the worker.
2. Run `gh issue list --state all --search "created:>=RUN_START" --json number,title` and add each issue not yet in the friction log as `filed #M title`. Workers file bugs they find outside their issue; the next pick takes them first.
3. Report one line: `#N -> <PR URL>, merged, QA <verdict>, review <verdict>, lessons <LESSONS>`.
4. If the operator asked you to pause, stop. Otherwise go back to step 1.

## Operator

- **Pause**: the operator can type into your pane while you work. A request to pause or stop means finish the current issue through step 10, then stop. A request to stop now means stop at once.
- **Friction log**: keep a running list across issues: each dialog and question you answered (issue, phase, what you chose), each `--wait` that returned `timeout` or `agent_prompt_stalled`, each restart of the worker outside steps 5 and 8, each unapplied retro candidate, each triage outcome other than READY, and each issue filed during the run. Print it when you stop; it is the operator's input for tuning this skill.
- **On stop**: send one macOS notification, then print the reason, the friction log, and OUTSIDE: each changed file with its issue and what changed, grouped by repo, then `git -C <repo> diff --stat` for each repo, so the operator can review and commit them. The operator is notified only here: when the run is finished, or when it needs them.
  - The queue is empty, LIMIT is reached, or the operator paused: title `PROJECT done`, body `<count> issues merged, <count> filed`.
  - Any other stop condition: title `PROJECT needs you`, body the reason.

  Pass the text as arguments, so quotes in a reason cannot break the script: `osascript -e 'on run argv' -e 'display notification (item 2 of argv) with title (item 1 of argv) sound name "Glass"' -e 'end run' "TITLE" "BODY"`.

## Stop conditions

Stop when: LIMIT issues merged, the operator paused, no issue is unblocked, triage left a bug untriaged, a spec found gaps on its second verification, `/implement` made no commits, a question stays open after three answer rounds, a dialog stays open after two answers, the worker asks to run an unsafe action, findings stay unfixed after `/fa`, the PR or the lessons PR does not merge, or any herdr or gh command fails. Leave the worker pane open when you stop, so the operator can inspect it.

## Rules

- One issue at a time. Start issue N+1 only after issue N and its lessons are merged.
- Run unattended. Never hand a question or dialog to the user; answer it as above.
- If a `--wait` returns `timeout` or `agent_prompt_stalled`, read the pane before you do anything, since the prompt may have landed.
