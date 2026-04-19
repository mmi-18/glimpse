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
  INDUSTRIES,
  CULTURAL_MARKETS,
  LANGUAGES,
  PROJECT_GOALS,
  DESIRED_LOOK,
  DELIVERABLE_TYPES,
  CONTENT_PLATFORMS,
  TARGET_AUDIENCE,
  QUALITIES,
  COMPANY_STAGES,
  BRAND_GUIDELINES,
  USAGE_RIGHTS,
  STYLE_DIMENSIONS,
} from "@/lib/constants";
import { saveStartupOnboarding } from "@/app/onboarding/actions";

const TOTAL_STEPS = 7;

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
  company_name: string;
  industry: string;
  location_market: string[];
  contact_person: string;
  contact_role: string;
  project_goal: string[];
  desired_look_feeling: string[];
  deliverables_needed: string[];
  quantity_volume: number;
  style_production_value: number;
  style_pacing: number;
  style_focus: number;
  style_framing: number;
  style_staging: number;
  style_color: number;
  style_sound: number;
  typical_budget_range_min: number;
  typical_budget_range_max: number;
  budget_for_project: number;
  content_usage_platforms: string[];
  company_stage: string;
  website_url: string;
  company_description: string;
  brand_look_guidelines: string;
  target_audience: string[];
  language: string[];
  success_criteria: string;
  qualities_in_creator: string[];
  usage_rights_scope: string;
  brand_description: string;
};

const INITIAL: State = {
  display_name: "",
  location_city: "",
  location_country: "",
  languages: [],
  cultural_markets: [],
  company_name: "",
  industry: "",
  location_market: [],
  contact_person: "",
  contact_role: "",
  project_goal: [],
  desired_look_feeling: [],
  deliverables_needed: [],
  quantity_volume: 1,
  style_production_value: 5,
  style_pacing: 5,
  style_focus: 5,
  style_framing: 5,
  style_staging: 5,
  style_color: 5,
  style_sound: 5,
  typical_budget_range_min: 500,
  typical_budget_range_max: 2500,
  budget_for_project: 2000,
  content_usage_platforms: [],
  company_stage: "seed",
  website_url: "",
  company_description: "",
  brand_look_guidelines: "loose_guidelines",
  target_audience: [],
  language: [],
  success_criteria: "",
  qualities_in_creator: [],
  usage_rights_scope: "negotiable",
  brand_description: "",
};

