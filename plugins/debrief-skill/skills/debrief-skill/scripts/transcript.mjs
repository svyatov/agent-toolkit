#!/usr/bin/env node
// Reads Claude Code and Codex session transcripts and prints skill runs.
//
//   transcript.mjs runs [--session ID] [--days N] [SKILL]
//     One line per skill run, newest first: timestamp, skill, file:line, skill directory.
//     Runs of debrief-skill itself are listed only when SKILL names it.
//   transcript.mjs show FILE:LINE[-END] [--subs]
//     The run that starts at LINE, up to the next skill invocation or END: the model's
//     last message before it, then every human message, tool call, error,
//     denial, interrupt, and oversized result, and one summary line per
//     subagent it dispatched. --subs adds each subagent's own friction lines.
//   transcript.mjs lines FILE LINE... [--max N]
//     Each LINE in full: its timestamp, text, tool input, and tool result blocks, each cut
//     at N characters (default 4000).
import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const ROOT = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "projects");
const CODEX = join(process.env.CODEX_HOME || join(homedir(), ".codex"), "sessions");
const DENIED = /^The user doesn't want to proceed|^Permission to use [\s\S]*denied/;
const FAILED = /^Script failed|"exit_code":\s*[1-9]|^Exit code: [1-9]|Process exited with code [1-9]|apply_patch verification failed/m;
const SELF = "debrief-skill";
const BIG = 30_000;

