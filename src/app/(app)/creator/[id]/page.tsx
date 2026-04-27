import { notFound } from "next/navigation";
import { MessageCircle, MapPin, Languages } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MatchScoreBadge } from "@/components/feed/match-score-badge";
import { MessageDialog } from "@/components/messaging/message-dialog";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { ProfileContentGrid } from "@/components/profile/profile-content-grid";
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

  // Daily rate is blurred by default. We reveal it when:
  //   1. the viewer is the creator themselves, or
  //   2. the viewer is a logged-in company (startup) AND a conversation
  //      already exists with this creator — the "match" signal.
  let rateVisible = isOwn;
  if (!rateVisible && currentUser && currentUser.user_type === "startup") {
    const [a, b] = [currentUser.id, id].sort();
    const { count } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("participant_a", a)
      .eq("participant_b", b);
    rateVisible = (count ?? 0) > 0;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      {/* Section 1 — Profile header */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar src={user.avatar_url} name={user.display_name} size={96} />
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

      {/* Content grid — portfolio posts, about, voice, radar, reviews are all
          cells in a SpanGrid. User-editable in Schritt 9. */}
      <div className="mt-10">
        <ProfileContentGrid
          user={user}
          profile={profile}
          posts={posts}
          reviews={reviews}
          avg={avg}
          rateVisible={rateVisible}
          isOwner={isOwn}
          savedPortfolioLayout={profile?.portfolio_layout ?? null}
          savedAboutLayout={profile?.about_layout ?? null}
        />
      </div>
    </div>
  );
}
