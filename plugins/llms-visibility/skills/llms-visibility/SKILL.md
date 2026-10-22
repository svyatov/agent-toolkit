---
name: llms-visibility
description: Make websites, docs, and blogs readable to LLMs and AI agents with accessible HTML, crawl access, and linked discovery files.
disable-model-invocation: true
license: MIT
---

# Make a website visible to LLMs

Make the site's real answers discoverable and readable before adding alternate formats. Use [AgentReady](https://www.agentready.org/)'s find, read, then act order. Its MUST/SHOULD/MAY levels describe that specification, not universal provider requirements. Its studies support priorities, not guaranteed visibility gains on every site.

## 1. Establish scope and host controls

Identify representative pages and the questions they should answer: homepage, docs or articles, and pricing or setup when applicable. Determine whether agents only need to read or must complete product actions. An informational site needs no action API.

Inspect rendering, routing, robots rules, sitemap generation, and host controls before editing. Headers may come from `_headers`, `vercel.json`, a proxy, or a hosting control panel. Check deployed behavior with GET requests; repository configuration and HEAD responses alone do not prove what readers receive. Ask about panel or proxy access only when a needed control is absent from the repository. State which change that access would enable.

Finish with a baseline of observed failures and the smallest applicable changes. Preserve the owner's existing training policy and access restrictions; ask before changing an unknown policy.

## 2. Make public answers reachable

Audit `robots.txt` and CDN/WAF rules separately (AR-FIND-01). A permissive file cannot overcome a challenge page or 403. Prefer a wildcard policy for public content over a list of known bot names; inspect specific user-agent groups because they override the wildcard group.

Distinguish bot purposes:

- **Training:** GPTBot and ClaudeBot. Blocking training does not itself block search or user-requested retrieval.
- **Search:** OAI-SearchBot and Claude-SearchBot, plus independent search API crawlers.
- **User-requested retrieval:** ChatGPT-User and Claude-User. OpenAI says robots rules may not apply to ChatGPT-User; Anthropic documents that its bots honor them.

