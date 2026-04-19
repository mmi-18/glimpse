import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/lib/types";

/**
 * Returns the `users` row for the current auth session, or null if signed out.
 */
export async function getCurrentUser(): Promise<UserRow | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();
  if (error || !data) return null;
  return data as UserRow;
}
