---
name: astro
description: Skill for building with the Astro web framework (v6+). Covers component authoring, islands architecture (client and server islands), content collections with loaders, actions, sessions, view transitions, middleware, on-demand rendering (SSR), adapters, and project configuration. Use when the user works with Astro, mentions .astro files, asks about static site generation (SSG), islands architecture, content collections, server islands, actions, view transitions, deploying an Astro project, or upgrading Astro.
---

# Astro

Astro is the web framework for content-driven websites. It uses islands architecture and a server-first design to ship fast, static HTML with opt-in interactive JavaScript islands.

**Always consult the official docs for the latest API details.** Fetch `https://docs.astro.build/llms-small.txt` for an abridged reference, or `https://docs.astro.build/llms-full.txt` for the complete documentation.

## Quick Reference

### Prerequisites

- **Node.js** v22.12.0 or higher (odd-numbered versions like v23 are not supported)
- **Package manager**: npm, pnpm, yarn, or [bun](https://docs.astro.build/en/recipes/bun/)

### CLI Commands

```sh
npx astro dev        # Start dev server
npx astro build      # Production build
npx astro check      # Type and config error checking
npx astro add <pkg>  # Add an integration (adapter, framework, etc.)
npx astro sync       # Generate TypeScript types for all Astro modules
```

### Project Structure

```
src/
  pages/       # Required — defines all pages and routes (file-based routing)
  components/  # Reusable components (convention)
  layouts/     # Layout components (convention)
  content/     # Local content for collections (convention)
  actions/     # Server actions (convention)
  middleware.ts
public/          # Static assets copied as-is to build output
astro.config.ts  # Configuration (also .js, .mjs, .cjs)
tsconfig.json
src/content.config.ts  # Content collection definitions
```

### Config Example

```ts
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  // output: 'server',  // opt all pages into on-demand rendering
});
```

---

## Components

Astro components (`.astro`) have two parts separated by a code fence (`---`):

```astro
---
// Component Script — runs on the server only, never sent to the browser
import Card from '../components/Card.astro';
const { title } = Astro.props;
---
<!-- Component Template — HTML + JS expressions -->
<h1>{title}</h1>
<Card title="Hello" body="World" />

<style>
  /* Scoped to this component by default */
  h1 { color: orange; }
</style>
```

**Key points:**
- Props via `Astro.props`; type with a `Props` interface in the frontmatter
- `<slot />` for children, named slots with `<slot name="x" />` and `slot="x"` on children
- Scoped `<style>` by default (use `is:global` for global styles)
- No client-side runtime — components render to static HTML

---

## Islands Architecture

Astro renders all UI to static HTML by default. Interactive components ("islands") are opt-in via directives.

### Client Islands

Add a `client:*` directive to any framework component (React, Svelte, Vue, Solid, Preact) to hydrate it on the client:

```astro
<ReactCounter client:load />       <!-- Hydrate immediately on page load -->
<Chart client:idle />              <!-- Hydrate when browser is idle -->
<Carousel client:visible />        <!-- Hydrate when scrolled into view -->
<Modal client:media="(max-width: 768px)" />  <!-- Hydrate on media query match -->
<Widget client:only="react" />     <!-- Client-only, skip server render -->
```

Only `client:*` components ship JavaScript. Everything else is zero-JS static HTML.

### Server Islands

Defer server rendering of slow or personalized components without blocking the page:

```astro
---
import Avatar from '../components/Avatar.astro';
---
<Avatar server:defer>
  <GenericAvatar slot="fallback" />  <!-- shown while island loads -->
</Avatar>
```

Server islands require an adapter. They can access cookies, sessions, and other SSR features. Props must be serializable. Use the `Referer` header to access the parent page URL from within a server island.

---

## Content Collections

Content collections provide type-safe, queryable content from any source. Defined in `src/content.config.ts`.

### Build-Time Collections

```ts
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

**Built-in loaders:**
- `glob()` — directory of Markdown, MDX, Markdoc, JSON, YAML, or TOML files
- `file()` — single data file (JSON, YAML, TOML)

**Querying:**

```astro
---
import { getCollection, getEntry } from 'astro:content';
const posts = await getCollection('blog', ({ data }) => !data.draft);
const post = await getEntry('blog', 'my-post');
const { Content } = await post.render();
---
<Content />
```

### Live Collections

Fetch data at request time instead of build time — useful for frequently changing data:

```ts
const inventory = defineCollection({
  loader: myLiveLoader({ apiUrl: '...' }),
  schema: z.object({ /* ... */ }),
});
```

Query with `getLiveCollection()` and `getLiveEntry()`.

---

## Actions

Type-safe server functions callable from the client or server. Defined in `src/actions/index.ts`.

```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
  addToCart: defineAction({
    input: z.object({ productId: z.string() }),
    handler: async (input, ctx) => {
      // Access cookies, sessions via ctx
      return { success: true };
    },
  }),
};
```

**Client usage:**

```astro
<script>
import { actions } from 'astro:actions';
const { data, error } = await actions.addToCart({ productId: '123' });
</script>
```

**Form usage** — set `accept: 'form'` and use `method="POST"` with `action={actions.myAction}` for zero-JS form submissions. Use `Astro.getActionResult()` to handle server-side results.

Actions are public endpoints (`/_actions/<name>`) — always validate authorization in the handler.

---

## Sessions

Server-side data storage across requests (v5.7+). Requires an adapter and a storage driver.

```astro
---
export const prerender = false;
const cart = await Astro.session?.get('cart');
await Astro.session?.set('cart', [...(cart || []), newItem]);
---
```

Available on `Astro.session` in components, `context.session` in endpoints/middleware/actions. Node, Cloudflare, and Netlify adapters configure a default driver automatically.

---

## On-Demand Rendering (SSR)

By default, all pages are pre-rendered (static). To render on demand:

1. Add an adapter: `npx astro add netlify` (or `node`, `vercel`, `cloudflare`)
2. Opt individual pages out of prerendering:

```astro
---
export const prerender = false;
---
```

Or set `output: 'server'` in config to server-render all pages by default, then opt static pages in with `export const prerender = true`.

SSR features: `Astro.cookies`, `Astro.request`, `Astro.response`, `Astro.redirect()`, HTML streaming.

---

## Middleware

Intercept requests/responses. File: `src/middleware.ts`.

```ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = await getUser(context.cookies);
  return next();
});
```

Chain middleware with `sequence()`. Use `context.rewrite()` for rewrites. `context.locals` is available in all components via `Astro.locals`.

---

## View Transitions

Client-side page transitions with the `<ClientRouter />` component:

```astro
---
import { ClientRouter } from 'astro:transitions';
---
<head>
  <ClientRouter />
