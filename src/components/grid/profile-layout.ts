import type { GridCell } from "@/components/grid/types";
import type { ProfileCellData } from "@/components/grid/cell-types";
import type { CreatorProfile, PostRow, ReviewRow, UserRow } from "@/lib/types";

type ReviewWithReviewer = Pick<
  ReviewRow,
  | "id"
  | "project_description"
  | "rating_overall"
  | "rating_reliability"
  | "rating_quality"
  | "rating_collaboration"
  | "review_text"
  | "created_at"
> & {
  reviewer: Pick<UserRow, "id" | "display_name" | "avatar_url">;
};

/**
 * The "About" half of a Creator profile: identity / style / reviews widgets.
 * These are fixed widget cells — text cells are not used here.
 */
export function buildAboutCells(args: {
  user: UserRow;
  profile: CreatorProfile | null;
  reviews: ReviewWithReviewer[];
  avg: {
    overall: number;
    reliability: number;
    quality: number;
    collaboration: number;
  };
  /** Whether the viewer is allowed to see the creator's daily rate. */
  rateVisible: boolean;
}): GridCell<ProfileCellData>[] {
  const { user, profile, reviews, avg, rateVisible } = args;
  const cells: GridCell<ProfileCellData>[] = [];

  if (user.bio || profile?.creative_philosophy) {
    cells.push({
      id: "about",
      span: "2x2",
      data: {
        kind: "about",
        bio: user.bio ?? profile?.creative_philosophy ?? null,
      },
    });
  }

  cells.push({
    id: "voice",
    span: "2x1",
    data: { kind: "voice", seed: user.display_name ?? user.id },
  });

  if (profile && profile.style_production_value != null) {
    cells.push({
      id: "radar",
      span: "2x2",
      data: { kind: "radar", vector: profile },
    });
  }

  if (profile?.rate_min != null && profile?.rate_max != null) {
    cells.push({
      id: "rate",
      span: "1x1",
      data: {
        kind: "rate",
        min: profile.rate_min,
        max: profile.rate_max,
        visible: rateVisible,
      },
    });
  }

  if (profile?.deliverable_types && profile.deliverable_types.length > 0) {
    cells.push({
      id: "delivers",
      span: "2x1",
      data: {
        kind: "tags",
        tags: profile.deliverable_types,
        heading: "Delivers",
      },
    });
  }

  if (profile?.industry_experience && profile.industry_experience.length > 0) {
    cells.push({
      id: "industries",
      span: "2x1",
      data: {
        kind: "tags",
        tags: profile.industry_experience,
        heading: "Industry experience",
      },
    });
  }

  if (reviews.length > 0) {
    cells.push({
      id: "reviews",
      span: "2x2",
      data: { kind: "reviews", reviews, avg },
    });
  }

  return cells;
}

/**
 * The "Portfolio" half: headings, body text, and post previews. This is the
 * creative-expression half — users can mix text blocks between tiles to
 * frame sections ("Recent work", "On location", etc.).
 *
 * Default layout (authoring overrides in Schritt 9):
 *   - Optional intro headline + body text
 *   - Post tiles cycled through 4 spans for visual rhythm
 */
export function buildPortfolioCells(args: {
  profile: CreatorProfile | null;
  posts: PostRow[];
  displayName: string | null;
}): GridCell<ProfileCellData>[] {
  const { profile, posts } = args;
  const cells: GridCell<ProfileCellData>[] = [];

  if (posts.length === 0) return cells;

  // Pictures FIRST — the grid should open with the hero image, not a text
  // block. Text cells only appear after the work, acting as a closing
  // statement. Users can reorder freely in the future authoring flow.
  const rhythm = ["1x2", "1x1", "2x1", "1x1", "1x1", "2x1"] as const;
  posts.forEach((post, i) => {
    const span: "1x1" | "2x1" | "1x2" | "2x2" =
      i === 0 ? "2x2" : rhythm[(i - 1) % rhythm.length];
    cells.push({
      id: `portfolio-${post.id}`,
      span,
      data: { kind: "portfolioPost", post },
    });
  });

  // Philosophy excerpt as a closing pull-quote at the bottom, if present.
  if (profile?.creative_philosophy) {
    const philosophy = profile.creative_philosophy;
    const firstSentence =
      philosophy.split(/(?<=[.!?])\s+/)[0] ?? philosophy.slice(0, 120);
    cells.push({
      id: "portfolio-philosophy",
      span: "2x1",
      data: {
        kind: "text",
        content: firstSentence,
      },
    });
  }

  return cells;
}
