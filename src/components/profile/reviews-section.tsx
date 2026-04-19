"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Review = {
  id: string;
  reviewer: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  project_description: string | null;
  rating_overall: number | null;
  rating_reliability: number | null;
  rating_quality: number | null;
  rating_collaboration: number | null;
  review_text: string | null;
  created_at: string;
};

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "xs" }) {
  const px = size === "xs" ? 11 : 13;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={px}
          height={px}
          viewBox="0 0 24 24"
          fill={n <= value ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          className={n <= value ? "text-foreground" : "text-muted-foreground/40"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsSection({
  reviews,
  avg,
}: {
  reviews: Review[];
  avg: {
    overall: number;
    reliability: number;
    quality: number;
    collaboration: number;
  };
}) {
  const [open, setOpen] = useState<Review | null>(null);

  if (reviews.length === 0) {
    return (
      <div className="border-border rounded-2xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No reviews yet — this creator is new to glimpse.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div>
          <p className="text-4xl font-medium tracking-tight">
            {avg.overall.toFixed(1)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
        </div>
        <BreakdownStat label="Reliability" value={avg.reliability} />
        <BreakdownStat label="Quality" value={avg.quality} />
        <BreakdownStat label="Collaboration" value={avg.collaboration} />
      </div>

      {/* Horizontal cards */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {reviews.map((r) => (
          <button
            key={r.id}
            onClick={() => setOpen(r)}
            className="border-border bg-card min-w-[260px] shrink-0 rounded-xl border p-4 text-left transition-colors hover:border-foreground/20"
          >
            <div className="flex items-center gap-3">
              {r.reviewer.avatar_url && (
                <Image
                  src={r.reviewer.avatar_url}
                  alt={r.reviewer.display_name ?? ""}
                  width={32}
                  height={32}
                  className="rounded-full border border-border"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {r.reviewer.display_name}
                </p>
                <Stars value={r.rating_overall ?? 0} />
              </div>
            </div>
            <p className="text-muted-foreground mt-3 line-clamp-2 text-xs">
              {r.project_description}
            </p>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {open.reviewer.avatar_url && (
                    <Image
                      src={open.reviewer.avatar_url}
                      alt={open.reviewer.display_name ?? ""}
                      width={36}
                      height={36}
                      className="rounded-full border border-border"
                    />
                  )}
                  <span>{open.reviewer.display_name}</span>
                </DialogTitle>
              </DialogHeader>
              <div>
                <Stars value={open.rating_overall ?? 0} />
                <p className="text-muted-foreground mt-2 text-xs">
                  {open.project_description}
                </p>
                <div className="border-border mt-4 grid grid-cols-3 gap-3 border-t pt-4 text-xs">
                  <DetailStat
                    label="Reliability"
                    value={open.rating_reliability ?? 0}
                  />
                  <DetailStat
                    label="Quality"
                    value={open.rating_quality ?? 0}
                  />
                  <DetailStat
                    label="Collab"
                    value={open.rating_collaboration ?? 0}
                  />
                </div>
                <p className="mt-4 text-sm leading-relaxed">
                  {open.review_text}
                </p>
                <p className="text-muted-foreground mt-4 text-[11px]">
                  {new Date(open.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function BreakdownStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="bg-muted mt-1 h-1 w-full overflow-hidden rounded-full">
        <div
          className="bg-foreground h-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">
        {value} <span className="text-muted-foreground">/ 5</span>
      </p>
    </div>
  );
}
