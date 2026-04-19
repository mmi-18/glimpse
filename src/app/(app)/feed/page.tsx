import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PostCard } from "@/components/feed/post-card";
import {
  calculatePostMatchScore,
  calculateMatchScore,
} from "@/lib/matching";
import type {
  CreatorProfile,
  IndustrySimilarityRow,
  PostRow,
  StartupProfile,
  UserRow,
} from "@/lib/types";

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
  matchScore: number | null;
};

export default async function FeedPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const [postsRes, usersRes, industryRes] = await Promise.all([
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("users")
      .select(
        "id, display_name, avatar_url, user_type, location_city, cultural_markets, languages",
      ),
    supabase.from("industry_similarity").select("*"),
  ]);

  const posts = (postsRes.data ?? []) as PostRow[];
  const users = (usersRes.data ?? []) as FeedItem["author"][];
  const industryTable = (industryRes.data ?? []) as IndustrySimilarityRow[];
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Build viewer context for match scoring
  let viewerCreator: CreatorProfile | null = null;
  let viewerStartup: StartupProfile | null = null;

  if (currentUser) {
    if (currentUser.user_type === "creator") {
      const { data } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();
      viewerCreator = (data as CreatorProfile | null) ?? null;
    } else {
      const { data } = await supabase
        .from("startup_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();
      viewerStartup = (data as StartupProfile | null) ?? null;
    }
  }

  // Score each post relative to the viewer
  const items: FeedItem[] = posts.map((post) => {
    const author = userMap.get(post.user_id);
    if (!author) {
      return {
        post,
        author: {
          id: post.user_id,
          display_name: "Unknown",
          avatar_url: null,
          user_type: "creator",
          location_city: null,
          cultural_markets: [],
          languages: [],
        },
        matchScore: null,
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
      // For creators, match job posts (startups) to their style
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

    return { post, author, matchScore: score };
  });

  // Sort: authenticated viewers get match-ranked, others get recency
  items.sort((a, b) => {
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
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Feed</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {currentUser
              ? "Ranked by your matches — freshest work from creators and briefs from startups."
              : "Explore creators and briefs across the platform."}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PostCard key={item.post.id} item={item} />
          ))}
        </div>
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
        applying the SQL migration to populate the feed.
      </p>
    </div>
  );
}
