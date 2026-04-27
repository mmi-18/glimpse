import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MessageCircle,
  MapPin,
  Globe,
  Building2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MatchScoreBadge } from "@/components/feed/match-score-badge";
import { MessageDialog } from "@/components/messaging/message-dialog";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ImageCollage } from "@/components/feed/image-collage";
import { ReviewsSection } from "@/components/profile/reviews-section";
import { calculateMatchScore } from "@/lib/matching";
import type {
  CreatorProfile,
  IndustrySimilarityRow,
  PostRow,
  ReviewRow,
  StartupProfile,
  UserRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function humanize(s?: string | null) {
  if (!s) return "";
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function StartupProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("user_type", "startup")
    .single();
  if (!userData) notFound();
  const user = userData as UserRow;

  const [
    { data: profileData },
    { data: postsData },
    { data: reviewsData },
    { data: simData },
  ] = await Promise.all([
    supabase
      .from("startup_profiles")
      .select("*")
      .eq("user_id", id)
      .single(),
    supabase
      .from("posts")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select(
        "*, reviewer:reviewer_id(id, display_name, avatar_url)",
      )
      .eq("reviewed_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("industry_similarity").select("*"),
  ]);

  const profile = profileData as StartupProfile | null;
  const posts = (postsData ?? []) as PostRow[];
  const reviewsRaw = (reviewsData ?? []) as Array<
    ReviewRow & {
      reviewer: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
      };
    }
  >;
  const industryTable = (simData ?? []) as IndustrySimilarityRow[];

  // Compute match score if viewer is a creator
  let matchScore: number | null = null;
  if (currentUser && currentUser.user_type === "creator" && profile) {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .single();
    if (creatorProfile) {
      const res = calculateMatchScore({
        creator: creatorProfile as CreatorProfile,
        startup: profile,
        creatorUser: {
          languages: currentUser.languages,
          cultural_markets: currentUser.cultural_markets,
        },
        startupUser: {
          languages: user.languages,
          cultural_markets: user.cultural_markets,
        },
        industryTable,
      });
      matchScore = res?.totalScore ?? null;
    }
  }

  const reviews = reviewsRaw.map((r) => ({
    id: r.id,
    reviewer: r.reviewer,
    project_description: r.project_description,
    rating_overall: r.rating_overall,
    rating_reliability: r.rating_reliability,
    rating_quality: r.rating_quality,
    rating_collaboration: r.rating_collaboration,
    review_text: r.review_text,
    created_at: r.created_at,
  }));

  const avgOf = (key: keyof (typeof reviews)[number]) => {
    const nums = reviews
      .map((r) => r[key])
      .filter((v): v is number => typeof v === "number");
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  const avg = {
    overall: avgOf("rating_overall"),
    reliability: avgOf("rating_reliability"),
    quality: avgOf("rating_quality"),
    collaboration: avgOf("rating_collaboration"),
  };

  const isOwn = currentUser?.id === id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      {/* Header */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar src={user.avatar_url} name={user.display_name} size={96} />
        <div className="flex-1">
          <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
            {user.display_name}
          </h1>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {profile?.industry && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {humanize(profile.industry)}
              </span>
            )}
            {(user.location_city || user.location_country) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {[user.location_city, user.location_country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
            {profile?.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {matchScore != null && (
              <MatchScoreBadge score={matchScore} size="lg" />
            )}
            {!isOwn && (
              <MessageDialog
                recipientId={user.id}
                recipientName={user.display_name ?? "Startup"}
                matchScore={matchScore}
                isAuthenticated={!!currentUser}
                trigger={
                  <Button>
                    <MessageCircle className="size-4" /> Send message
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </section>

      {/* Briefs / job posts */}
      <section className="mt-10">
        <h2 className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.12em]">
          Briefs
        </h2>
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No briefs published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/post/${p.id}`}
                className="border-border bg-card group block overflow-hidden rounded-2xl border transition-colors hover:border-foreground/20"
              >
                {(p.media_urls?.length ?? 0) > 0 ? (
                  <ImageCollage
                    images={p.media_urls ?? []}
                    alt={p.title ?? "Brief"}
                    aspect="3/2"
                    className="!rounded-none w-full"
                  />
                ) : (
                  <div
                    className="from-warm via-surface to-background flex items-center justify-center bg-gradient-to-br"
                    style={{ aspectRatio: "3/2" }}
                  >
                    <Avatar
                      src={user.avatar_url}
                      name={user.display_name}
                      size={64}
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {p.title}
                  </p>
                  {p.industry && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {humanize(p.industry)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* About */}
      <section className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.12em]">
            About
          </h2>
          {profile?.brand_description && (
            <p className="text-sm leading-relaxed">
              {profile.brand_description}
            </p>
          )}
          {profile?.target_audience && profile.target_audience.length > 0 && (
            <div className="mt-5">
              <p className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                Target audience
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.target_audience.map((t) => (
                  <span
                    key={t}
                    className="bg-warm rounded-full px-3 py-1 text-xs"
                  >
                    {humanize(t)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile?.qualities_in_creator &&
            profile.qualities_in_creator.length > 0 && (
              <div className="mt-5">
                <p className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                  Looks for in creators
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.qualities_in_creator.map((t) => (
                    <span
                      key={t}
                      className="border-border rounded-full border px-3 py-1 text-xs"
                    >
                      {humanize(t)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          {profile?.project_goal && profile.project_goal.length > 0 && (
            <div className="mt-5">
              <p className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                Project goals
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.project_goal.map((t) => (
                  <span
                    key={t}
                    className="border-border rounded-full border px-3 py-1 text-xs"
                  >
                    {humanize(t)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(profile?.contact_person || profile?.contact_role) && (
            <div className="mt-5">
              <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                Contact
              </p>
              <p className="text-sm">
                {profile.contact_person}
                {profile.contact_role && (
                  <span className="text-muted-foreground">
                    {" — "}
                    {profile.contact_role}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          {user.bio && (
            <>
              <h2 className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.12em]">
                Pitch
              </h2>
              <div className="border-border bg-card rounded-2xl border p-5 text-sm leading-relaxed">
                {user.bio}
              </div>
            </>
          )}
          {currentUser?.user_type === "creator" && !isOwn && (
            <div className="border-border bg-warm mt-5 rounded-2xl p-5 text-sm leading-relaxed">
              <Sparkles className="text-foreground mb-2 h-4 w-4" />
              {matchScore != null && matchScore >= 0.6
                ? "Strong fit. Reach out to start a conversation."
                : "Open to outreach — say hi if your style fits."}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.12em]">
          Reviews
        </h2>
        <ReviewsSection reviews={reviews} avg={avg} />
      </section>

      {/* Account (owner only) */}
      {isOwn && (
        <section className="border-border mt-12 border-t pt-8">
          <h2 className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.12em]">
            Account
          </h2>
          <div className="border-border bg-card flex flex-col items-start gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {user.membership_tier === "pro" ? "Pro account" : "Free account"}
              </p>
            </div>
            <SignOutButton />
          </div>
        </section>
      )}
    </div>
  );
}