</head>
```

**Directives:**
- `transition:name="hero"` — pair elements across pages for animation
- `transition:animate="slide"` — built-in animations: `fade` (default), `slide`, `none`, `initial`
- `transition:persist` — keep element state across navigations (e.g., video players, counters)

**Programmatic navigation:**

```ts
import { navigate } from 'astro:transitions/client';
navigate('/new-page');
```

Use `data-astro-reload` on links to force full-page navigation. Lifecycle events: `astro:before-preparation`, `astro:after-preparation`, `astro:before-swap`, `astro:after-swap`, `astro:page-load`.

---

## Framework Components

Astro supports React, Preact, Svelte, Vue, Solid, Alpine, and web components. Install via `npx astro add react` (etc.).

```astro
---
import ReactComponent from '../components/Counter.jsx';
import SvelteWidget from '../components/Widget.svelte';
---
<!-- Static by default — add client:* to hydrate -->
<ReactComponent client:load />
<SvelteWidget />  <!-- renders to static HTML, no JS shipped -->
```

You can mix multiple frameworks on the same page. Framework components can't import `.astro` components, but `.astro` components can pass children to framework components via slots.

---

## Adapters

Enable on-demand rendering by deploying to a server runtime:

```sh
npx astro add vercel    # or: node, netlify, cloudflare
```

Each adapter may also enable platform-specific features (e.g., Netlify Image CDN, Cloudflare KV for sessions).

---

## Astro v6 Key Changes

- **Node.js 22.12.0+** required (Node 18 and 20 dropped)
- **Vite 7** and **Zod 4** — Zod string validators moved to top-level: `z.email()` instead of `z.string().email()`; error messages use `error:` instead of `message:`
- **`import.meta.env`** values always inlined, never coerced — use `process.env` for server-only secrets
- **Images**: cropping by default when both `width` and `height` set; never upscales
- **Endpoints with file extensions** no longer accessible with trailing slash
- **Shiki 4** for syntax highlighting
- Use `@astrojs/upgrade` to upgrade: `npx @astrojs/upgrade`

## Resources

- [Docs](https://docs.astro.build)
- [Config Reference](https://docs.astro.build/en/reference/configuration-reference/)
- [llms.txt](https://docs.astro.build/llms.txt)
- [API Reference (llms)](https://docs.astro.build/_llms-txt/api-reference.txt)
- [GitHub](https://github.com/withastro/astro)
