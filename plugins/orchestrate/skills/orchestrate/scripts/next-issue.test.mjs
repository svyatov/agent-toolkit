import { test } from "node:test";
import assert from "node:assert/strict";
import { pick } from "./next-issue.mjs";

const issue = (number, { state = "open", labels = ["ready-for-agent"], body = "", author = "OWNER", ...extra } = {}) => ({
  number, title: `t${number}`, state, body,
  labels: labels.map((name) => ({ name })), assignees: [], author_association: author,
  issue_dependencies_summary: { blocked_by: 0 }, sub_issues_summary: { total: 0 },
  ...extra,
});

const picked = (issues) => pick(issues, "ready-for-agent", "bug", "needs-triage");
const numbers = (issues) => picked(issues).map((i) => i.number);

test("names the stage of each issue", () => {
  const issues = [issue(1), issue(2, { labels: ["bug", "needs-triage"] }), issue(3, { labels: [], sub_issues_summary: { total: 1, completed: 1 } })];
  assert.deepEqual(picked(issues).map((i) => [i.number, i.stage]), [[3, "spec"], [2, "triage"], [1, "ready"]]);
});

test("a spec whose sub-issues are all done comes before bugs", () => {
  const spec = issue(10, { labels: [], sub_issues_summary: { total: 2, completed: 2 } });
  assert.deepEqual(numbers([issue(1), issue(4, { labels: ["bug", "ready-for-agent"] }), spec]), [10, 4, 1]);
});

test("a spec named as parent waits for its open children", () => {
  const spec = issue(10, { labels: [] });
  assert.deepEqual(numbers([spec, issue(11, { body: "## Parent\n\n#10" }), issue(12, { state: "closed", body: "## Parent\n\n#10" })]), [11]);
  assert.deepEqual(numbers([spec, issue(11, { state: "closed", body: "## Parent\n\n#10" })]), [10]);
});

test("drops specs with open sub-issues and specs from outsiders", () => {
  assert.deepEqual(numbers([
    issue(10, { labels: [], sub_issues_summary: { total: 2, completed: 1 } }),
    issue(11, { labels: [], author: "NONE", sub_issues_summary: { total: 1, completed: 1 } }),
  ]), []);
});

test("keeps ready issues lowest first", () => {
  assert.deepEqual(numbers([issue(3), issue(2)]), [2, 3]);
});

test("bugs come first, lowest first", () => {
  assert.deepEqual(numbers([issue(1), issue(2), issue(5, { labels: ["bug", "ready-for-agent"] }), issue(4, { labels: ["bug", "ready-for-agent"] })]), [4, 5, 1, 2]);
});

test("keeps untriaged bugs from the repo team", () => {
  assert.deepEqual(numbers([issue(1), issue(3, { labels: ["bug", "needs-triage"], author: "COLLABORATOR" })]), [3, 1]);
});

test("drops untriaged bugs from outsiders and untriaged enhancements", () => {
  assert.deepEqual(numbers([
    issue(1),
    issue(2, { labels: ["bug", "needs-triage"], author: "NONE" }),
    issue(3, { labels: ["enhancement", "needs-triage"] }),
    issue(4, { labels: ["bug", "needs-info"] }),
  ]), [1]);
});

test("drops closed, unlabelled, assigned, and pull requests", () => {
  assert.deepEqual(numbers([
    issue(1, { state: "closed" }),
    issue(2, { labels: [] }),
    issue(3, { assignees: [{ login: "x" }] }),
    issue(4, { pull_request: {} }),
  ]), []);
});

test("drops native blockers and parents with sub-issues", () => {
  assert.deepEqual(numbers([
    issue(1, { issue_dependencies_summary: { blocked_by: 1 } }),
    issue(2, { sub_issues_summary: { total: 2 } }),
  ]), []);
});

test("drops issues named as a parent", () => {
  assert.deepEqual(numbers([issue(1), issue(2, { body: "## Parent\n\n#1" })]), [2]);
});

test("a Blocked by line counts only open blockers", () => {
  const issues = [
    issue(1, { state: "closed" }),
    issue(2, { labels: [] }),
    issue(3, { body: "Blocked by: #1" }),
    issue(4, { body: "Blocked by: #1, #2" }),
  ];
  assert.deepEqual(numbers(issues), [3]);
});

test("missing summaries and body are treated as empty", () => {
  const bare = issue(1, { body: null });
  delete bare.issue_dependencies_summary;
  delete bare.sub_issues_summary;
  assert.deepEqual(numbers([bare]), [1]);
});
