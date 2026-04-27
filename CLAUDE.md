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

## Deploys: Netlify

The app deploys to Netlify via the GitHub integration. `netlify.toml` at the
repo root sets `command = "npm run build"`, `publish = ".next"`, and lists the
`@netlify/plugin-nextjs` plugin (auto-installed by Netlify on detect).

**Env vars (set in Netlify dashboard → Site settings → Environment variables):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (mark as **Sensitive**; server-only, used by admin Supabase client + seed)

**Auth redirect setup (Supabase → Authentication → URL Configuration):**
- Site URL: the Netlify production URL
- Redirect URLs: include both `http://localhost:3000/**` and the Netlify URL

**Edge middleware (`src/middleware.ts`)** runs on Netlify Edge Functions for
the Supabase session refresh. Do not rename to `proxy.ts` (Next 16's Node-
runtime form) without verifying the Netlify Next plugin supports it on the
deployed plan.