Verify current [OpenAI](https://developers.openai.com/api/docs/bots) and [Anthropic](https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) guidance before changing bot-specific rules. `robots.txt` is not access control; keep private content authenticated. Preserve deliberate training opt-outs. `Content-Signal` is optional, not an access fix; consult [the HTTP reference](references/http.md) if requested.

Publish canonical public pages in `sitemap.xml` and reference it from `robots.txt` (AR-FIND-03). Check listed URLs resolve to the intended pages.

Use a representative agent user-agent to inspect access, then seek actual verified-agent requests in server logs when available. A spoofed user-agent from a local machine does not prove real agents can reach the site. Validate identities using provider IP ranges or supported Web Bot Auth, not the user-agent string alone; keep unrelated security controls intact.

## 3. Put answers in the initial HTML

Fetch each representative page without running JavaScript. The answer must be visible text in the response (AR-READ-01), not only in hydration data, JSON-LD, images, or a client-side request. Use SSR, prerendering, or the existing static pipeline where needed.

Provide ordinary links from the homepage to relevant docs, product, pricing, and setup pages. Publish current answers at canonical first-party URLs. For pricing, include the actual published plans, free tier, billing periods, and limits in text; do not invent missing commercial facts. Use language-tagged fenced code in Markdown and equivalent semantic code blocks in HTML (AR-FIND-02, AR-READ-03/04/05/11).

Check missing paths return 404, or a valid redirect when a replacement exists. Throttling should return 429 with `Retry-After`, not a 200 challenge page (AR-READ-02). Check both the status and body; a successful status with an empty app shell still fails the reading test.

Add appropriate Schema.org JSON-LD where it describes the page's real facts and routes (AR-READ-08). Keep every critical fact in visible HTML too: text extractors may omit script elements. Structured data is supplementary, not proof an agent read it.

## 4. Link useful discovery resources

Ship `/llms.txt` as a short, described index of the most useful canonical pages (AR-READ-07):

```markdown
# Site Name

> What this site provides and who it serves.

## Documentation

- [Quickstart](https://example.com/docs/start): Installation and first request
- [Authentication](https://example.com/docs/auth): Credentials and scopes
```

Link it from a page agents already visit, such as the homepage footer or a resources section. Do the same for existing OpenAPI documents and relevant `.well-known` resources (AR-READ-06). Verify the links and their destination content; publishing a conventional path alone is insufficient discovery.

Markdown mirrors are optional (AR-READ-09). Add them when they reduce extraction cost or a target client needs them, after HTML works. Read [the HTTP reference](references/http.md) when adding `.md` routes, `Accept` negotiation, `Content-Signal`, or `/llms-full.txt`; it contains their implementation and verification rules. A standard alternate link or HTTP `Link` header is sufficient. A hidden LLM-only pointer is unnecessary.

An AI Catalog at `/.well-known/ai-catalog.json` is an emerging, optional discovery convention (AR-FIND-04). Consider it only for relevant existing agent resources and consumers; verify the current format before implementing and link it from the homepage. Do not fabricate endpoints to fill a catalog.

## 5. Assess action support only when applicable

For products agents should operate, identify the actual task and usable interface. AgentReady v2.0 requires an MCP server or CLI for its action conformance (AR-ACT-10). Assess that gap without silently expanding a visibility task into building an integration.

When action support is in scope, check authentication an agent can complete, documented scopes, a linked OpenAPI contract with operations and errors, and one end-to-end task through the intended interface. Consult current protocol documentation before implementation. Keep public docs access separate from authenticated product actions.

Treat WebMCP as a draft, feature-detected option for operating an existing web UI. MCP server cards, MCP Apps, NLWeb, and payment protocols are conditional additions, not a content-site checklist. Add payment support only for an authorized purchase workflow. Report applicable gaps separately from readability fixes.

## 6. Verify and report

Use GET requests against the deployed site when available:

```sh
curl -sS -L -D - https://example.com/docs/start
curl -sS -L -D - -A 'Claude-User/1.0' https://example.com/docs/start
curl -sS -D - https://example.com/this-path-does-not-exist
curl -sS -L -D - https://example.com/robots.txt
curl -sS -L -D - https://example.com/sitemap.xml
curl -sS -L -D - https://example.com/llms.txt
```

Confirm real answers, links, status codes, and declared representations. Follow a homepage link through the relevant docs and check that the requested question can be answered from fetched text. Verify throttling through a safe test or configuration evidence; do not induce a production rate-limit incident. Run the conditional HTTP checks only for features implemented.

Use a public scanner as a secondary diagnostic when useful: [is-agentic](https://is-agentic.com) for content essentials, [Ora](https://ora.ai) for broader product capabilities, or [Mintlify Agent Score](https://www.mintlify.com/score) for docs. Scanner weights differ from the specification; a score is not proof of answer quality or task completion. Review upstream before installing a scanner CLI.

Report what changed, which URLs and behaviors were verified, and any unverified deployment, real-agent access, or action capability. Keep local checks distinct from live evidence. Do not claim AgentReady conformance without checking every applicable MUST.

## Sources and maintenance

- [AgentReady v2.0](https://www.agentready.org/), read in full on 2026-10-22; [versioned specification](https://github.com/agentready-org/standard/blob/273d2d7c991f30cd0785415023801b03766abc67/spec/spec.md), MIT. Stable AR identifiers above distinguish required, recommended, and optional practices.
- [Original Evil Martians guide](https://evilmartians.com/chronicles/how-to-make-your-website-visible-to-llms.md), retained for optional Markdown delivery techniques. Import provenance remains in `sources.json`.

Recheck evolving protocol claims when using them. Prefer measured access and task outcomes over unsupported adoption claims, scanner-only fixes, or promised percentage gains from content changes.
