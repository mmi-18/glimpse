@AGENTS.md

# Working style for this project

## Think like a UI/UX designer

Before writing code for anything user-facing, reason about the interaction from the user's perspective. That means:

- **Affordance first.** Is it obvious what the user can click, drag, or resize? If not, fix the affordance (size, contrast, label) before adding more features.
- **Defaults matter more than options.** The default state should work for 95% of users. Power-user controls collapse into "Details" / "Customize" panels.
- **Reduce the ask.** Strip every form field and setting that isn't essential. Inherit from existing state (creator profile, post context) before asking the user to fill it in.
- **Constraints are design.** The cell-spanning grid has exactly four spans (1×1, 2×1, 1×2, 2×2) for a reason — more options would not make it a better tool. Respect the system when extending it.
- **Mobile-first, laptop-more-of-it.** Smartphone is the primary surface; desktop is the same layout with more columns, not a new one. Never add hover-only interactions. Respect `env(safe-area-inset-*)`.
- **Show, don't tell.** For any non-obvious change, produce a before/after comparison (layout sketch, screenshot, cells JSON diff) before writing code.
- **Name things for users, not for engineers.** Section headings and button labels read in the user's voice ("Customize layout", not "Toggle edit mode").
- **Live preview wherever reasonable.** If the user is building something (post, brief, preview tile), the result should update as they type / drag / pick — no "click to preview" dead states.

When in doubt, ask the question "how would Trade Republic / Pinterest / Instagram handle this?" and apply that pattern with glimpse.'s visual language.

## Supabase migrations

Apply migrations via the Supabase MCP tool (`mcp__…__apply_migration`) directly. Don't ask the user to paste SQL into the dashboard unless the MCP tool is unavailable. Migration files in `supabase/migrations/` are the source of truth for schema history.

## Deploys: Cloudflare Workers via OpenNext

The app deploys to Cloudflare Workers (NOT Netlify, NOT Vercel) using
`@opennextjs/cloudflare`. The GitHub repo auto-deploys via Cloudflare
Workers Builds.

**Key files (do not break):**
- `wrangler.jsonc` — entry, compat date, compat flags, `vars`, asset binding
- `open-next.config.ts` — OpenNext adapter config
- `next.config.ts` — must keep `images.unoptimized: true` (no Cloudflare Images binding) and call `initOpenNextCloudflareForDev()`
- `public/_headers` — long-cache for `/_next/static/*` etc.
- `.dev.vars` — dev-only env (`NEXTJS_ENV=development`); gitignored
- `src/middleware.ts` — Edge runtime ONLY. **Do not rename to `proxy.ts`** — Next 16's Node-runtime `proxy.ts` is not yet supported by OpenNext on Cloudflare.

**Required compatibility flags in `wrangler.jsonc`:** `nodejs_compat`, `global_fetch_strictly_public`. Compat date ≥ `2024-09-23`.

**Image policy:** every `<Image>` route uses `unoptimized: true`. Don't try to set up Next's image optimizer — it doesn't run on Workers. If we ever want resizing, add a Cloudflare Images binding (paid) or a custom loader, but it's not the default path.

**Env vars:**
- Public (`NEXT_PUBLIC_*`) live in `wrangler.jsonc` `vars` and are committed.
- Secrets (`SUPABASE_SECRET_KEY`) are set in the Cloudflare dashboard or via `wrangler secret put`. Never commit secrets.

**Cloudflare Workers Builds (auto-deploy from GitHub) settings:**
- Build command: `npm run build:cloudflare`
- Output: `.open-next` (wrangler reads from `wrangler.jsonc`)
- Deploy command: `npx wrangler deploy` (CF runs this automatically after the build)

**npm scripts:**
- `npm run build:cloudflare` — build the Worker bundle
- `npm run preview:cloudflare` — local preview (Workers runtime)
- `npm run deploy:cloudflare` — manual deploy from local
- `npm run cf-typegen` — regenerate `cloudflare-env.d.ts`

**Common gotchas:**
- Node-only middleware: rename `proxy.ts` → `middleware.ts`, change `export async function proxy` → `export async function middleware`. OpenNext build will fail otherwise.
- A new server-side dependency that needs `fs`/`path`/`child_process`: it won't run on Workers. Either move the work to a script (`tsx scripts/foo.ts`) or use a Cloudflare-friendly equivalent.
- Server actions and route handlers are fine — they run on the Worker.
- The seed script (`scripts/seed.ts`) runs locally only; never deployed.
