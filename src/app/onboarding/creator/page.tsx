"use client";

import { useState, useTransition } from "react";
import { StepShell } from "@/components/onboarding/step-shell";
import { StyleSlider } from "@/components/onboarding/style-slider";
import { ChipGroup } from "@/components/onboarding/chip-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  CONTENT_CATEGORIES,
  CONTENT_STYLE_TAGS,
  DELIVERABLE_TYPES,
  AVAILABILITY,
  TURNAROUND,
  TRAVEL,
  LICENSING,
  SUB_SPECIALIZATIONS,
  INDUSTRY_EXPERIENCE,
  PRODUCTION_CAPABILITIES,
  LANGUAGES,
  CULTURAL_MARKETS,
  STYLE_DIMENSIONS,
} from "@/lib/constants";
import { saveCreatorOnboarding } from "@/app/onboarding/actions";

const TOTAL_STEPS = 8;

function toArr(v: number | readonly number[] | undefined): number[] {
  if (Array.isArray(v)) return [...v];
  if (typeof v === "number") return [v];
  return [];
}

type State = {
  display_name: string;
  location_city: string;
  location_country: string;
  languages: string[];
  cultural_markets: string[];
  creative_discipline: "videographer" | "photographer" | "both" | "motion_designer";
  discipline: "video" | "photo" | "both";
  content_categories: string[];
  content_style_tags: string[];
  deliverable_types: string[];
  rate_min: number;
  rate_max: number;
  availability: string;
  style_production_value: number;
  style_pacing: number;
  style_focus: number;
  style_framing: number;
  style_staging: number;
  style_color: number;
  style_sound: number;
  sub_specializations: string[];
  industry_experience: string[];
  production_capabilities: string[];
  preferred_project_types: string[];
  unwanted_work_types: string[];
  usage_licensing_preference: string;
  travel_willingness: string;
  typical_turnaround: string;
  minimum_acceptable_budget: number;
  creative_philosophy: string;
};

const INITIAL: State = {
  display_name: "",
  location_city: "",
  location_country: "",
  languages: [],
  cultural_markets: [],
  creative_discipline: "both",
  discipline: "both",
  content_categories: [],
  content_style_tags: [],
  deliverable_types: [],
  rate_min: 400,
  rate_max: 1000,
  availability: "within_1_week",
  style_production_value: 5,
  style_pacing: 5,
  style_focus: 5,
  style_framing: 5,
  style_staging: 5,
  style_color: 5,
  style_sound: 5,
  sub_specializations: [],
  industry_experience: [],
  production_capabilities: [],
  preferred_project_types: [],
  unwanted_work_types: [],
  usage_licensing_preference: "negotiable",
  travel_willingness: "international",
  typical_turnaround: "1_week",
  minimum_acceptable_budget: 300,
  creative_philosophy: "",
};

