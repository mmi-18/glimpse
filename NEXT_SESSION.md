# Next session — pick up here

## Open question from Mario
His last message cut off mid-sentence:

> "next session we will make the picutres/textfke…"

Ask him to finish the thought. Probable interpretations:
- "make the pictures/text fields **editable after publishing**" → add `/edit-post/[id]` route
- "make the pictures/text fields **reorder-able** (drag-to-swap, not just resize)"
- "make the pictures/text fields **editable inside the feed tile preview**" — already possible in step 2 of the wizard, so probably not this
- something about AI-detection on upload (Schritt 10)

Confirm before building.

## What shipped last session

1. **Two-step publish wizard** — `/new-post` now has:
   - Step 1: full post layout builder
   - Step 2: preview-tile designer (inside a square container, 2-col mini-grid)
   - Publish writes both `cell_layout` (for post detail) and `preview_layout` (for feed tile)
2. **Feed tile `MiniMosaic`** — pure-CSS 2×2 grid renders each post's preview_layout inside a uniform feed card
3. **Profile customization for the owner** — Portfolio + About sections both gain a "Customize" button for the profile owner; resize tiles → Done saves as span-override map in `portfolio_layout` / `about_layout`
4. **Migrations applied via MCP**: `authoring_layouts` (0003) + `preview_layout` (0004) — both live in Supabase
5. **Voice memo** is profile-only; removed from new-post + menu
6. **Waveform is responsive** (flex-1 bars) — scales to any cell size
7. **Resize handle is bigger** (20×20, white ring, drop shadow) so it's discoverable
8. **CLAUDE.md** now has the "think like a UI/UX designer" directive pinned as the project working style

## Known technical follow-ups, prioritized

1. **Edit existing post** — `/edit-post/[id]` route. Reuse `PostEditor`, pre-fill from `post.cell_layout` + `post.preview_layout`. Add `updatePost` server action.
2. **Drag-to-reorder cells** — resize works; reorder is the missing gesture. Will need pointer-events swap logic in `SpanGrid` (Framer Motion `<Reorder>` doesn't handle 2D grids).
3. **Caption editor for image cells** — double-click or a small caption button inside the image cell.
4. **Post preview screenshot timeout in MCP** — Framer Motion layout animations seem to keep the headless browser "not idle" so `preview_screenshot` times out on post-detail pages. App itself works fine (HTML renders, all verified via eval). Non-blocker for users; annoying for me.
5. **Supabase Storage for uploaded images** — currently data-URLs embed in `posts.media_urls`. Fine for MVP demo but blows up row size for real use. Create a `posts` bucket + change upload flow in `post-editor.tsx`.
6. **Asset library (Schritt 8)** — one asset row referenced from many posts/profiles. Blocked by the Storage migration above.
7. **AI content-type & style detection (Schritt 10)** — on image upload, call Claude Haiku with the image and get back `{ content_type, suggested_industry, style_dimensions: {…} }`. Replaces the Details panel for most users.

## Quick sanity check at session start

- `npm run dev` → http://localhost:3000
- Log in as `kiri@seed.glimpse.app` / `glimpse-seed-2026`
- Feed should render; `+ New post` in top nav should be present
- `/creator/<own-id>` should show **Customize** buttons next to section headings

## Working style reminders (from CLAUDE.md)

- Mobile-first. Laptop = same layout, more columns.
- Defaults over options; Details panel for overrides.
- Before/After for any visible change before code.
- Apply migrations via Supabase MCP, not SQL-editor copy-paste.
- Four spans (1×1, 2×1, 1×2, 2×2) is a feature, not a limitation.
