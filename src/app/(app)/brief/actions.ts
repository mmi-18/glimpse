"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveBrief(args: {
  title: string;
  description: string;
  referenceUrls: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Mark existing briefs inactive (we keep one active at a time for MVP)
  await supabase
    .from("briefs")
    .update({ active: false })
    .eq("user_id", user.id);

  const { error } = await supabase.from("briefs").insert({
    user_id: user.id,
    title: args.title,
    description: args.description,
    reference_image_urls: args.referenceUrls.filter(Boolean),
    active: true,
  });
  if (error) throw error;

  revalidatePath("/feed");
  revalidatePath("/brief");
  return { ok: true };
}

export async function clearBrief() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("briefs")
    .update({ active: false })
    .eq("user_id", user.id);

  revalidatePath("/feed");
  revalidatePath("/brief");
  return { ok: true };
}
