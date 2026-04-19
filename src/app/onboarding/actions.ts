"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type CreatorPayload = {
  display_name: string;
  location_city: string;
  location_country: string;
  languages: string[];
  cultural_markets: string[];
  profile: Record<string, unknown>;
};

type StartupPayload = {
  display_name: string;
  location_city: string;
  location_country: string;
  languages: string[];
  cultural_markets: string[];
  profile: Record<string, unknown>;
};

export async function saveCreatorOnboarding(payload: CreatorPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: uErr } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
    user_type: "creator",
    display_name: payload.display_name,
    location_city: payload.location_city,
    location_country: payload.location_country,
    languages: payload.languages,
    cultural_markets: payload.cultural_markets,
    onboarding_completed: true,
    avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(payload.display_name)}`,
  });
  if (uErr) throw uErr;

  const { error: pErr } = await supabase
    .from("creator_profiles")
    .upsert({ user_id: user.id, ...payload.profile });
  if (pErr) throw pErr;

  redirect("/feed");
}

export async function saveStartupOnboarding(payload: StartupPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: uErr } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
    user_type: "startup",
    display_name: payload.display_name,
    location_city: payload.location_city,
    location_country: payload.location_country,
    languages: payload.languages,
    cultural_markets: payload.cultural_markets,
    onboarding_completed: true,
    avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(payload.display_name)}`,
  });
  if (uErr) throw uErr;

  const { error: pErr } = await supabase
    .from("startup_profiles")
    .upsert({
      user_id: user.id,
      contact_email: user.email,
      ...payload.profile,
    });
  if (pErr) throw pErr;

  redirect("/feed");
}