export default function CreatorOnboarding() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>(INITIAL);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function finish() {
    setError(null);
    startTransition(async () => {
      try {
        const {
          display_name,
          location_city,
          location_country,
          languages,
          cultural_markets,
          ...profile
        } = state;
        await saveCreatorOnboarding({
          display_name,
          location_city,
          location_country,
          languages,
          cultural_markets,
          profile,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const step1Valid =
    state.display_name.trim() &&
    state.location_city.trim() &&
    state.languages.length > 0;
  const step2Valid =
    state.content_categories.length > 0 && state.content_style_tags.length > 0;
  const step3Valid = state.deliverable_types.length > 0;

  return (
    <>
      {step === 0 && (
        <StepShell
          stepIndex={0}
          totalSteps={TOTAL_STEPS}
          title="Who you are"
          subtitle="The basics. Where you're based and what languages you work in."
          onNext={next}
          nextDisabled={!step1Valid}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name or stage name</Label>
            <Input
              id="name"
              value={state.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              placeholder="e.g. Kiri"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={state.location_city}
                onChange={(e) => set("location_city", e.target.value)}
                placeholder="Munich"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={state.location_country}
                onChange={(e) => set("location_country", e.target.value)}
                placeholder="Germany"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Languages you work in</Label>
            <ChipGroup
              options={LANGUAGES}
              value={state.languages}
              onChange={(v) => set("languages", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Cultural markets you serve</Label>
            <ChipGroup
              options={CULTURAL_MARKETS}
              value={state.cultural_markets}
              onChange={(v) => set("cultural_markets", v)}
            />
          </div>
        </StepShell>
      )}

      {step === 1 && (
        <StepShell
          stepIndex={1}
          totalSteps={TOTAL_STEPS}
          title="What you do"
          subtitle="Pick your discipline, the categories you cover, and the style tags that describe your work."
          onBack={back}
          onNext={next}
          nextDisabled={!step2Valid}
        >
          <div className="space-y-3">
            <Label>Creative discipline</Label>
            <ChipGroup
              options={[
                { value: "videographer", label: "Videographer" },
                { value: "photographer", label: "Photographer" },
                { value: "both", label: "Both" },
                { value: "motion_designer", label: "Motion designer" },
              ]}
              value={[state.creative_discipline]}
              onChange={(v) => {
                const val = (v[0] ?? "both") as State["creative_discipline"];
                set("creative_discipline", val);
                set(
                  "discipline",
                  val === "photographer"
                    ? "photo"
                    : val === "videographer"
                      ? "video"
                      : "both",
                );
              }}
              allowMultiple={false}
            />
          </div>
          <div className="space-y-3">
            <Label>Content categories</Label>
            <ChipGroup
              options={CONTENT_CATEGORIES}
              value={state.content_categories}
              onChange={(v) => set("content_categories", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Style tags that describe your work</Label>
            <ChipGroup
              options={CONTENT_STYLE_TAGS}
              value={state.content_style_tags}
              onChange={(v) => set("content_style_tags", v)}
            />
          </div>
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          stepIndex={2}
          totalSteps={TOTAL_STEPS}
          title="Your work"
          subtitle="What formats do you deliver? You can add portfolio links later from your profile."
          onBack={back}
          onNext={next}
          nextDisabled={!step3Valid}
        >
          <div className="space-y-3">
            <Label>Deliverable types you offer</Label>
            <ChipGroup
              options={DELIVERABLE_TYPES}
              value={state.deliverable_types}
              onChange={(v) => set("deliverable_types", v)}
            />
          </div>
        </StepShell>
      )}

      {step === 3 && (
        <StepShell
          stepIndex={3}
          totalSteps={TOTAL_STEPS}
          title="Your style"
          subtitle="Seven dimensions that define how your work looks and feels. Move each slider to show where your work sits."
          onBack={back}
          onNext={next}
        >
          <div className="space-y-4">
            {STYLE_DIMENSIONS.map((dim) => (
              <StyleSlider
                key={dim.key}
                label={dim.label}
                low={dim.low}
                high={dim.high}
                value={state[dim.key]}
                onChange={(v) => set(dim.key, v)}
              />
            ))}
          </div>
        </StepShell>
      )}

      {step === 4 && (
        <StepShell
          stepIndex={4}
          totalSteps={TOTAL_STEPS}
          title="Your rate"
          subtitle="Your daily rate range and when you can take on work."
          onBack={back}
          onNext={next}
        >
          <div className="border-border bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium">Daily rate range (EUR)</span>
              <span className="text-muted-foreground text-sm">
                €{state.rate_min} – €{state.rate_max}
              </span>
            </div>
            <Slider
              min={100}
              max={3000}
              step={50}
              value={[state.rate_min, state.rate_max]}
              onValueChange={(v) => {
                const arr = toArr(v);
                if (arr.length === 2) {
                  set("rate_min", Math.min(arr[0], arr[1]));
                  set("rate_max", Math.max(arr[0], arr[1]));
                }
              }}
            />
          </div>
          <div className="space-y-3">
            <Label>Availability</Label>
            <ChipGroup
              options={AVAILABILITY}
              value={[state.availability]}
              onChange={(v) =>
                set("availability", v[0] ?? "within_1_week")
              }
              allowMultiple={false}
            />
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell
          stepIndex={5}
          totalSteps={TOTAL_STEPS}
          title="Go deeper"
          subtitle="Sub-specializations, industry experience, and production capabilities."
          onBack={back}
          onNext={next}
          onSkip={next}
          isImportant
        >
          <div className="space-y-3">
            <Label>Sub-specializations</Label>
            <ChipGroup
              options={SUB_SPECIALIZATIONS}
              value={state.sub_specializations}
              onChange={(v) => set("sub_specializations", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Industry experience</Label>
            <ChipGroup
              options={INDUSTRY_EXPERIENCE}
              value={state.industry_experience}
              onChange={(v) => set("industry_experience", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Production capabilities</Label>
            <ChipGroup
              options={PRODUCTION_CAPABILITIES}
              value={state.production_capabilities}
              onChange={(v) => set("production_capabilities", v)}
            />
          </div>
        </StepShell>
      )}

      {step === 6 && (
        <StepShell
          stepIndex={6}
          totalSteps={TOTAL_STEPS}
          title="Preferences"
          subtitle="What do you want more of — and what do you never want to shoot again?"
          onBack={back}
          onNext={next}
          onSkip={next}
          isImportant
        >
          <div className="space-y-3">
            <Label>Preferred project types</Label>
            <ChipGroup
              options={[
                "brand_content",
                "editorial",
                "event_coverage",
                "expedition_documentation",
                "lifestyle_documentation",
                "product_launch",
                "travel_editorial",
              ]}
              value={state.preferred_project_types}
              onChange={(v) => set("preferred_project_types", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Work types you do not want</Label>
            <p className="text-muted-foreground -mt-1 text-sm">
              We use this as a hard filter — you won&apos;t see matches against
              these types.
            </p>
            <ChipGroup
              options={[
                "corporate_talking_head",
                "stock_photography",
                "corporate_events",
                "product_photography",
                "real_estate",
                "food_photography",
                "fast_turnaround",
              ]}
              value={state.unwanted_work_types}
              onChange={(v) => set("unwanted_work_types", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Licensing preference</Label>
            <ChipGroup
              options={LICENSING}
              value={[state.usage_licensing_preference]}
              onChange={(v) =>
                set("usage_licensing_preference", v[0] ?? "negotiable")
              }
              allowMultiple={false}
            />
          </div>
        </StepShell>
      )}

      {step === 7 && (
        <StepShell
          stepIndex={7}
          totalSteps={TOTAL_STEPS}
          title="Logistics"
          subtitle="Final details on travel, turnaround, and your creative philosophy."
          onBack={back}
          onNext={finish}
          onSkip={finish}
          isImportant
          nextLabel={pending ? "Saving…" : "Finish"}
          nextDisabled={pending}
        >
          <div className="space-y-3">
            <Label>Travel willingness</Label>
            <ChipGroup
              options={TRAVEL}
              value={[state.travel_willingness]}
              onChange={(v) => set("travel_willingness", v[0] ?? "international")}
              allowMultiple={false}
            />
          </div>
          <div className="space-y-3">
            <Label>Typical turnaround</Label>
            <ChipGroup
              options={TURNAROUND}
              value={[state.typical_turnaround]}
              onChange={(v) => set("typical_turnaround", v[0] ?? "1_week")}
              allowMultiple={false}
            />
          </div>
          <div className="border-border bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium">
                Minimum acceptable project budget (EUR)
              </span>
              <span className="text-muted-foreground text-sm">
                €{state.minimum_acceptable_budget}
              </span>
            </div>
            <Slider
              min={0}
              max={5000}
              step={100}
              value={[state.minimum_acceptable_budget]}
              onValueChange={(v) =>
                set("minimum_acceptable_budget", toArr(v)[0] ?? 300)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="philosophy">Creative philosophy</Label>
            <Textarea
              id="philosophy"
              rows={4}
              value={state.creative_philosophy}
              onChange={(e) => set("creative_philosophy", e.target.value)}
              placeholder="In a few lines: how you think about your work."
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </StepShell>
      )}
    </>
  );
}
