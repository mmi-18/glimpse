"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CellSpan } from "@/components/grid/types";

/**
 * Profile layouts are stored as span-override maps: `{ cellId: span }`.
 *
 * Rationale: the cells themselves are derived from live DB state (posts,
 * reviews, etc.). Storing the full cell payload would go stale. Storing
 * only per-cell span overrides keeps the content fresh while preserving
 * whatever custom sizing the owner picked.
 */
export type LayoutOverrides = Record<string, CellSpan>;

export async function saveProfileLayout(args: {
  kind: "portfolio" | "about";
  overrides: LayoutOverrides;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const column = args.kind === "portfolio" ? "portfolio_layout" : "about_layout";
  const { error } = await supabase
    .from("creator_profiles")
    .update({ [column]: args.overrides })
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath(`/creator/${user.id}`);
  return { ok: true };
}
