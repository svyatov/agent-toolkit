import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dirname, "transcript.mjs");
const NOW = new Date().toISOString();

const user = (content, meta = false, ts = NOW) => ({ type: "user", isMeta: meta, timestamp: ts, message: { role: "user", content } });
const assistant = (...content) => ({ type: "assistant", timestamp: NOW, message: { role: "assistant", content } });
const call = (id, name, input) => ({ type: "tool_use", id, name, input });
const result = (id, text, error = false) => ({ type: "tool_result", tool_use_id: id, content: text, is_error: error });
const jsonl = (lines) => lines.map((l) => JSON.stringify(l)).join("\n") + "\n";

// Codex records.
const cx = (type, payload) => ({ timestamp: NOW, type, payload });
const cmsg = (role, text) => cx("response_item", { type: "message", role, content: [{ type: role === "assistant" ? "output_text" : "input_text", text }] });
const ccall = (id, name, input) => cx("response_item", { type: "custom_tool_call", call_id: id, name, input });
const cout = (id, text) => cx("response_item", { type: "custom_tool_call_output", call_id: id, output: [{ type: "input_text", text }] });
const skillBlock = (name) => cmsg("user", `<skill>\n<name>${name}</name>\n<path>/agents/skills/${name}/SKILL.md</path>\n---\nname: ${name}`);

let root, file, codexFile;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "debrief-"));
  const project = join(root, "projects", "-tmp-proj");
  mkdirSync(join(project, "s1", "subagents"), { recursive: true });
  file = join(project, "s1.jsonl");
  writeFileSync(file, jsonl([
    user("<command-name>/clear</command-name>"), // 1 built-in, not a skill
    user("<command-message>demo</command-message> <command-name>/demo:demo</command-name> <command-args>x</command-args>"), // 2
    user([{ type: "text", text: "Base directory for this skill: /skills/demo\n\n# Demo" }], true), // 3
    assistant(call("t1", "Bash", { command: "cat missing.txt" })), // 4
    user([result("t1", "Exit code 1\ncat: missing.txt: No such file", true)]), // 5
    assistant(call("t2", "Write", { file_path: "/x" })), // 6
    user([result("t2", "The user doesn't want to proceed with this tool use.", true)]), // 7
    user("no, write it under docs/"), // 8
    assistant(call("t3", "Agent", { description: "scan" })), // 9
    user([result("t3", "done")]), // 10
    assistant(call("t4", "Skill", { skill: "helper" })), // 11
    user([result("t4", "Launching skill: helper")]), // 12
    user([{ type: "text", text: "Base directory for this skill: /skills/helper" }], true), // 13
    user('<task-notification><summary>Agent "scan" finished</summary><result>long</result></task-notification>'), // 14
    user("[Request interrupted by user]"), // 15
    user("<command-name>/debrief-skill</command-name>"), // 16
    user([{ type: "text", text: "Base directory for this skill: /skills/debrief-skill" }], true), // 17
  ]));
  writeFileSync(join(project, "s1", "subagents", "agent-a1.meta.json"), JSON.stringify({ toolUseId: "t3", description: "scan" }));
  writeFileSync(join(project, "s1", "subagents", "agent-a1.jsonl"), jsonl([
    assistant(call("s1", "Grep", { pattern: "foo" })), // 1
    user([result("s1", "grep: bad regex", true)]), // 2
    assistant(call("s2", "Bash", { command: "rm x" })), // 3
    user([result("s2", "Permission to use Bash with command rm x has been denied.", true)]), // 4
  ]));
  // A session last used long ago: outside any --days window.
  writeFileSync(join(project, "s0.jsonl"), jsonl([
    user("<command-name>/old</command-name>", false, "2020-01-01T00:00:00Z"),
    user([{ type: "text", text: "Base directory for this skill: /skills/old" }], true, "2020-01-01T00:00:00Z"),
  ]));

  // Codex: one session with a $skill run, and a forked subagent that repeats its history.
  const day = join(root, "codex", "sessions", "2026", "09", "21");
  mkdirSync(day, { recursive: true });
  codexFile = join(day, "rollout-2026-09-21T10-00-00-c1.jsonl");
  writeFileSync(codexFile, jsonl([
    cx("session_meta", { id: "c1" }), // 1
    cmsg("user", "# AGENTS.md instructions for /proj"), // 2 injected, not the user
    cmsg("assistant", "Want me to plan it?"), // 3
    cmsg("user", "$wayfinder plan it"), // 4
    skillBlock("wayfinder"), // 5
    ccall("x1", "exec", "tools.exec_command({cmd: 'false'})"), // 6
    cout("x1", 'Script completed\nOutput:\n{"exit_code":1,"output":""}'), // 7
    ccall("x2", "apply_patch", "*** Begin Patch"), // 8
    cout("x2", "apply_patch verification failed: Failed to find expected lines"), // 9
    ccall("x3", "exec", "tools.exec_command({cmd: 'ls'})"), // 10
    cout("x3", "Script completed\nOutput:\nfine"), // 11
    cmsg("assistant", "Done with the map."), // 12
    cx("event_msg", { type: "turn_aborted", reason: "interrupted" }), // 13
    cmsg("user", "$other go"), // 14
    skillBlock("other"), // 15
  ]));
  writeFileSync(join(day, "rollout-2026-09-21T10-00-05-c2.jsonl"), jsonl([
    cx("session_meta", { id: "c2", forked_from_id: "c1", parent_thread_id: "c1", agent_path: "/root/worker" }), // 1
    cx("event_msg", { type: "task_started", turn_id: "parent-turn" }), // 2
    cmsg("user", "$wayfinder plan it"), // 3 copied from the parent
    ccall("y0", "exec", "copied"), // 4
    cout("y0", "Script failed\nScript error: copied from the parent"), // 5
    cx("event_msg", { type: "task_started", turn_id: "own-turn" }), // 6
    ccall("y1", "exec", "tools.exec_command({cmd: 'grep x'})"), // 7
    cout("y1", "Script failed\nScript error: boom"), // 8
  ]));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

