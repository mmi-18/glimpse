"use client";

import { useRef, useState, useTransition } from "react";
import {
  Image as ImageIcon,
  Type as TypeIcon,
  Trash2,
  Loader2,
  Plus,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { SpanGrid } from "@/components/grid/span-grid";
import { PostCellRenderer } from "@/components/grid/cell-renderers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CellSpan, GridCell } from "@/components/grid/types";
import type { PostCellData } from "@/components/grid/cell-types";
import { ChipGroup } from "@/components/onboarding/chip-group";
import {
  INDUSTRY_EXPERIENCE,
  DELIVERABLE_TYPES,
} from "@/lib/constants";
import { createPost } from "@/app/(app)/new-post/actions";

function uid() {
  return `c-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// Wizard wrapper
// ---------------------------------------------------------------------------

export function PostEditor({
  defaultIndustry,
  defaultContentType,
}: {
  defaultIndustry: string;
  defaultContentType: string;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  const [industry, setIndustry] = useState<string>(defaultIndustry);
  const [contentType, setContentType] = useState<string>(defaultContentType);
  const [cells, setCells] = useState<GridCell<PostCellData>[]>([]);
  const [previewCells, setPreviewCells] = useState<GridCell<PostCellData>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function goToPreview() {
    setError(null);
    if (cells.length === 0) {
      setError("Add at least one cell to the post before continuing");
      return;
    }
    // Auto-populate the preview tile with the first image cells when empty
    if (previewCells.length === 0) {
      const images = cells.filter((c) => c.data.kind === "image").slice(0, 4);
      const prepop: GridCell<PostCellData>[] = images.map((c, i) => ({
        ...c,
        id: `preview-${c.id}`,
        span:
          i === 0 && images.length > 1 ? ("2x2" as const) : ("1x1" as const),
      }));
      // If only 1 image, make it 2x2
      if (prepop.length === 1) prepop[0].span = "2x2";
      setPreviewCells(prepop);
    }
    setStep(2);
  }

  function publish() {
    setError(null);
    startTransition(async () => {
      try {
        await createPost({
          industry,
          content_type: contentType,
          cells,
          previewCells,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to publish");
      }
    });
  }

  return (
    <div>
      <StepIndicator current={step} />
      {step === 1 ? (
        <StepOneBuilder
          industry={industry}
          setIndustry={setIndustry}
          contentType={contentType}
          setContentType={setContentType}
          cells={cells}
          setCells={setCells}
          error={error}
          onNext={goToPreview}
        />
      ) : (
        <StepTwoPreview
          cells={cells}
          previewCells={previewCells}
          setPreviewCells={setPreviewCells}
          error={error}
          pending={pending}
          onBack={() => setStep(1)}
          onPublish={publish}
        />
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <ol className="mb-6 flex items-center gap-3 text-xs">
      <Step index={1} label="Build layout" active={current === 1} done={current > 1} />
      <div className="text-muted-foreground">→</div>
      <Step index={2} label="Design preview" active={current === 2} done={false} />
    </ol>
  );
}

function Step({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-2",
        active
          ? "text-foreground"
          : done
            ? "text-foreground/70"
            : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
          active
            ? "bg-foreground text-background"
            : done
              ? "bg-foreground/20 text-foreground"
              : "bg-muted text-muted-foreground",
        )}
      >
        {index}
      </span>
      <span className="font-medium">{label}</span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Full post builder (same grid you had before)
// ---------------------------------------------------------------------------

function StepOneBuilder({
  industry,
  setIndustry,
  contentType,
  setContentType,
  cells,
  setCells,
  error,
  onNext,
}: {
  industry: string;
  setIndustry: (v: string) => void;
  contentType: string;
  setContentType: (v: string) => void;
  cells: GridCell<PostCellData>[];
  setCells: React.Dispatch<React.SetStateAction<GridCell<PostCellData>[]>>;
  error: string | null;
  onNext: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function addImagesFromFiles(files: FileList | File[] | null) {
    if (!files) return;
    const arr = Array.from(files);
    Promise.all(
      arr.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          }),
      ),
    ).then((urls) => {
      setCells((prev) => [
        ...prev,
        ...urls.map((src) => ({
          id: uid(),
          span: "1x1" as const,
          data: { kind: "image" as const, src },
        })),
      ]);
    });
  }

  function addText() {
    setCells((prev) => [
      ...prev,
      {
        id: uid(),
        // Text cells default to 1×1 — smaller visual weight than image cells.
        // User can resize up to 2×2 via the corner handle if they want more room.
        span: "1x1",
        data: {
          kind: "text" as const,
          content: "Write something…",
        },
      },
    ]);
  }

  function removeCell(id: string) {
    setCells((prev) => prev.filter((c) => c.id !== id));
  }

  function updateTextContent(id: string, content: string) {
    setCells((prev) =>
      prev.map((c) =>
        c.id === id && c.data.kind === "text"
          ? { ...c, data: { ...c.data, content } }
          : c,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          addImagesFromFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <section className="space-y-2">
        <Label>Industry</Label>
        <ChipGroup
          options={INDUSTRY_EXPERIENCE}
          value={industry ? [industry] : []}
          onChange={(v) => setIndustry(v[0] ?? "")}
          allowMultiple={false}
        />
      </section>

      <section className="space-y-3">
        {cells.length === 0 ? (
          <AddCellPicker
            onAddImage={() => fileInputRef.current?.click()}
            onAddText={addText}
            variant="empty"
          />
        ) : (
          <>
            <SpanGrid
              cells={cells}
              columns={{ base: 2, md: 4, lg: 6 }}
              editable
              onCellsChange={setCells}
              renderCell={(cell) => (
                <EditableCell
                  cell={cell as GridCell<PostCellData>}
                  onDelete={() => removeCell(cell.id)}
                  onTextChange={(content) =>
                    updateTextContent(cell.id, content)
                  }
                />
              )}
            />
            <AddCellPicker
              onAddImage={() => fileInputRef.current?.click()}
              onAddText={addText}
              variant="inline"
            />
          </>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs uppercase tracking-wider"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              showDetails && "rotate-90",
            )}
          />
          Details (optional)
        </button>
        {showDetails && (
          <div className="mt-4 space-y-2">
            <Label className="text-xs">Content type</Label>
            <ChipGroup
              options={DELIVERABLE_TYPES}
              value={contentType ? [contentType] : []}
              onChange={(v) => setContentType(v[0] ?? "")}
              allowMultiple={false}
            />
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Defaulted from your profile. Override if this specific post is a
              different format than your usual.
            </p>
          </div>
        )}
      </section>

      <section className="border-border flex items-center justify-between gap-3 border-t pt-6">
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="ml-auto flex items-center gap-3">
          <Button onClick={onNext} disabled={cells.length === 0}>
            Next — design preview <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Preview builder
// ---------------------------------------------------------------------------

function StepTwoPreview({
  cells,
  previewCells,
  setPreviewCells,
  error,
  pending,
  onBack,
  onPublish,
}: {
  cells: GridCell<PostCellData>[];
  previewCells: GridCell<PostCellData>[];
  setPreviewCells: React.Dispatch<
    React.SetStateAction<GridCell<PostCellData>[]>
  >;
  error: string | null;
  pending: boolean;
  onBack: () => void;
  onPublish: () => void;
}) {
  // Match each preview cell back to the underlying full-post cell by
  // stripping the "preview-" id prefix.
  const previewOriginIds = new Set(
    previewCells.map((p) => p.id.replace(/^preview-/, "")),
  );

  function toggleCell(sourceCell: GridCell<PostCellData>) {
    if (previewOriginIds.has(sourceCell.id)) {
      setPreviewCells((prev) =>
        prev.filter((p) => p.id.replace(/^preview-/, "") !== sourceCell.id),
      );
    } else {
      setPreviewCells((prev) =>
        prev.length >= 4
          ? prev
          : [...prev, { ...sourceCell, id: `preview-${sourceCell.id}`, span: "1x1" }],
      );
    }
  }

  function resetAuto() {
    const images = cells.filter((c) => c.data.kind === "image").slice(0, 4);
    const prepop: GridCell<PostCellData>[] = images.map((c, i) => ({
      ...c,
      id: `preview-${c.id}`,
      span: (i === 0 && images.length > 1 ? "2x2" : "1x1") as CellSpan,
    }));
    if (prepop.length === 1) prepop[0].span = "2x2";
    setPreviewCells(prepop);
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-muted-foreground text-sm">
          Design the tile that shows in the feed. Resize cells with the
          corner handle, snap to 1×1, 2×1, 1×2, or 2×2. Long-press a cell
          and drag to reorder. Max 4 base cells.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Left column: the preview tile */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider">
              Preview tile
            </Label>
            <button
              type="button"
              onClick={resetAuto}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            >
              <RotateCcw className="h-3 w-3" /> Reset to auto
            </button>
          </div>
          <div className="border-border bg-muted/30 rounded-3xl border-2 border-dashed p-3">
            <div className="border-border bg-card overflow-hidden rounded-2xl border">
              {previewCells.length === 0 ? (
                <div className="flex aspect-square items-center justify-center p-6 text-center">
                  <p className="text-muted-foreground text-xs">
                    Tap cells on the right to add them to your preview.
                  </p>
                </div>
              ) : (
                <SpanGrid
                  cells={previewCells}
                  columns={{ base: 2 }}
                  editable
                  onCellsChange={setPreviewCells}
                  gap={2}
                  renderCell={(cell) => (
                    <EditableCell
                      cell={cell as GridCell<PostCellData>}
                      onDelete={() =>
                        setPreviewCells((prev) =>
                          prev.filter((p) => p.id !== cell.id),
                        )
                      }
                      onTextChange={(content) =>
                        setPreviewCells((prev) =>
                          prev.map((p) =>
                            p.id === cell.id && p.data.kind === "text"
                              ? { ...p, data: { ...p.data, content } }
                              : p,
                          ),
                        )
                      }
                    />
                  )}
                />
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-[11px]">
            This is exactly how other users see your post in the feed grid.
          </p>
        </div>

        {/* Right column: cell palette */}
        <div>
          <Label className="mb-3 block text-xs uppercase tracking-wider">
            Your cells ({cells.length})
          </Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            {cells.map((cell) => {
              const inPreview = previewOriginIds.has(cell.id);
              const full = previewCells.length >= 4;
              const disabled = !inPreview && full;
              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => toggleCell(cell)}
                  disabled={disabled}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                    inPreview
                      ? "border-foreground shadow-[0_0_0_3px_rgba(26,26,26,0.08)]"
                      : disabled
                        ? "border-border cursor-not-allowed opacity-40"
                        : "border-border hover:border-foreground/40",
                  )}
                >
                  <CellThumb cell={cell} />
                  {inPreview && (
                    <span className="bg-foreground text-background absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider">
                      In preview
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {previewCells.length >= 4 && (
            <p className="text-muted-foreground mt-3 text-xs">
              Max 4 cells in the preview. Deselect one to swap.
            </p>
          )}
        </div>
      </section>

      <section className="border-border flex items-center justify-between gap-3 border-t pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back to layout
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button onClick={onPublish} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Publishing…" : "Publish"}
        </Button>
      </section>
    </div>
  );
}

function CellThumb({ cell }: { cell: GridCell<PostCellData> }) {
  const d = cell.data;
  if (d.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={d.src} alt="" className="h-full w-full object-cover" />;
  }
  if (d.kind === "text") {
    return (
      <div className="bg-card flex h-full w-full items-center justify-center p-2">
        <p className="line-clamp-3 text-[10px]">{d.content}</p>
      </div>
    );
  }
  return <div className="bg-muted h-full w-full" />;
}

// ---------------------------------------------------------------------------
// Shared helpers (add picker, editable cell, inline text)
// ---------------------------------------------------------------------------

function AddCellPicker({
  onAddImage,
  onAddText,
  variant,
}: {
  onAddImage: () => void;
  onAddText: () => void;
  variant: "empty" | "inline";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "border-border bg-muted/30 hover:bg-muted hover:border-foreground/30 text-muted-foreground hover:text-foreground group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed text-sm transition-colors",
          variant === "empty" ? "py-24" : "py-5",
        )}
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">
          {variant === "empty"
            ? "Add your first picture or text"
            : "Add picture or text"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-44">
        <DropdownMenuItem onClick={onAddImage}>
          <ImageIcon className="h-4 w-4" /> Picture
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddText}>
          <TypeIcon className="h-4 w-4" /> Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EditableCell({
  cell,
  onDelete,
  onTextChange,
}: {
  cell: GridCell<PostCellData>;
  onDelete: () => void;
  onTextChange: (content: string) => void;
}) {
  return (
    <div className="relative h-full w-full">
      {cell.data.kind === "text" ? (
        <InlineTextCell cell={cell} onChange={onTextChange} />
      ) : (
        <PostCellRenderer cell={cell} />
      )}
      {/* 44×44 touch-friendly hit zone with a smaller 28×28 visual button
          inside. data-noreorder + onPointerDown stopPropagation keep the
          tap from triggering SpanGrid's long-press drag. */}
      <button
        type="button"
        data-noreorder
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute left-0 top-0 z-10 flex h-11 w-11 cursor-pointer items-start justify-start p-1.5 touch-none"
        aria-label="Delete cell"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-sm transition-transform hover:scale-105 active:scale-95">
          <Trash2 className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}

// Inline editable text cell — single uniform style mirrors the read-only
// renderer (warm bg, compact size). data-noreorder lets the SpanGrid's
// long-press detector know not to start a drag from inside the textarea.
function InlineTextCell({
  cell,
  onChange,
}: {
  cell: GridCell<PostCellData>;
  onChange: (content: string) => void;
}) {
  if (cell.data.kind !== "text") return null;
  const d = cell.data;
  return (
    <div className="bg-warm flex h-full w-full overflow-hidden rounded-2xl">
      <div className="flex h-full w-full flex-col overflow-y-auto p-2.5 sm:p-3">
        <textarea
          data-noreorder
          value={d.content}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="placeholder:text-muted-foreground/50 text-foreground h-full w-full resize-none border-0 bg-transparent text-xs leading-snug outline-none sm:text-sm"
          placeholder="Write something…"
        />
      </div>
    </div>
  );
}