const squeeze = (text, max) => String(text ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const parts = (e) => (Array.isArray(e.message?.content) ? e.message.content : []);

function humanText(e) {
  if (e.type !== "user" || e.isMeta) return null;
  const c = e.message?.content;
  if (typeof c === "string") return c;
  const texts = parts(e).filter((p) => p?.type === "text").map((p) => p.text);
  return texts.length ? texts.join("\n") : null;
}

const command = (e) => e.cmd ?? humanText(e)?.match(/<command-name>\/?([^<]+)<\/command-name>/)?.[1] ?? null;

function skillDir(e) {
  if (e.type !== "user" || !e.isMeta) return null;
  const c = e.message?.content;
  const text = typeof c === "string" ? c : parts(e).map((p) => p?.text ?? "").join("");
  return text.match(/^Base directory for this skill: (\S+)/)?.[1] ?? null;
}

const skillCall = (e) => (e.type === "assistant" ? parts(e).find((p) => p?.name === "Skill")?.input?.skill ?? null : null);

// The directory a skill loaded from, found before the next human or model turn.
function loadedDir(after) {
  for (const [, x] of after) {
    const dir = skillDir(x);
    if (dir) return dir;
    if (humanText(x) || x.type === "assistant") return null;
  }
  return null;
}

const resultText = (r) => (typeof r.content === "string" ? r.content : (r.content ?? []).map((p) => p?.text ?? "").join("\n"));

function entries(file) {
  const list = readFileSync(file, "utf8").split("\n").map((l, i) => {
    try { return [i + 1, JSON.parse(l)]; } catch { return [i + 1, {}]; }
  });
  return list[0]?.[1].type === "session_meta" ? codex(list) : list;
}

// Maps Codex rollout records onto the Claude Code shapes the timeline reads.
function codex(list) {
  const meta = list[0][1].payload ?? {};
  // A forked subagent first repeats its parent's history, up to its own first turn.
  const own = meta.forked_from_id ? (list.filter(([, e]) => e.payload?.type === "task_started")[1]?.[0] ?? Infinity) : 0;
  let human = null;
  return list.map(([n, e]) => {
    const p = e.payload ?? {};
    const ts = e.timestamp;
    const text = Array.isArray(p.content) ? p.content.map((c) => c.text ?? "").join("\n") : "";
    if (n === 1 || n < own) return [n, n === 1 ? e : {}];
    if (e.type === "compacted") return [n, { type: "system", subtype: "compact_boundary" }];
    if (p.type === "turn_aborted" && p.reason === "interrupted") return [n, { type: "user", timestamp: ts, message: { content: "[Request interrupted by user]" } }];
    if (p.type === "message" && p.role === "user") {
      const skill = text.match(/^<skill>\s*<name>([^<]+)<\/name>\s*<path>([^<]+)<\/path>/);
      if (skill) {
        if (human) human.cmd ??= skill[1];
        return [n, { type: "user", isMeta: true, message: { content: `Base directory for this skill: ${dirname(skill[2])}` } }];
      }
      if (/^\s*(<|# AGENTS\.md instructions)/.test(text)) return [n, {}];
      human = { type: "user", timestamp: ts, message: { content: text } };
      return [n, human];
    }
    if (p.type === "message" && p.role === "assistant") return [n, { type: "assistant", timestamp: ts, message: { content: [{ type: "text", text }] } }];
    if (p.type === "custom_tool_call" || p.type === "function_call") {
      return [n, { type: "assistant", timestamp: ts, message: { content: [{ type: "tool_use", id: p.call_id, name: p.name, input: p.input ?? p.arguments }] } }];
    }
    if (/_call_output$/.test(p.type ?? "")) {
      const out = typeof p.output === "string" ? p.output : (p.output ?? []).map((o) => o.text ?? "").join("\n");
      return [n, { type: "user", message: { content: [{ type: "tool_result", tool_use_id: p.call_id, content: out, is_error: FAILED.test(out) }] } }];
    }
    return [n, {}];
  });
}

const codexFiles = () => (existsSync(CODEX) ? readdirSync(CODEX, { recursive: true }).filter((f) => f.endsWith(".jsonl")).map((f) => join(CODEX, f)) : []);

// The start of a file, enough to hold a Codex session_meta's ids and timestamp.
function head(file) {
  const buf = Buffer.alloc(8192);
  const fd = openSync(file, "r");
  const size = readSync(fd, buf, 0, buf.length, 0);
  closeSync(fd);
  return buf.toString("utf8", 0, size);
}

function runs(args) {
  let days = 30, session = null;
  while (args[0]?.startsWith("--")) {
    const flag = args.shift();
    if (flag === "--days") days = Number(args.shift());
    else session = args.shift();
  }
  const want = args[0];
  const since = Date.now() - days * 86_400_000;
  const sinceIso = new Date(since).toISOString();
  const projects = existsSync(ROOT) ? readdirSync(ROOT).map((d) => join(ROOT, d)) : [];
  const files = projects.flatMap((dir) =>
    session ? [join(dir, `${session}.jsonl`)].filter(existsSync)
      : statSync(dir).isDirectory() ? readdirSync(dir).filter((f) => f.endsWith(".jsonl")).map((f) => join(dir, f)).filter((f) => statSync(f).mtimeMs > since)
      : []);
  const codexRecent = codexFiles().filter((f) => (session ? f.endsWith(`-${session}.jsonl`) : statSync(f).mtimeMs > since));
  const found = [...files, ...codexRecent].flatMap((file) => {
    const list = entries(file);
    if (list[0]?.[1].payload?.parent_thread_id) return []; // a subagent: shown under its parent's run
    return list.flatMap(([n, e], idx) => {
      const name = command(e) ?? skillCall(e);
      if (!name) return [];
      const dir = loadedDir(list.slice(idx + 1, idx + 21));
      const short = name.split(":").at(-1);
      const ts = String(e.timestamp ?? "");
      if (!dir || (want ? ![name, short].includes(want) : short === SELF) || (!session && ts < sinceIso)) return [];
      return [[ts, name, `${file}:${n}`, dir]];
    });
  });
  found.sort((a, b) => b.join("\t").localeCompare(a.join("\t")));
  for (const row of found) console.log(row.join("\t"));
}

// Prints a transcript slice and returns its counts. level: "all", "friction", or "none".
function timeline(list, prefix = "", { level = "all", onAgent } = {}) {
  const names = {};
  const counts = { calls: 0, errors: 0, denied: 0, stops: 0, you: 0 };
  for (const [n, e] of list) {
    const out = (kind, text = "") => {
      if (level === "all" || (level === "friction" && ["ERR", "DENY", "STOP"].includes(kind))) console.log(`${prefix}L${n} ${kind} ${text}`.trimEnd());
    };
    const dir = skillDir(e);
    const text = humanText(e);
    if (dir) out("SKILL", dir);
    else if (e.type === "system" && e.subtype === "compact_boundary") out("COMPACT");
    else if (command(e)) out("RUN", squeeze(text, 600));
    else if (text != null) {
      if (/^\s*<(task-notification|local-command-|bash-)/.test(text)) {
        out("NOTE", squeeze(text.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? text, 200));
      } else if (text.startsWith("[Request interrupted")) {
        counts.stops++;
        out("STOP");
      } else {
        counts.you++;
        out("YOU", squeeze(text, 600));
      }
    }
    for (const p of parts(e)) {
      if (p?.type === "text" && e.type === "assistant") out("SAY", squeeze(p.text, 240));
      else if (p?.type === "tool_use") {
        counts.calls++;
        names[p.id] = p.name;
        out("CALL", `${p.name} ${squeeze(JSON.stringify(p.input), 200)}`);
        if (onAgent && ["Agent", "Task"].includes(p.name)) onAgent(p.id);
      } else if (p?.type === "tool_result") {
        const body = resultText(p);
        const name = names[p.tool_use_id] ?? "";
        if (DENIED.test(body)) {
          counts.denied++;
          out("DENY", name);
        } else if (p.is_error) {
          counts.errors++;
          out("ERR", `${name} ${squeeze(body, 400)}`);
        } else if (body.length > BIG || body.includes("Output too large")) {
          out("BIG", `${name} ${body.length} chars`);
        }
      }
    }
  }
  return counts;
}

function show(ref, subs) {
  const [, file, start, last] = ref.match(/^(.*):(\d+)(?:-(\d+))?$/);
  const all = entries(file);
  const said = ([, e]) => e.type === "assistant" && parts(e).some((p) => p?.type === "text");
  const prev = all.slice(0, Number(start) - 1).findLast(said);
  if (prev) console.log(`L${prev[0]} PREV ${squeeze(parts(prev[1]).map((p) => p?.text ?? "").join(" "), 240)}`);
  let list = all.slice(Number(start) - 1, last ? Number(last) : undefined);
  const stop = list.slice(1).findIndex(([, e], i) => command(e) && loadedDir(list.slice(i + 2, i + 22)));
  const end = stop >= 0 ? list[stop + 1][1].timestamp : "9";
  if (stop >= 0) list = list.slice(0, stop + 1);
  const subDir = join(file.replace(/\.jsonl$/, ""), "subagents");
  const metas = existsSync(subDir) ? readdirSync(subDir).filter((f) => f.endsWith(".meta.json")).map((f) => join(subDir, f)) : [];
  const subTotal = { errors: 0, denied: 0 };
  const sub = (label, path) => {
    const c = timeline(entries(path), "", { level: "none" });
    subTotal.errors += c.errors;
    subTotal.denied += c.denied;
    console.log(`  SUB ${label} ${path} calls=${c.calls} errors=${c.errors} denied=${c.denied} stops=${c.stops}`);
    if (subs) timeline(entries(path), "  sub ", { level: "friction" });
  };
  const counts = timeline(list, "", {
    onAgent: (toolId) => {
      for (const m of metas) {
        let meta;
        try { meta = JSON.parse(readFileSync(m, "utf8")); } catch { continue; }
        if (meta.toolUseId === toolId) sub(meta.description ?? "subagent", m.replace(/\.meta\.json$/, ".jsonl"));
      }
    },
  });
  const id = all[0][1].type === "session_meta" && all[0][1].payload?.id;
  if (id) {
    const begin = list[0][1].timestamp ?? "";
    for (const f of codexFiles()) {
      const h = head(f);
      const born = h.match(/"timestamp":"([^"]+)"/)?.[1] ?? "";
      if (!h.includes(`"parent_thread_id":"${id}"`) || born < begin || born > end) continue;
      const meta = entries(f)[0][1].payload ?? {};
      sub(meta.agent_path ?? meta.agent_nickname ?? "subagent", f);
    }
  }
  console.log(`${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" ")} sub_errors=${subTotal.errors} sub_denied=${subTotal.denied}`);
}

function lines(file, nums, max) {
  const all = entries(file);
  for (const n of nums) {
    const e = all[n - 1]?.[1] ?? {};
    const c = e.message?.content;
    const blocks = typeof c === "string" ? [c] : parts(e).map((p) =>
      p?.type === "tool_use" ? JSON.stringify(p.input) : p?.type === "tool_result" ? resultText(p) : p?.text ?? "");
    console.log(`=== L${n} ${e.timestamp ?? ""}\n${blocks.map((b) => b.slice(0, max)).join("\n")}`);
  }
}

const [mode, ...args] = process.argv.slice(2);
if (mode === "runs") runs(args);
else if (mode === "show" && args[0]) show(args[0], args.includes("--subs"));
else if (mode === "lines" && args[0]) {
  const i = args.indexOf("--max");
  const max = i >= 0 ? Number(args.splice(i, 2)[1]) : 4000;
  lines(args[0], args.slice(1).map(Number), max);
} else {
  console.error("usage: transcript.mjs runs [--session ID] [--days N] [SKILL] | show FILE:LINE[-END] [--subs] | lines FILE LINE... [--max N]");
  process.exit(1);
}
