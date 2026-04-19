import Link from "next/link";
import Image from "next/image";
import { ImageCollage } from "@/components/feed/image-collage";
import { MatchScoreBadge } from "@/components/feed/match-score-badge";
import type { PostRow, UserRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type FeedItem = {
  post: PostRow;
  author: Pick<
    UserRow,
    "id" | "display_name" | "avatar_url" | "user_type" | "location_city"
  >;
  matchScore: number | null;
};

function humanize(s?: string | null) {
  if (!s) return "";
  return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function PostCard({ item }: { item: FeedItem }) {
  const { post, author, matchScore } = item;
  if (author.user_type === "startup") {
    return <JobCard item={item} />;
  }
  return (
    <Link
      href={`/post/${post.id}`}
      className="border-border bg-card group block overflow-hidden rounded-2xl border transition-colors hover:border-foreground/20"
    >
      <ImageCollage
        images={post.media_urls ?? []}
        alt={post.title ?? "Portfolio piece"}
        className="w-full"
      />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {author.avatar_url && (
              <Image
                src={author.avatar_url}
                alt={author.display_name ?? ""}
                width={28}
                height={28}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium leading-tight">
                {author.display_name}
              </p>
              <p className="text-muted-foreground text-xs">
                {author.location_city}
              </p>
            </div>
          </div>
          {matchScore != null && (
            <MatchScoreBadge score={matchScore} size="sm" />
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {post.content_type && (
            <span className="border-border rounded-full border px-2 py-0.5 text-[11px]">
              {humanize(post.content_type)}
            </span>
          )}
          {post.industry && (
            <span className="bg-warm rounded-full px-2 py-0.5 text-[11px]">
              {humanize(post.industry)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function JobCard({ item }: { item: FeedItem }) {
  const { post, author, matchScore } = item;
  const hasImage = (post.media_urls?.length ?? 0) > 0 && post.media_urls?.[0];

  return (
    <Link
      href={`/post/${post.id}`}
      className="border-border bg-card group block overflow-hidden rounded-2xl border transition-colors hover:border-foreground/20"
    >
      <div
        className={cn(
          "relative flex flex-col justify-end overflow-hidden",
          hasImage ? "" : "bg-gradient-to-br from-warm via-surface to-background",
        )}
        style={{ aspectRatio: "3/2" }}
      >
        {hasImage ? (
          <Image
            src={post.media_urls![0]}
            alt={post.title ?? "Job listing"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            {author.avatar_url && (
              <Image
                src={author.avatar_url}
                alt={author.display_name ?? ""}
                width={72}
                height={72}
                className="rounded-full border border-border"
              />
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {author.avatar_url && (
              <Image
                src={author.avatar_url}
                alt={author.display_name ?? ""}
                width={28}
                height={28}
                className="rounded-full border border-border"
              />
            )}
            <p className="text-sm font-medium">{author.display_name}</p>
          </div>
          {matchScore != null && (
            <MatchScoreBadge score={matchScore} size="sm" />
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-snug">
          {post.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {post.content_type && (
            <span className="border-border rounded-full border px-2 py-0.5 text-[11px]">
              {humanize(post.content_type)}
            </span>
          )}
          {post.industry && (
            <span className="bg-warm rounded-full px-2 py-0.5 text-[11px]">
              {humanize(post.industry)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
