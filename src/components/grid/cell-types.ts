import type { PostRow, StyleVector, UserRow, ReviewRow } from "@/lib/types";

/**
 * Polymorphic cell payloads. A SpanGrid cell's `data` field is one of these.
 * A single renderer (PostCellRenderer, ProfileCellRenderer) dispatches on `kind`.
 */

export type TextVariant = "headline" | "body" | "caption";

export type ImageFit = "cover" | "contain";
export type ImagePosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | `${number}% ${number}%`;

export type PostCellData =
  | {
      kind: "image";
      src: string;
      alt?: string;
      caption?: string;
      /**
       * How the image fills its cell:
       *   - `cover` (default) — crop to fill the cell, no whitespace
       *   - `contain` — whole image visible; when `blurFill` is true, the
       *     empty area is filled with a blurred extract of the same image
       */
      fit?: ImageFit;
      /** Object-position. Default "center". Used when fit is `cover`. */
      position?: ImagePosition;
      /** When true + fit=contain, render a blurred background of the image. */
      blurFill?: boolean;
    }
  | {
      kind: "text";
      content: string;
      variant: TextVariant;
      align?: "left" | "center";
    }
  | {
      kind: "voice";
      seed: string;
      durationSec?: number;
    }
  | {
      kind: "styleDimensions";
      vector: StyleVector;
      label?: string;
    }
  | {
      kind: "tags";
      tags: string[];
      heading?: string;
    };

export type ProfileCellData =
  | {
      kind: "about";
      bio: string | null;
    }
  | {
      kind: "voice";
      seed: string;
    }
  | {
      kind: "radar";
      vector: StyleVector;
    }
  | {
      kind: "portfolioPost";
      post: PostRow;
    }
  | {
      kind: "tags";
      tags: string[];
      heading: string;
    }
  | {
      kind: "rate";
      min: number | null;
      max: number | null;
      /** When false, the rate shows blurred with a "visible after match" hint. */
      visible: boolean;
    }
  | {
      kind: "reviews";
      reviews: Array<
        Pick<
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
        }
      >;
      avg: {
        overall: number;
        reliability: number;
        quality: number;
        collaboration: number;
      };
    }
  | {
      kind: "text";
      content: string;
      variant: TextVariant;
    };
