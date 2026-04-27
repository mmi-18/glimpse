import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PostCard } from "@/components/feed/post-card";
import { HighlightedCard } from "@/components/feed/highlighted-card";
import { calculateMatchScore, calculatePostMatchScore } from "@/lib/matching";
import type {
  BriefRow,
  CreatorProfile,
  IndustrySimilarityRow,
  PostRow,
  StartupProfile,
  UserRow,
} from "@/lib/types";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

type FeedItem = {
  post: PostRow;
  author: Pick<
    UserRow,
    | "id"
    | "display_name"
    | "avatar_url"
    | "user_type"
    | "location_city"
    | "cultural_markets"
    | "languages"
  >;
  authorCategories: string[];
  matchScore: number | null;
  topPick: boolean;
};

function humanize(s?: string | null) {
  if (!s) return "";
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildBriefTagSet(brief: BriefRow | null): Set<string> {
  if (!brief) return new Set();
  const haystack = `${brief.title} ${brief.description}`.toLowerCase();
  const candidates = [
    "outdoor",
    "lifestyle",
    "automotive",
    "motorcycle",
    "luxury",
    "sustainability",
    "food",
    "maritime",
    "sailing",
    "music",
    "concert",
    "event",
    "travel",
    "adventure",
    "nature",
    "tech",
    "product",
    "industrial",
    "editorial",
    "fashion",
    "architecture",
    "real_estate",
    "battery",
    "energy",
    "corporate",
  ];
  const set = new Set<string>();
  for (const c of candidates) {
    if (haystack.includes(c)) set.add(c);
  }
  return set;
}

function postMatchesBriefTags(
  post: PostRow,
  authorCategories: string[],
  tags: Set<string>,
): boolean {
  if (tags.size === 0) return false;
  const pool = [
    ...(authorCategories ?? []),
    post.industry ?? "",
    post.content_type ?? "",
    post.title ?? "",
  ]
    .join(" ")
    .toLowerCase();
  for (const t of tags) {
    if (pool.includes(t)) return true;
  }
  return false;
}

type Highlight = {
  kind: "creator" | "startup";
  user: UserRow;
  matchScore: number;
  posts: PostRow[];
  creator?: CreatorProfile;
  startup?: StartupProfile;
};

export default async function FeedPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const [
    postsRes,
    usersRes,
    industryRes,
    creatorProfilesRes,
    startupProfilesRes,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("users")
      .select("*"),
    supabase.from("industry_similarity").select("*"),
    supabase.from("creator_profiles").select("*"),
    supabase.from("startup_profiles").select("*"),
  ]);

  const posts = (postsRes.data ?? []) as PostRow[];
  const users = (usersRes.data ?? []) as UserRow[];
  const industryTable = (industryRes.data ?? []) as IndustrySimilarityRow[];
  const creatorProfiles = (creatorProfilesRes.data ?? []) as CreatorProfile[];
  const startupProfiles = (startupProfilesRes.data ?? []) as StartupProfile[];

  const userMap = new Map(users.map((u) => [u.id, u]));
  const creatorProfileMap = new Map(creatorProfiles.map((c) => [c.user_id, c]));
  const startupProfileMap = new Map(startupProfiles.map((s) => [s.user_id, s]));

  // Posts grouped by author for the highlight image strip
  const postsByAuthor = new Map<string, PostRow[]>();
  for (const p of posts) {
    const arr = postsByAuthor.get(p.user_id) ?? [];
    arr.push(p);
    postsByAuthor.set(p.user_id, arr);
  }

  // Viewer context
  let viewerCreator: CreatorProfile | null = null;
  let viewerStartup: StartupProfile | null = null;
  let activeBrief: BriefRow | null = null;

  if (currentUser) {
    viewerCreator = creatorProfileMap.get(currentUser.id) ?? null;
    viewerStartup = startupProfileMap.get(currentUser.id) ?? null;
    if (currentUser.user_type === "startup" && currentUser.membership_tier === "pro") {
      const { data: br } = await supabase
        .from("briefs")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      activeBrief = (br as BriefRow | null) ?? null;
    }
  }

  const briefTags = buildBriefTagSet(activeBrief);

  // --- Featured highlights (profile-level matching) ---------------------
  const highlights: Highlight[] = [];
  if (currentUser && viewerStartup) {
    // Startup viewing → highlight top creators
    for (const creator of creatorProfiles) {
      if (creator.user_id === currentUser.id) continue;
      const creatorUser = userMap.get(creator.user_id);
      if (!creatorUser) continue;
      const res = calculateMatchScore({
        creator,
        startup: viewerStartup,
        creatorUser: {
          languages: creatorUser.languages,
          cultural_markets: creatorUser.cultural_markets,
        },
        startupUser: {
          languages: currentUser.languages,
          cultural_markets: currentUser.cultural_markets,
        },
        industryTable,
      });
      if (res) {
        highlights.push({
          kind: "creator",
          user: creatorUser,
          creator,
          matchScore: res.totalScore,
          posts: postsByAuthor.get(creator.user_id)?.slice(0, 3) ?? [],
        });
      }
    }
  } else if (currentUser && viewerCreator) {
    // Creator viewing → highlight top startups
    for (const startup of startupProfiles) {
      if (startup.user_id === currentUser.id) continue;
      const startupUser = userMap.get(startup.user_id);
      if (!startupUser) continue;
      const res = calculateMatchScore({
        creator: viewerCreator,
        startup,
        creatorUser: {
          languages: currentUser.languages,
          cultural_markets: currentUser.cultural_markets,
        },
        startupUser: {
          languages: startupUser.languages,
          cultural_markets: startupUser.cultural_markets,
        },
        industryTable,
      });
      if (res) {
        highlights.push({
          kind: "startup",
          user: startupUser,
          startup,
          matchScore: res.totalScore,
          posts: postsByAuthor.get(startup.user_id)?.slice(0, 3) ?? [],
        });
      }
    }
  }

  highlights.sort((a, b) => b.matchScore - a.matchScore);
  const topHighlights = highlights.slice(0, 3);
  const highlightedUserIds = new Set(topHighlights.map((h) => h.user.id));

  // --- Regular feed items (exclude posts from highlighted users so the
  //     same person doesn't appear as both a highlight and a tile) --------
  const items: FeedItem[] = posts
    .filter((p) => !highlightedUserIds.has(p.user_id))
    .map((post) => {
      const author = userMap.get(post.user_id);
      const authorCategories = [
        ...(creatorProfileMap.get(post.user_id)?.content_categories ?? []),
        ...(creatorProfileMap.get(post.user_id)?.industry_experience ?? []),
      ];
      if (!author) {
        return {
          post,
          author: {
            id: post.user_id,
            display_name: "Unknown",
            avatar_url: null,
            user_type: "creator" as const,
            location_city: null,
            cultural_markets: [],
            languages: [],
          },
          authorCategories,
          matchScore: null,
          topPick: false,
        };
      }

      let score: number | null = null;
      if (viewerStartup && author.user_type === "creator") {
        score = calculatePostMatchScore(
          post,
          {
            style_production_value: viewerStartup.style_production_value,
            style_pacing: viewerStartup.style_pacing,
            style_focus: viewerStartup.style_focus,
            style_framing: viewerStartup.style_framing,
            style_staging: viewerStartup.style_staging,
            style_color: viewerStartup.style_color,
            style_sound: viewerStartup.style_sound,
            industry: viewerStartup.industry,
            deliverables_needed: viewerStartup.deliverables_needed,
          },
          industryTable,
        );
      } else if (viewerCreator && author.user_type === "startup") {
        score = calculatePostMatchScore(
          post,
          {
            style_production_value: viewerCreator.style_production_value,
            style_pacing: viewerCreator.style_pacing,
            style_focus: viewerCreator.style_focus,
            style_framing: viewerCreator.style_framing,
            style_staging: viewerCreator.style_staging,
            style_color: viewerCreator.style_color,
            style_sound: viewerCreator.style_sound,
            industry: viewerCreator.industry_experience?.[0] ?? null,
            deliverables_needed: viewerCreator.deliverable_types,
          },
          industryTable,
        );
      }

      const topPick =
        activeBrief !== null &&
        author.user_type === "creator" &&
        postMatchesBriefTags(post, authorCategories, briefTags);

      return { post, author, authorCategories, matchScore: score, topPick };
    });

  items.sort((a, b) => {
    if (a.topPick !== b.topPick) return a.topPick ? -1 : 1;
    if (a.matchScore != null && b.matchScore != null) {
      return b.matchScore - a.matchScore;
    }
    if (a.matchScore != null) return -1;
    if (b.matchScore != null) return 1;
    return (
      new Date(b.post.created_at).getTime() -
      new Date(a.post.created_at).getTime()
    );
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Feed</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeBrief
              ? `Ranked by your active brief: "${activeBrief.title}" — top picks flagged.`
              : currentUser
                ? "Ranked by your matches — freshest work from creators and briefs from startups."
                : "Explore creators and briefs across the platform."}
          </p>
        </div>
        {currentUser?.user_type === "startup" && (
          <Link
            href="/brief"
            className="border-border bg-card hover:bg-warm inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {activeBrief ? "Edit brief" : "Create brief"}
          </Link>
        )}
      </div>

      {topHighlights.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
              Featured —{" "}
              {currentUser?.user_type === "startup"
                ? "creators for you"
                : "startups you might fit"}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topHighlights.map((h) => (
              <HighlightedCard
                key={h.user.id}
                variant={h.kind}
                href={
                  h.kind === "creator"
                    ? `/creator/${h.user.id}`
                    : h.posts[0]
                      ? `/post/${h.posts[0].id}`
                      : "#"
                }
                name={h.user.display_name ?? ""}
                avatarUrl={h.user.avatar_url}
                subtitle={
                  h.kind === "creator"
                    ? [h.user.location_city, h.user.location_country]
                        .filter(Boolean)
                        .join(", ")
                    : humanize(h.startup?.industry) || "Startup"
                }
                matchScore={h.matchScore}
                images={h.posts
                  .flatMap((p) => p.media_urls ?? [])
                  .filter(Boolean)
                  .slice(0, 3)}
                bio={
                  h.kind === "creator"
                    ? h.user.bio ?? h.creator?.creative_philosophy ?? null
                    : h.startup?.brand_description ?? null
                }
                avgRating={h.creator?.avg_rating ?? null}
                reviewCount={h.creator?.review_count ?? 0}
                businessLabel={
                  h.kind === "startup" ? "Active brief" : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {topHighlights.length > 0 && (
            <h2 className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.12em]">
              All posts
            </h2>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
              <PostCard key={item.post.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-border flex flex-col items-center rounded-2xl border border-dashed py-20 text-center">
      <h2 className="text-lg font-medium">No posts yet</h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        Run <code className="font-mono text-xs">npm run seed</code> after
        applying the SQL migrations to populate the feed.
      </p>
    </div>
  );
}
