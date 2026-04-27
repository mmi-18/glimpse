"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveMembershipTier(tier: "free" | "pro") {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Not authenticated");

  const { data: urow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", authUser.id)
    .single();

  const { error } = await supabase
    .from("users")
    .update({ membership_tier: tier })
    .eq("id", authUser.id);
  if (error) throw error;

  const userType = (urow?.user_type ?? "creator") as "creator" | "startup";
  redirect(userType === "creator" ? "/onboarding/creator" : "/onboarding/startup");
}
