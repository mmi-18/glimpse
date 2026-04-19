import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, MapPin, Languages } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MatchScoreBadge } from "@/components/feed/match-score-badge";
import { MessageDialog } from "@/components/messaging/message-dialog";
import { ImageCollage } from "@/components/feed/image-collage";
import { ReviewsSection } from "@/components/profile/reviews-section";
import { StyleRadar } from "@/components/profile/style-radar";
import { Button } from "@/components/ui/button";
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
  return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function CreatorProfilePage({
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
    .eq("user_type", "creator")
    .single();
  if (!userData) notFound();
  const user = userData as UserRow;

  const [{ data: profileData }, { data: postsData }, { data: reviewsData }, { data: simData }] =
    await Promise.all([
      supabase
        .from("creator_profiles")
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
        .select("*, reviewer:reviewer_id(id, display_name, avatar_url)")
        .eq("reviewed_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("industry_similarity").select("*"),
    ]);

  const profile = profileData as CreatorProfile | null;
  const posts = (postsData ?? []) as PostRow[];
  const reviewsRaw = (reviewsData ?? []) as Array<
    ReviewRow & {
      reviewer: { id: string; display_name: string | null; avatar_url: string | null };
    }
  >;
  const industryTable = (simData ?? []) as IndustrySimilarityRow[];

  // Match score if viewer is a startup
  let matchScore: number | null = null;
  if (currentUser && currentUser.user_type === "startup" && profile) {
    const { data: startupProfile } = await supabase
      .from("startup_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .single();
    if (startupProfile) {
      const res = calculateMatchScore({
        creator: profile,
        startup: startupProfile as StartupProfile,
        creatorUser: {
          languages: user.languages,
          cultural_markets: user.cultural_markets,
        },
        startupUser: {
          languages: currentUser.languages,
          cultural_markets: currentUser.cultural_markets,
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

  const avgOf = (key: keyof typeof reviews[number]) => {
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
      {/* Section 1 — Profile header */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {user.avatar_url && (
          <Image
            src={user.avatar_url}
            alt={user.display_name ?? ""}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full border border-border"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
            {user.display_name}
          </h1>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {(user.location_city || user.location_country) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {[user.location_city, user.location_country].filter(Boolean).join(", ")}
              </span>
            )}
            {user.languages && user.languages.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5" />
                {user.languages.join(" / ")}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {matchScore != null && <MatchScoreBadge score={matchScore} size="lg" />}
            {!isOwn && (
              <MessageDialog
                recipientId={user.id}
                recipientName={user.display_name ?? "Creator"}
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

      {/* Section 2 — Portfolio grid */}
      <section className="mt-12">
        <h2 className="mb-5 text-lg font-medium">Portfolio</h2>
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No portfolio pieces yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/post/${p.id}`}
                className="group block"
              >
                <ImageCollage
                  images={p.media_urls ?? []}
                  alt={p.title ?? "Portfolio piece"}
                />
                <p className="mt-2 text-sm font-medium">{p.title}</p>
                {p.industry && (
                  <p className="text-muted-foreground text-xs">
                    {humanize(p.industry)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — About + Reviews */}
      <section className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-5 text-lg font-medium">About</h2>
          {(user.bio || profile?.creative_philosophy) && (
            <p className="text-sm leading-relaxed">
              {user.bio ?? profile?.creative_philosophy}
            </p>
          )}
          {profile?.content_style_tags && profile.content_style_tags.length > 0 && (
            <div className="mt-5">
              <p className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                Style
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.content_style_tags.map((t) => (
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
          {profile?.deliverable_types && profile.deliverable_types.length > 0 && (
            <div className="mt-5">
              <p className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                Delivers
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.deliverable_types.map((t) => (
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
          {profile?.industry_experience && profile.industry_experience.length > 0 && (
            <div className="mt-5">
              <p className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                Industry experience
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.industry_experience.map((t) => (
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
          {profile?.rate_min != null && profile?.rate_max != null && (
            <div className="mt-5">
              <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                Daily rate
              </p>
              <p className="text-sm">
                €{profile.rate_min} – €{profile.rate_max}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {profile && profile.style_production_value != null && (
            <>
              <h2 className="mb-5 text-lg font-medium">Style signature</h2>
              <div className="border-border bg-card rounded-2xl border p-5">
                <StyleRadar vector={profile} />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-lg font-medium">Reviews</h2>
        <ReviewsSection reviews={reviews} avg={avg} />
      </section>
    </div>
  );
}