const run = (...args) => execFileSync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, CLAUDE_CONFIG_DIR: root, CODEX_HOME: join(root, "codex") }, encoding: "utf8" });

test("runs lists skill invocations newest first, with full timestamps", () => {
  const out = run("runs");
  assert.ok(out.includes(`${NOW}\tdemo:demo\t${file}:2\t/skills/demo`));
  assert.ok(out.includes(`helper\t${file}:11\t/skills/helper`));
  assert.ok(!out.includes("clear"));
  assert.ok(!out.includes("debrief-skill"));
});

test("runs filters by skill name, session, and the run's own date", () => {
  assert.equal(run("runs", "--session", "s1", "demo").trim().split("\n").length, 1);
  assert.equal(run("runs", "--session", "other", "demo"), "");
  assert.ok(!run("runs", "--days", "30").includes("\told\t"));
  assert.ok(run("runs", "--session", "s0").includes("\told\t"));
});

test("runs lists this skill's own runs only when asked for by name", () => {
  assert.equal(run("runs", "--session", "s1", "debrief-skill").split("\t").slice(1).join("\t"), `debrief-skill\t${file}:16\t/skills/debrief-skill\n`);
});

test("show prints friction until the next command, one summary line per subagent", () => {
  const out = run("show", `${file}:2`);
  assert.match(out, /^L5 ERR Bash .*No such file/m);
  assert.match(out, /^L7 DENY Write/m);
  assert.match(out, /^L8 YOU no, write it under docs\//m);
  assert.match(out, /^ {2}SUB scan \S+agent-a1\.jsonl calls=2 errors=1 denied=1 stops=0$/m);
  assert.doesNotMatch(out, /^ {2}sub /m);
  assert.match(out, /^L13 SKILL \/skills\/helper/m);
  assert.match(out, /^L14 NOTE Agent "scan" finished$/m);
  assert.match(out, /^L15 STOP/m);
  assert.doesNotMatch(out, /^L16/m);
  assert.match(out, /calls=4 errors=1 denied=1 stops=1 you=1 sub_errors=1 sub_denied=1$/m);
});

test("show runs past a built-in command and ends at the next skill", () => {
  const f = join(root, "projects", "-tmp-proj", "s2.jsonl");
  writeFileSync(f, jsonl([
    user("<command-name>/demo</command-name>"), // 1
    user([{ type: "text", text: "Base directory for this skill: /skills/demo" }], true), // 2
    user("<command-name>/reload-plugins</command-name>"), // 3
    assistant(call("t1", "Bash", { command: "false" })), // 4
    user([result("t1", "Exit code 1", true)]), // 5
    user("<command-name>/other</command-name>"), // 6
    user([{ type: "text", text: "Base directory for this skill: /skills/other" }], true), // 7
  ]));
  const out = run("show", `${f}:1`);
  assert.match(out, /^L5 ERR Bash/m);
  assert.doesNotMatch(out, /^L6/m);
});

test("show ends at the given line of a START-END range", () => {
  const out = run("show", `${file}:2-7`);
  assert.match(out, /^L7 DENY Write/m);
  assert.doesNotMatch(out, /^L8/m);
  assert.match(out, /calls=2 errors=1 denied=1 stops=0 you=0/m);
});

test("show --subs adds each subagent's friction lines", () => {
  const out = run("show", `${file}:2`, "--subs");
  assert.match(out, /^ {2}sub L2 ERR Grep grep: bad regex/m);
  assert.match(out, /^ {2}sub L4 DENY Bash/m);
});

test("lines prints each line's timestamp, text, tool input, and tool result in full, up to the cap", () => {
  const out = run("lines", file, "4", "5", "8");
  assert.match(out, new RegExp(`^=== L4 ${NOW}\\n\\{"command":"cat missing.txt"\\}$`, "m"));
  assert.match(out, /^=== L5 \S+\nExit code 1\ncat: missing.txt: No such file$/m);
  assert.match(out, /^=== L8 \S+\nno, write it under docs\/$/m);
  assert.match(run("lines", file, "5", "--max", "4"), /^=== L5 \S+\nExit$/m);
});

test("runs lists Codex $skill runs and skips subagent copies", () => {
  assert.equal(run("runs", "wayfinder"), `${NOW}\twayfinder\t${codexFile}:4\t/agents/skills/wayfinder\n`);
  assert.equal(run("runs", "--session", "c1").trim().split("\n").length, 2);
});

test("show reads a Codex run", () => {
  const out = run("show", `${codexFile}:4`, "--subs");
  assert.match(out, /^L3 PREV Want me to plan it\?$/m);
  assert.match(out, /^L4 RUN \$wayfinder plan it$/m);
  assert.match(out, /^L5 SKILL \/agents\/skills\/wayfinder$/m);
  assert.match(out, /^L7 ERR exec .*"exit_code":1/m);
  assert.match(out, /^L9 ERR apply_patch apply_patch verification failed/m);
  assert.doesNotMatch(out, /^L11 ERR/m);
  assert.match(out, /^L12 SAY Done with the map\.$/m);
  assert.match(out, /^L13 STOP$/m);
  assert.match(out, /^ {2}SUB \/root\/worker \S+c2\.jsonl calls=1 errors=1 denied=0 stops=0$/m);
  assert.match(out, /^ {2}sub L8 ERR exec Script failed Script error: boom/m);
  assert.doesNotMatch(out, /copied from the parent/);
  assert.doesNotMatch(out, /^L14/m);
  assert.doesNotMatch(out, /AGENTS\.md/);
  assert.match(out, /calls=3 errors=2 denied=0 stops=1 you=0 sub_errors=1 sub_denied=0$/m);
});