export default function StartupOnboarding() {
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
        await saveStartupOnboarding({
          display_name: state.company_name || display_name,
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
    state.company_name.trim() &&
    state.industry.trim() &&
    state.contact_person.trim();
  const step2Valid =
    state.project_goal.length > 0 && state.deliverables_needed.length > 0;

  return (
    <>
      {step === 0 && (
        <StepShell
          stepIndex={0}
          totalSteps={TOTAL_STEPS}
          title="Your company"
          subtitle="Who you are and where you work."
          onNext={next}
          nextDisabled={!step1Valid}
        >
          <div className="space-y-2">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              value={state.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="e.g. Heimplanet"
            />
          </div>
          <div className="space-y-3">
            <Label>Primary industry</Label>
            <ChipGroup
              options={INDUSTRIES}
              value={state.industry ? [state.industry] : []}
              onChange={(v) => set("industry", v[0] ?? "")}
              allowMultiple={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={state.location_city}
                onChange={(e) => set("location_city", e.target.value)}
                placeholder="Hamburg"
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
            <Label>Markets you operate in</Label>
            <ChipGroup
              options={CULTURAL_MARKETS}
              value={state.location_market}
              onChange={(v) => set("location_market", v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact person</Label>
              <Input
                id="contact"
                value={state.contact_person}
                onChange={(e) => set("contact_person", e.target.value)}
                placeholder="Clara Vogt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={state.contact_role}
                onChange={(e) => set("contact_role", e.target.value)}
                placeholder="Brand Manager"
              />
            </div>
          </div>
        </StepShell>
      )}

      {step === 1 && (
        <StepShell
          stepIndex={1}
          totalSteps={TOTAL_STEPS}
          title="Your project goal"
          subtitle="What are you trying to achieve, and what does success look like?"
          onBack={back}
          onNext={next}
          nextDisabled={!step2Valid}
        >
          <div className="space-y-3">
            <Label>Project goals</Label>
            <ChipGroup
              options={PROJECT_GOALS}
              value={state.project_goal}
              onChange={(v) => set("project_goal", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Desired look &amp; feeling</Label>
            <ChipGroup
              options={DESIRED_LOOK}
              value={state.desired_look_feeling}
              onChange={(v) => set("desired_look_feeling", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Deliverables needed</Label>
            <ChipGroup
              options={DELIVERABLE_TYPES}
              value={state.deliverables_needed}
              onChange={(v) => set("deliverables_needed", v)}
            />
          </div>
          <div className="border-border bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium">Quantity / volume</span>
              <span className="text-muted-foreground text-sm">
                {state.quantity_volume} piece{state.quantity_volume === 1 ? "" : "s"}
              </span>
            </div>
            <Slider
              min={1}
              max={30}
              step={1}
              value={[state.quantity_volume]}
              onValueChange={(v) => set("quantity_volume", toArr(v)[0] ?? 1)}
            />
          </div>
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          stepIndex={2}
          totalSteps={TOTAL_STEPS}
          title="What kind of content are you looking for?"
          subtitle="Set the seven style dimensions to describe the content you want."
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

      {step === 3 && (
        <StepShell
          stepIndex={3}
          totalSteps={TOTAL_STEPS}
          title="Budget & timeline"
          subtitle="Your typical budgets and where the content will live."
          onBack={back}
          onNext={next}
        >
          <div className="border-border bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium">Typical budget range (EUR)</span>
              <span className="text-muted-foreground text-sm">
                €{state.typical_budget_range_min} – €
                {state.typical_budget_range_max}
              </span>
            </div>
            <Slider
              min={200}
              max={20000}
              step={100}
              value={[
                state.typical_budget_range_min,
                state.typical_budget_range_max,
              ]}
              onValueChange={(v) => {
                const arr = toArr(v);
                if (arr.length === 2) {
                  set("typical_budget_range_min", Math.min(arr[0], arr[1]));
                  set("typical_budget_range_max", Math.max(arr[0], arr[1]));
                }
              }}
            />
          </div>
          <div className="border-border bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium">Budget for this project</span>
              <span className="text-muted-foreground text-sm">
                €{state.budget_for_project}
              </span>
            </div>
            <Slider
              min={200}
              max={20000}
              step={100}
              value={[state.budget_for_project]}
              onValueChange={(v) => set("budget_for_project", toArr(v)[0] ?? 2000)}
            />
          </div>
          <div className="space-y-3">
            <Label>Where will the content be used?</Label>
            <ChipGroup
              options={CONTENT_PLATFORMS}
              value={state.content_usage_platforms}
              onChange={(v) => set("content_usage_platforms", v)}
            />
          </div>
        </StepShell>
      )}

      {step === 4 && (
        <StepShell
          stepIndex={4}
          totalSteps={TOTAL_STEPS}
          title="Your brand"
          subtitle="A short description helps creators understand what you stand for."
          onBack={back}
          onNext={next}
          onSkip={next}
          isImportant
        >
          <div className="space-y-3">
            <Label>Company stage</Label>
            <ChipGroup
              options={COMPANY_STAGES}
              value={[state.company_stage]}
              onChange={(v) => set("company_stage", v[0] ?? "seed")}
              allowMultiple={false}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              value={state.website_url}
              onChange={(e) => set("website_url", e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Company description</Label>
            <Textarea
              id="description"
              rows={4}
              value={state.company_description}
              onChange={(e) => set("company_description", e.target.value)}
              placeholder="A few sentences on what your company does and stands for."
            />
          </div>
          <div className="space-y-3">
            <Label>Brand look guidelines</Label>
            <ChipGroup
              options={BRAND_GUIDELINES}
              value={[state.brand_look_guidelines]}
              onChange={(v) =>
                set("brand_look_guidelines", v[0] ?? "loose_guidelines")
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
          title="Your audience"
          subtitle="Who are you making this content for?"
          onBack={back}
          onNext={next}
          onSkip={next}
          isImportant
        >
          <div className="space-y-3">
            <Label>Target audience</Label>
            <ChipGroup
              options={TARGET_AUDIENCE}
              value={state.target_audience}
              onChange={(v) => set("target_audience", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Content language</Label>
            <ChipGroup
              options={LANGUAGES}
              value={state.language}
              onChange={(v) => set("language", v)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="success">How do you measure success?</Label>
            <Textarea
              id="success"
              rows={3}
              value={state.success_criteria}
              onChange={(e) => set("success_criteria", e.target.value)}
              placeholder="e.g. social reach, engagement, brand recall."
            />
          </div>
        </StepShell>
      )}

      {step === 6 && (
        <StepShell
          stepIndex={6}
          totalSteps={TOTAL_STEPS}
          title="Creator requirements"
          subtitle="What qualities matter most, and what rights do you need?"
          onBack={back}
          onNext={finish}
          onSkip={finish}
          isImportant
          nextLabel={pending ? "Saving…" : "Finish"}
          nextDisabled={pending}
        >
          <div className="space-y-3">
            <Label>Qualities you look for in a creator</Label>
            <ChipGroup
              options={QUALITIES}
              value={state.qualities_in_creator}
              onChange={(v) => set("qualities_in_creator", v)}
            />
          </div>
          <div className="space-y-3">
            <Label>Usage rights scope</Label>
            <ChipGroup
              options={USAGE_RIGHTS}
              value={[state.usage_rights_scope]}
              onChange={(v) => set("usage_rights_scope", v[0] ?? "negotiable")}
              allowMultiple={false}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </StepShell>
      )}
    </>
  );
}
