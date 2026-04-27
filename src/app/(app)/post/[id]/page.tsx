import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MatchScoreBadge } from "@/components/feed/match-score-badge";
import { MessageDialog } from "@/components/messaging/message-dialog";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { PostContentGrid } from "@/components/post/post-content-grid";
import {
  calculateMatchScore,
  calculatePostMatchScore,
} from "@/lib/matching";
import type {
  CreatorProfile,
  IndustrySimilarityRow,
  PostRow,
  StartupProfile,
  UserRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function humanize(s?: string | null) {
  if (!s) return "";
  return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data: postData } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (!postData) notFound();
  const post = postData as PostRow;

  const { data: authorData } = await supabase
    .from("users")
    .select("*")
    .eq("id", post.user_id)
    .single();
  if (!authorData) notFound();
  const author = authorData as UserRow;

  // Author profile (creator or startup)
  let authorCreator: CreatorProfile | null = null;
  let authorStartup: StartupProfile | null = null;
  if (author.user_type === "creator") {
    const { data } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", author.id)
      .single();
    authorCreator = (data as CreatorProfile | null) ?? null;
  } else {
    const { data } = await supabase
      .from("startup_profiles")
      .select("*")
      .eq("user_id", author.id)
      .single();
    authorStartup = (data as StartupProfile | null) ?? null;
  }

  // Viewer profile for match calc
  let viewerCreator: CreatorProfile | null = null;
  let viewerStartup: StartupProfile | null = null;
  let viewerUser: UserRow | null = null;
  if (currentUser && currentUser.id !== author.id) {
    viewerUser = currentUser;
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

  // Industry similarity table
  const { data: simData } = await supabase
    .from("industry_similarity")
    .select("*");
  const industryTable = (simData ?? []) as IndustrySimilarityRow[];

  // Profile-level match score
  let matchScore: number | null = null;
  if (viewerStartup && authorCreator) {
    const res = calculateMatchScore({
      creator: authorCreator,
      startup: viewerStartup,
      creatorUser: {
        languages: author.languages,
        cultural_markets: author.cultural_markets,
      },
      startupUser: {
        languages: viewerUser?.languages,
        cultural_markets: viewerUser?.cultural_markets,
      },
      industryTable,
    });
    matchScore = res?.totalScore ?? null;
  } else if (viewerCreator && authorStartup) {
    const res = calculateMatchScore({
      creator: viewerCreator,
      startup: authorStartup,
      creatorUser: {
        languages: viewerUser?.languages,
        cultural_markets: viewerUser?.cultural_markets,
      },
      startupUser: {
        languages: author.languages,
        cultural_markets: author.cultural_markets,
      },
      industryTable,
    });
    matchScore = res?.totalScore ?? null;
  } else if (viewerCreator && authorCreator) {
    // Creator looking at creator — show post-level vibe score
    matchScore = calculatePostMatchScore(
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

  const isOwn = currentUser?.id === author.id;
  const profileHref =
    author.user_type === "creator"
      ? `/creator/${author.id}`
      : `/startup/${author.id}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/feed"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>
      </div>

      {/* Author header */}
      <div className="border-border bg-card mb-6 flex items-center justify-between rounded-2xl border p-4">
        <Link
          href={profileHref}
          className="flex items-center gap-3 hover:opacity-80"
        >
          <Avatar
            src={author.avatar_url}
            name={author.display_name}
            size={44}
          />
          <div>
            <p className="font-medium">{author.display_name}</p>
            <p className="text-muted-foreground text-xs">
              {author.user_type === "creator"
                ? `${author.location_city ?? ""} • Creator`
                : authorStartup?.industry
                  ? `${humanize(authorStartup.industry)} • Startup`
                  : "Startup"}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {matchScore != null && (
            <MatchScoreBadge score={matchScore} size="md" />
          )}
          {!isOwn && (
            <MessageDialog
              recipientId={author.id}
              recipientName={author.display_name ?? "User"}
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

      {/* Title + business-brief badge */}
      <header className="mb-6">
        {author.user_type === "startup" && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-background">
            Business brief
          </div>
        )}
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          {post.title}
        </h1>
      </header>

      {/* Content grid — each section is a cell in a SpanGrid */}
      <PostContentGrid post={post} />
    </div>
  );
}

