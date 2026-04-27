"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { GridCell } from "@/components/grid/types";
import type { PostCellData } from "@/components/grid/cell-types";
import type { CreatorProfile } from "@/lib/types";

export type NewPostInput = {
  industry: string;
  content_type: string;
  cells: GridCell<PostCellData>[];
  /** Mini-mosaic shown inside the uniform feed tile. Can be empty. */
  previewCells: GridCell<PostCellData>[];
};

/**
 * Derive a post title from the cells: the first text cell's content,
 * truncated, falling back to null. (Earlier we distinguished headline vs
 * body variants; now there's only one text style — keep the heuristic
 * simple: use the first text cell.)
 */
function deriveTitle(cells: GridCell<PostCellData>[]): string | null {
  const text = cells.find((c) => c.data.kind === "text");
  if (text && text.data.kind === "text") {
    const t = text.data.content.trim();
    if (t) return t.slice(0, 120);
  }
  return null;
}

/**
 * Collect all text cell content + image captions into one string — used as
 * the post's `description`, and as the haystack for brief-keyword matching.
 */
function collectText(cells: GridCell<PostCellData>[]): string {
  const parts: string[] = [];
  for (const c of cells) {
    if (c.data.kind === "text") parts.push(c.data.content);
    else if (c.data.kind === "image" && c.data.caption)
      parts.push(c.data.caption);
  }
  return parts.join("\n").trim();
}

/**
 * Create a new portfolio post authored by the current user. Metadata
 * (content_type, industry, format, style_*) is inherited from the
 * creator's profile when not supplied — keeping the authoring UX minimal.
 */
export async function createPost(input: NewPostInput) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Not authenticated");

  // Load the creator's profile for style + fallback metadata
  const { data: profileData } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", authUser.id)
    .single();
  const profile = (profileData as CreatorProfile | null) ?? null;

  const media_urls = input.cells
    .filter((c) => c.data.kind === "image")
    .map((c) => (c.data as { kind: "image"; src: string }).src);

  const derivedTitle = deriveTitle(input.cells);
  const derivedDescription = collectText(input.cells) || null;

  // Inherit per-post metadata from profile defaults when the user hasn't
  // overridden them.
  const industry =
    input.industry || profile?.industry_experience?.[0] || null;
  const content_type =
    input.content_type || profile?.deliverable_types?.[0] || null;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: authUser.id,
      post_type: "portfolio_piece",
      title: derivedTitle,
      description: derivedDescription,
      media_urls,
      thumbnail_url: media_urls[0] ?? null,
      content_type,
      industry,
      format: "horizontal",
      // Inherit the 7 style dimensions from the creator's profile so the
      // post still participates in style-based matching. Users can refine
      // per-post later via AI detection (Schritt 10) or manual override.
      style_production_value: profile?.style_production_value ?? null,
      style_pacing: profile?.style_pacing ?? null,
      style_focus: profile?.style_focus ?? null,
      style_framing: profile?.style_framing ?? null,
      style_staging: profile?.style_staging ?? null,
      style_color: profile?.style_color ?? null,
      style_sound: profile?.style_sound ?? null,
      cell_layout: input.cells,
      preview_layout:
        input.previewCells.length > 0 ? input.previewCells : null,
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath("/feed");
  revalidatePath(`/creator/${authUser.id}`);
  redirect(`/post/${data!.id}`);
}
