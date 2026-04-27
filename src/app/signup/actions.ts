"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SignupResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Creates a new user with email auto-confirmed (via admin key), then signs
 * them in server-side so the browser has a session cookie by the time we
 * redirect. Avoids the default Supabase email-confirmation round-trip.
 */
export async function createAccount(args: {
  email: string;
  password: string;
  displayName: string;
  userType: "creator" | "startup";
}): Promise<SignupResult> {
  const admin = createAdminClient();

  // Create user with email_confirm so no email round-trip is needed
  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    {
      email: args.email,
      password: args.password,
      email_confirm: true,
      user_metadata: {
        user_type: args.userType,
        display_name: args.displayName,
      },
    },
  );

  if (createErr) {
    // If user already exists, surface a friendly message
    if (createErr.message?.toLowerCase().includes("already")) {
      return { ok: false, error: "An account with this email already exists." };
    }
    return { ok: false, error: createErr.message };
  }

  if (!created.user) {
    return { ok: false, error: "Failed to create account" };
  }

  // Ensure the users row exists with the right type + display name
  // (the DB trigger inserts a default row; we overwrite to be safe)
  await admin.from("users").upsert({
    id: created.user.id,
    email: args.email,
    user_type: args.userType,
    display_name: args.displayName,
  });

  // Sign in server-side so cookies are set for the SSR client
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: args.email,
    password: args.password,
  });
  if (signInErr) return { ok: false, error: signInErr.message };

  return { ok: true };
}
