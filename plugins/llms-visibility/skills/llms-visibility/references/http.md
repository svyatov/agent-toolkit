# Optional HTTP and Markdown delivery

Read this when implementing alternate representations or content-use signals. These supplement accessible HTML; none is a prerequisite for an informational site's AgentReady conformance.

## Markdown routes and discovery

Generate HTML and Markdown from one source. Add `.md` routes for selected useful pages, with `Content-Type: text/markdown; charset=utf-8`. Confirm the deployed GET response: static hosts may serve unknown extensions as `application/octet-stream`.

Advertise the alternate from the corresponding HTML page with either mechanism, or both if the host supports them:

```html
<link rel="alternate" type="text/markdown" href="/docs/start.md">
```

```http
Link: </docs/start.md>; rel="alternate"; type="text/markdown"
```

An optional reciprocal link on Markdown points to the HTML URL with `type="text/html"`. Distinct fixed URLs alone do not require `Vary: Accept`; add it where the response actually varies by that header. Avoid separate content stores and user-agent-specific articles.

## Accept negotiation

Implement only when useful to the target clients and the host can control routing and headers. At a negotiated URL:

- Parse media ranges and quality values, including specificity and `q=0` exclusions. Substring matching is incorrect.
- Prefer the acceptable representation with the higher quality. For equal quality, an explicitly requested `text/markdown` may win; otherwise retain HTML for absent `Accept` or `*/*`. This tie policy is a local choice, not an HTTP requirement.
- If neither representation is acceptable, this skill's negotiated-route policy is 406. Keep explicit `.md` and `.txt` routes deterministic instead of applying HTML negotiation to them.
- Set `Vary: Accept` on both negotiated representations, merging existing `Vary` fields. Preserve other response headers and check cache behavior in both request orders.

Use the same article and canonical destination in both representations. Test these cases against a known page, inspecting body, status, `Content-Type`, and `Vary`:

| Accept | Expected negotiated response |
| --- | --- |
| absent or `*/*` | HTML |
| `text/markdown` | Markdown |
| `text/html, text/markdown;q=0.5` | HTML |
| `text/markdown, text/html` | Markdown under the explicit tie policy |
| `text/markdown;q=0, */*;q=1` | HTML |
| `text/html;q=0, text/markdown;q=0, */*;q=1` | 406 |
| `application/json` | 406 |

For example:

```sh
curl -sS -D - -H 'Accept: text/markdown' https://example.com/docs/start
curl -sS -D - -H 'Accept: text/html, text/markdown;q=0.5' https://example.com/docs/start
curl -sS -D - -H 'Accept: text/markdown;q=0, */*;q=1' https://example.com/docs/start
```

See [HTTP negotiation semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1) and [Markdown media type](https://www.rfc-editor.org/rfc/rfc7763.html). An HTTP server may disregard an unsatisfiable `Accept`; 406 above is the chosen implementation behavior, not a universal mandate.

## Content-use signals

`Content-Signal` is Cloudflare's content-use convention, separate from fetch permission. Consult [its current documentation](https://contentsignals.org/) before implementation. Preserve the owner's choices for `search`, `ai-input`, and `ai-train`; ask when unknown. Never add `ai-train=yes` as an incidental visibility change. Unknown directives do not replace standard `Allow`/`Disallow` rules, and the signal alone does not prove crawler compliance.

## Full-text export and analytics

Offer `/llms-full.txt` only when a combined corpus helps a known use case. Generate it from the same public sources, keep its scope and size explicit, and link it from `/llms.txt`. A homepage-only export should be labeled as such rather than presented as the complete site. Do not promise a traffic multiplier.

If measurement is wanted, use server-side request logs for Markdown and discovery files. User-agent strings and referrers are hints, not verified identities; distinguish crawler requests, human referrals, and actual downstream citations or completed tasks.
