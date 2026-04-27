/**
 * glimpse. seed script
 *
 * Prereqs:
 *   1. Run the SQL migrations at supabase/migrations/ in the Supabase dashboard
 *      (both 0001_init.sql and 0002_membership_and_briefs.sql)
 *   2. .env.local must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
 *
 * Run:  npm run seed
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_PASSWORD = "glimpse-seed-2026";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const enc = (p: string) => "/" + p.split("/").map(encodeURIComponent).join("/");
const seedImg = (folder: string, file: string) =>
  enc(`seed/${folder}/${file}`);

async function ensureAuthUser(
  client: SupabaseClient,
  email: string,
  userType: "creator" | "startup",
  displayName: string,
): Promise<string> {
  const { data: list, error: listErr } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await client.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { user_type: userType, display_name: displayName },
  });
  if (error) throw error;
  if (!data.user) throw new Error(`Failed to create user ${email}`);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreatorSeed = {
  email: string;
  avatar: string;
  membership: "free" | "pro";
  user: {
    display_name: string;
    location_city: string;
    location_country: string;
    languages: string[];
    cultural_markets: string[];
    bio?: string;
  };
  profile: Record<string, unknown>;
  posts: Array<Record<string, unknown>>;
};

type StartupSeed = {
  email: string;
  avatar: string | null; // null → initials fallback
  membership: "free" | "pro";
  user: {
    display_name: string;
    location_city: string;
    location_country: string;
    languages: string[];
    cultural_markets: string[];
  };
  profile: Record<string, unknown>;
  posts: Array<Record<string, unknown>>;
};

// ---------------------------------------------------------------------------
// Creators (5 consolidated profiles)
// ---------------------------------------------------------------------------

const creators: CreatorSeed[] = [
  {
    email: "kiri@seed.glimpse.app",
    avatar: "/avatars/1.jpg",
    membership: "pro",
    user: {
      display_name: "Kiri",
      location_city: "Munich",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU"],
      bio: "I grew up between boats, mountains, and my father's workshop — which is probably why I chase moments where aesthetics meet emotion. Whether it's a yacht at golden hour or a classic car on a mountain road, I want every frame to feel intentional. I shoot slowly. I wait for the light. I think a good image should breathe.\n\nCurrently based in Munich, but I work across the DACH region and Southern Europe. I travel light — a mirrorless body, two primes, a drone, and whatever the project actually needs. I care about craft over volume: I'd rather deliver 15 frames that sing than 300 that are fine.",
    },
    profile: {
      discipline: "both",
      content_categories: ["luxury_lifestyle", "maritime", "automotive"],
      deliverable_types: ["photo_series", "short_social", "long_brand_film"],
      rate_min: 500,
      rate_max: 1200,
      availability: "within_1_week",
      sub_specializations: [
        "drone_cinematography",
        "color_grading",
        "lifestyle_photography",
      ],
      industry_experience: [
        "luxury_lifestyle",
        "automotive",
        "travel_adventure",
      ],
      travel_willingness: "worldwide",
      preferred_project_types: [
        "brand_content",
        "editorial",
        "lifestyle_documentation",
      ],
      unwanted_work_types: ["corporate_talking_head", "stock_photography"],
      usage_licensing_preference: "negotiable",
      production_capabilities: [
        "solo_production",
        "post_production",
        "color_grading",
      ],
      creative_philosophy:
        "I chase moments where aesthetics meet emotion. Whether it's a yacht at golden hour or a classic car on a mountain road, I want every frame to feel intentional.",
      creative_discipline: "both",
      style_production_value: 8,
      style_pacing: 4,
      style_focus: 6,
      style_framing: 7,
      style_staging: 6,
      style_color: 7,
      style_sound: 5,
    },
    posts: [
      {
        title: "Lifestyle",
        description:
          "Lifestyle moments captured with intention. Natural light, relaxed staging, warm tones.",
        media_urls: [
          seedImg("Lifestyle Kiri", "5.jpg"),
          seedImg("Lifestyle Kiri", "10.PNG"),
          seedImg("Lifestyle Kiri", "11.jpg"),
          seedImg("Lifestyle Kiri", "18.jpg"),
          seedImg("Lifestyle Kiri", "23.jpg"),
          seedImg("Lifestyle Kiri", "34.jpg"),
          seedImg("Lifestyle Kiri", "42.jpg"),
        ],
        content_type: "photo_series",
        industry: "luxury_lifestyle",
        format: "horizontal",
        style_production_value: 7,
        style_pacing: 3,
        style_focus: 4,
        style_framing: 7,
        style_staging: 5,
        style_color: 7,
        style_sound: 3,
      },
      {
        title: "Yachting",
        description:
          "On the water. Natural light, no staging, just the boat and the landscape.",
        media_urls: [
          seedImg("Yachting Kiri", "Drone1.jpg"),
          seedImg("Yachting Kiri", "30.jpg"),
          seedImg("Yachting Kiri", "37.jpg"),
          seedImg("Yachting Kiri", "41.jpg"),
          seedImg("Yachting Kiri", "Drone20.jpg"),
          seedImg("Yachting Kiri", "Drone31.jpg"),
          seedImg("Yachting Kiri", "MainSalon1.jpg"),
          seedImg("Yachting Kiri", "MainSalon22.jpg"),
        ],
        content_type: "photo_series",
        industry: "luxury_lifestyle",
        format: "horizontal",
        style_production_value: 7,
        style_pacing: 2,
        style_focus: 5,
        style_framing: 9,
        style_staging: 3,
        style_color: 6,
        style_sound: 2,
      },
    ],
  },
  {
    email: "max@seed.glimpse.app",
    avatar: "/avatars/2.jpg",
    membership: "free",
    user: {
      display_name: "Max",
      location_city: "Berlin",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU"],
      bio: "From mosh pits to mountain peaks — I thrive in environments with raw energy. No retouching, no staging, just the moment. I started in music venues shooting bands for free, and somewhere along the way that lens turned outward: now I spend half my year on expeditions and the other half in sweaty clubs, and honestly I can't tell you which I prefer.\n\nI work best when I'm not supposed to be there — off-stage, backstage, off-trail. The best frames come from being quiet and waiting. I deliver fast: rough selects within 24 hours of a shoot, finals in a week.",
    },
    profile: {
      discipline: "both",
      content_categories: [
        "music_events",
        "outdoor_adventure",
        "nature_landscape",
        "automotive",
      ],
      deliverable_types: ["photo_series", "event_coverage", "short_social"],
      rate_min: 400,
      rate_max: 900,
      availability: "within_1_week",
      sub_specializations: [
        "event_photography",
        "landscape_photography",
        "concert_documentation",
      ],
      industry_experience: [
        "music_entertainment",
        "outdoor_sport",
        "travel_adventure",
        "automotive",
      ],
      travel_willingness: "international",
      preferred_project_types: [
        "event_coverage",
        "expedition_documentation",
        "brand_content",
      ],
      unwanted_work_types: ["corporate_events", "product_photography"],
      usage_licensing_preference: "negotiable",
      production_capabilities: ["solo_production", "post_production"],
      creative_philosophy:
        "From mosh pits to mountain peaks — I thrive in environments with raw energy. No retouching, no staging, just the moment.",
      creative_discipline: "both",
      style_production_value: 6,
      style_pacing: 6,
      style_focus: 4,
      style_framing: 7,
      style_staging: 2,
      style_color: 5,
      style_sound: 6,
    },
    posts: [
      {
        title: "Concert",
        description:
          "Live music energy. Stage lights, crowd moments, raw atmosphere.",
        media_urls: [
          seedImg("Concert Max", "DSC05433.jpg"),
          seedImg("Concert Max", "DSC00854.jpg"),
          seedImg("Concert Max", "DSC00858.jpg"),
          seedImg("Concert Max", "DSC00864.jpg"),
          seedImg("Concert Max", "DSC05126-2.jpg"),
          seedImg("Concert Max", "DSC05309.jpg"),
          seedImg("Concert Max", "DSC05381.jpg"),
          seedImg("Concert Max", "DSC05409.jpg"),
        ],
        content_type: "event_coverage",
        industry: "music_entertainment",
        format: "horizontal",
        style_production_value: 5,
        style_pacing: 8,
        style_focus: 4,
        style_framing: 5,
        style_staging: 1,
        style_color: 6,
        style_sound: 8,
      },
      {
        title: "Nature Adventure",
        description:
          "Mountains, glaciers, open landscapes. Shot on location, no staging, letting the scale speak for itself.",
        media_urls: [
          seedImg("Nature Adventure Max", "DSC08071-Enhanced-NR.jpg"),
          seedImg("Nature Adventure Max", "DSC01251.jpg"),
          seedImg("Nature Adventure Max", "DSC01471.jpg"),
          seedImg("Nature Adventure Max", "DSC02058.jpg"),
          seedImg("Nature Adventure Max", "DSC02164.jpg"),
          seedImg("Nature Adventure Max", "DSC03019.jpg"),
          seedImg("Nature Adventure Max", "DSC03165.jpg"),
          seedImg("Nature Adventure Max", "DSC07743.jpg"),
          seedImg("Nature Adventure Max", "DSC08124.jpg"),
          seedImg("Nature Adventure Max", "DSC08285.jpg"),
        ],
        content_type: "photo_series",
        industry: "outdoor_sport",
        format: "horizontal",
        style_production_value: 5,
        style_pacing: 2,
        style_focus: 3,
        style_framing: 9,
        style_staging: 1,
        style_color: 5,
        style_sound: 2,
      },
      {
        title: "Transportation",
        description:
          "Motorcycles, cars, machines in motion. Capturing the power and character of vehicles — on the road, on the track, in the wild.",
        media_urls: [
          seedImg("Transportation Max", "DSC06191.jpg"),
          seedImg("Transportation Max", "Bild 28.12.25 um 19.47.jpg"),
          seedImg("Transportation Max", "DSC00854.jpg"),
          seedImg("Transportation Max", "DSC01035.jpg"),
          seedImg("Transportation Max", "DSC01042.jpg"),
          seedImg("Transportation Max", "DSC01764.jpg"),
          seedImg("Transportation Max", "DSC04455 Kopie.jpg"),
          seedImg("Transportation Max", "DSC05939.jpg"),
          seedImg("Transportation Max", "DSC06100.jpg"),
          seedImg("Transportation Max", "DSC08017.jpg"),
        ],
        content_type: "product_photo",
        industry: "automotive",
        format: "horizontal",
        style_production_value: 7,
        style_pacing: 5,
        style_focus: 7,
        style_framing: 6,
        style_staging: 3,
        style_color: 6,
        style_sound: 4,
      },
    ],
  },
  {
    email: "nico@seed.glimpse.app",
    avatar: "/avatars/3.jpg",
    membership: "pro",
    user: {
      display_name: "Nico Castellano",
      location_city: "Monaco",
      location_country: "Monaco",
      languages: ["French", "Italian", "English"],
      cultural_markets: ["EU", "US"],
      bio: "Luxury, for me, lives in the details — the light on the water, the curve of a hull, the stillness of a sunset at sea. I grew up between Monaco and the Ligurian coast, which is the unfair head start of my career: I was handed the Mediterranean as a studio before I could drive.\n\nI specialize in marine and coastal work for luxury brands — yachts, villas, destination campaigns. I shoot from drones, RIBs, and tenders, and I'll happily jump in the water with housing if the shot is there. I deliver hero stills and short-form cinematic pieces that feel effortless, because that's the feeling luxury buys.",
    },
    profile: {
      discipline: "both",
      content_categories: ["marine", "luxury", "lifestyle"],
      deliverable_types: ["short_social", "photo_series", "long_brand_film"],
      rate_min: 800,
      rate_max: 2000,
      availability: "within_1_week",
      industry_experience: [
        "luxury_lifestyle",
        "travel_adventure",
        "real_estate",
      ],
      travel_willingness: "worldwide",
      preferred_project_types: [
        "luxury_brand_content",
        "lifestyle_documentation",
        "product_launch",
      ],
      unwanted_work_types: ["budget_projects", "corporate_headshots"],
      creative_philosophy:
        "Luxury is in the details — the light on the water, the curve of a hull, the stillness of a sunset at sea. I make it feel effortless.",
      creative_discipline: "both",
      style_production_value: 9,
      style_pacing: 3,
      style_focus: 6,
      style_framing: 8,
      style_staging: 5,
      style_color: 8,
      style_sound: 4,
    },
    posts: [
      {
        title: "Mediterranean — Water, Light, Machines",
        description:
          "Three studies of the Mediterranean: a classic sailing yacht at golden hour, a sleek speedboat carving through calm water at sunset, and the vertical drama of a volcanic coastline. Shot across three seasons, stitched together for a luxury travel editorial.",
        media_urls: [
          enc("seed/Gemini_yachting.png"),
          enc("seed/Gemini_speedboat.png"),
          enc("seed/Gemini_tropicallandscape.png"),
        ],
        content_type: "photo_series",
        industry: "luxury_lifestyle",
        format: "horizontal",
        style_production_value: 9,
        style_pacing: 3,
        style_focus: 5,
        style_framing: 8,
        style_staging: 4,
        style_color: 8,
        style_sound: 2,
      },
    ],
  },
  {
    email: "tom@seed.glimpse.app",
    avatar: "/avatars/4.jpg",
    membership: "free",
    user: {
      display_name: "Tom Ashworth",
      location_city: "London",
      location_country: "UK",
      languages: ["English"],
      cultural_markets: ["UK", "EU"],
      bio: "Motorsport is controlled chaos, and my job is to find the fraction of a second where speed becomes art. I started in rally, moved to circuit work, and now I split my time between superbike rounds, forest stages, and the occasional vintage aircraft show — anything with an engine and a story.\n\nI like machines that have been used. Scratched paint, track dust, oil on the fairing. That's the character clients actually buy, even if they don't know it yet. I work fast, carry my own gear to the edge of the track, and deliver pan-blur keepers and clean hero shots in the same gallery.",
    },
    profile: {
      discipline: "both",
      content_categories: ["motorsport", "automotive", "aviation"],
      deliverable_types: ["photo_series", "short_social", "event_coverage"],
      rate_min: 550,
      rate_max: 1000,
      availability: "immediately",
      industry_experience: ["automotive", "outdoor_sport"],
      travel_willingness: "international",
      preferred_project_types: ["event_coverage", "brand_content", "editorial"],
      unwanted_work_types: ["corporate_headshots", "real_estate"],
      creative_philosophy:
        "Motorsport is controlled chaos. My job is to find the fraction of a second where speed becomes art.",
      creative_discipline: "both",
      style_production_value: 8,
      style_pacing: 7,
      style_focus: 8,
      style_framing: 5,
      style_staging: 3,
      style_color: 6,
      style_sound: 6,
    },
    posts: [
      {
        title: "Machines at Speed — Rally, Track, Sky",
        description:
          "A cross-discipline set: vintage rally through a forest stage (pan blur, dust trail), a superbike hanging off into a wet corner, and dawn on a grass airfield with a lone propeller plane. Three subjects, one shared language of motion and precision.",
        media_urls: [
          enc("seed/Gemini_racingcar.png"),
          enc("seed/Gemini_superbike.png"),
          enc("seed/Gemini_airplane.png"),
        ],
        content_type: "event_coverage",
        industry: "automotive",
        format: "horizontal",
        style_production_value: 8,
        style_pacing: 7,
        style_focus: 8,
        style_framing: 5,
        style_staging: 2,
        style_color: 6,
        style_sound: 5,
      },
    ],
  },
  {
    email: "lena@seed.glimpse.app",
    avatar: "/avatars/5.jpg",
    membership: "free",
    user: {
      display_name: "Lena Berger",
      location_city: "Innsbruck",
      location_country: "Austria",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "Nordics", "EU"],
      bio: "Mountains demand humility. I go where the weather takes me and let the landscape dictate the frame — I don't fight it, I wait. That patience shows up in the work: long exposures, wide compositions, a lot of blue hour. My camera bag spends more time on a glacier than in a studio, and I'm honestly not sure I could shoot a product on white if you asked me to.\n\nI split my year between the Alps and the Nordics. I mostly work with outdoor, sustainability, and expedition brands — the ones who understand that the best shot is the one you had to earn.",
    },
    profile: {
      discipline: "photo",
      content_categories: [
        "mountain_landscape",
        "nature_landscape",
        "nordic",
        "outdoor_adventure",
      ],
      deliverable_types: ["photo_series", "long_brand_film"],
      rate_min: 400,
      rate_max: 800,
      availability: "within_1_month",
      industry_experience: [
        "outdoor_sport",
        "travel_adventure",
        "sustainability",
      ],
      travel_willingness: "international",
      preferred_project_types: [
        "expedition_documentation",
        "editorial",
        "brand_content",
      ],
      unwanted_work_types: [
        "studio_work",
        "product_photography",
        "fast_turnaround",
      ],
      creative_philosophy:
        "Mountains demand humility. I go where the weather takes me and let the landscape dictate the frame.",
      creative_discipline: "photographer",
      style_production_value: 6,
      style_pacing: 1,
      style_focus: 1,
      style_framing: 10,
      style_staging: 1,
      style_color: 4,
      style_sound: 1,
    },
    posts: [
      {
        title: "North — Alps to the Fjord",
        description:
          "A two-part study in stillness. The Alpine valley at dusk, and a Norwegian fjord at dawn — both about waiting for the moment the world holds its breath.",
        media_urls: [
          enc("seed/Gemini_mountains.png"),
          enc("seed/Gemini_fjord.png"),
        ],
        content_type: "photo_series",
        industry: "outdoor_sport",
        format: "horizontal",
        style_production_value: 6,
        style_pacing: 1,
        style_focus: 1,
        style_framing: 10,
        style_staging: 1,
        style_color: 4,
        style_sound: 1,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Startups (3 — Heimplanet Free, DeepDrive Pro, Voltfang Pro)
// ---------------------------------------------------------------------------

const startups: StartupSeed[] = [
  {
    email: "heimplanet@seed.glimpse.app",
    avatar: null,
    membership: "free",
    user: {
      display_name: "Heimplanet",
      location_city: "Hamburg",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU", "US"],
    },
    profile: {
      company_name: "Heimplanet",
      industry: "outdoor_sport",
      location_market: ["DACH", "EU", "US"],
      contact_person: "Clara Vogt",
      contact_role: "Brand Manager",
      company_stage: "established",
      typical_budget_range_min: 500,
      typical_budget_range_max: 2000,
      project_goal: ["brand_awareness", "social_growth"],
      desired_look_feeling: ["authentic", "immersive", "grounded", "warm"],
      deliverables_needed: ["short_social", "photo_series"],
      content_usage_platforms: ["instagram", "tiktok", "website"],
      target_audience: ["millennials", "outdoor_enthusiasts"],
      qualities_in_creator: [
        "creativity",
        "reliability",
        "brand_understanding",
      ],
      brand_description:
        "Premium outdoor gear brand. We make inflatable tents and travel gear. Our visual identity is immersive, grounded, and people-centered. We want content that captures quiet, meaningful moments in nature.",
      style_production_value: 5,
      style_pacing: 2,
      style_focus: 3,
      style_framing: 7,
      style_staging: 2,
      style_color: 5,
      style_sound: 2,
    },
    posts: [
      {
        title: "Looking for: Outdoor Content Creator — Summer Series",
        description:
          "We're planning a three-month social series around our inflatable tent line and need a creator who lives the lifestyle, not just shoots it.\n\n• 10–20 second vertical clips, 4–6 per week\n• Authentic morning-coffee-at-camp energy, not pitched ad content\n• Self-directed shoots in Germany, Austria, and the Alps\n• Comfortable filming solo with minimal kit\n• Must own and use our gear (or be genuinely excited to)\n• Budget: €500–2,000 per delivery block, depending on scope",
        media_urls: [
          seedImg("Nature Adventure Max", "DSC08071-Enhanced-NR.jpg"),
          seedImg("Nature Adventure Max", "DSC02058.jpg"),
        ],
        content_type: "short_social",
        industry: "outdoor_sport",
        format: "vertical",
        style_production_value: 4,
        style_pacing: 2,
        style_focus: 3,
        style_framing: 7,
        style_staging: 2,
        style_color: 5,
        style_sound: 2,
      },
    ],
  },
  {
    email: "deepdrive@seed.glimpse.app",
    avatar: null,
    membership: "pro",
    user: {
      display_name: "DeepDrive",
      location_city: "Munich",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU"],
    },
    profile: {
      company_name: "DeepDrive",
      industry: "tech_saas",
      location_market: ["DACH", "EU"],
      contact_person: "Jan Weber",
      contact_role: "Head of Marketing",
      company_stage: "series_a",
      typical_budget_range_min: 1000,
      typical_budget_range_max: 5000,
      project_goal: ["product_launch", "website_content", "brand_awareness"],
      desired_look_feeling: ["premium", "corporate", "clean", "high_tech"],
      deliverables_needed: ["long_brand_film", "product_video"],
      content_usage_platforms: ["website", "linkedin", "youtube"],
      target_audience: ["b2b_decision_makers", "tech_enthusiasts", "investors"],
      qualities_in_creator: ["reliability", "speed", "brand_understanding"],
      brand_description:
        "Electric mobility deep-tech startup. We build the most efficient electric motors in the world. Our brand is simple but bold, professional but electrifying. We want every frame to feel like precision engineering.",
      style_production_value: 9,
      style_pacing: 8,
      style_focus: 9,
      style_framing: 5,
      style_staging: 8,
      style_color: 5,
      style_sound: 6,
    },
    posts: [
      {
        title: "Hiring: Production Process Film — Electric Motor Launch",
        description:
          "30–40 second cinematic film covering our full in-wheel motor production process, from copper wire to assembled drive unit. This is our hero asset for the Series A launch — it needs to feel engineered, not produced.\n\n• Tight, fast-cut sequence with rhythm-driven edit\n• Macro-heavy, industrial color palette, minimal color grade\n• Access to our Munich factory floor for a 2-day shoot window\n• Scripted shot list provided; we want a DP, not a storyteller\n• Final delivery: web hero + 6 platform cutdowns\n• Budget: €4,000–5,000 all-in including post",
        media_urls: [
          seedImg("Transportation Max", "DSC06100.jpg"),
          seedImg("Transportation Max", "DSC04455 Kopie.jpg"),
        ],
        content_type: "long_brand_film",
        industry: "tech_saas",
        format: "horizontal",
        style_production_value: 9,
        style_pacing: 8,
        style_focus: 9,
        style_framing: 5,
        style_staging: 9,
        style_color: 5,
        style_sound: 6,
      },
    ],
  },
  {
    email: "voltfang@seed.glimpse.app",
    avatar: "/images/voltfang-logo.png",
    membership: "pro",
    user: {
      display_name: "Voltfang",
      location_city: "Aachen",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU"],
    },
    profile: {
      company_name: "Voltfang",
      industry: "sustainability",
      location_market: ["DACH", "EU"],
      contact_person: "Leah Bergmann",
      contact_role: "Head of Brand",
      company_stage: "series_a",
      typical_budget_range_min: 2000,
      typical_budget_range_max: 8000,
      project_goal: ["brand_awareness", "product_launch", "website_content"],
      desired_look_feeling: ["premium", "warm", "grounded", "cinematic"],
      deliverables_needed: ["photo_series", "long_brand_film", "short_social"],
      content_usage_platforms: ["website", "linkedin", "instagram", "youtube"],
      target_audience: [
        "b2b_decision_makers",
        "investors",
        "tech_enthusiasts",
      ],
      qualities_in_creator: [
        "creativity",
        "brand_understanding",
        "reliability",
      ],
      brand_description:
        "Voltfang builds battery energy storage systems from second-life EV batteries. Our mission is industrial-scale circularity: giving retired EV batteries a decade of second life as stationary storage for businesses, utilities, and the grid. We want visuals that feel warm and confident — sustainability without the cliché.",
      style_production_value: 8,
      style_pacing: 4,
      style_focus: 7,
      style_framing: 6,
      style_staging: 5,
      style_color: 6,
      style_sound: 4,
    },
    posts: [
      {
        title: "Hiring: Visual Storyteller for Second-Life Battery Campaign",
        description:
          "We're launching our commercial battery storage line and need a creator to help us visually tell the circularity story — the batteries inside our systems have already powered cars for 8 years, and have another decade in them.\n\n• Photo series + 45s brand film for the product launch\n• Industrial environments: our Aachen facility, customer sites, a battery disassembly line\n• Warm, confident aesthetic — premium but grounded, no generic green-wash visuals\n• Strong editorial eye for people-at-work, machines, and material detail\n• Experience in sustainability, industrial, or tech storytelling preferred\n• Rights: full buyout across web, social, paid, and trade\n• Budget: €5,000–8,000 depending on scope and travel",
        media_urls: [
          enc("seed/Voltfang/image1.png"),
          enc("seed/Voltfang/image2.png"),
        ],
        content_type: "photo_series",
        industry: "sustainability",
        format: "horizontal",
        style_production_value: 8,
        style_pacing: 4,
        style_focus: 7,
        style_framing: 6,
        style_staging: 5,
        style_color: 6,
        style_sound: 4,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

type ReviewSeed = {
  reviewer: string;
  reviewed: string;
  project_description: string;
  rating_overall: number;
  rating_reliability: number;
  rating_quality: number;
  rating_collaboration: number;
  review_text: string;
};

const reviews: ReviewSeed[] = [
  {
    reviewer: "heimplanet@seed.glimpse.app",
    reviewed: "max@seed.glimpse.app",
    project_description:
      "Outdoor adventure content — 1 week hiking documentation in Norway",
    rating_overall: 5,
    rating_reliability: 5,
    rating_quality: 5,
    rating_collaboration: 4,
    review_text:
      "Max delivered exactly the kind of raw, immersive imagery we were looking for. He understood our brand from the first call and brought back frames that made us feel like we were there. Would work with him again in a heartbeat.",
  },
  {
    reviewer: "deepdrive@seed.glimpse.app",
    reviewed: "kiri@seed.glimpse.app",
    project_description:
      "Product photography for electric motor components — 1 day studio shoot",
    rating_overall: 4,
    rating_reliability: 5,
    rating_quality: 4,
    rating_collaboration: 5,
    review_text:
      "Professional, punctual, and great eye for technical detail. Kiri understood how to make engineering components look compelling without losing accuracy. Solid work.",
  },
  {
    reviewer: "kiri@seed.glimpse.app",
    reviewed: "deepdrive@seed.glimpse.app",
    project_description:
      "Product photography for electric motor components — 1 day studio shoot",
    rating_overall: 4,
    rating_reliability: 4,
    rating_quality: 4,
    rating_collaboration: 5,
    review_text:
      "Clear brief, well-organized shoot day, fast payment. The team knew exactly what they wanted, which made the whole process smooth.",
  },
  {
    reviewer: "voltfang@seed.glimpse.app",
    reviewed: "lena@seed.glimpse.app",
    project_description:
      "Sustainability editorial shoot — 3 day facility + customer site documentation",
    rating_overall: 5,
    rating_reliability: 5,
    rating_quality: 5,
    rating_collaboration: 5,
    review_text:
      "Lena treated our factory floor like a landscape — patient, quiet, and somehow ended up with frames that felt both industrial and warm. She got the story we've struggled to tell for a year.",
  },
  {
    reviewer: "voltfang@seed.glimpse.app",
    reviewed: "max@seed.glimpse.app",
    project_description:
      "Event coverage — Hannover Messe booth and customer testimonials",
    rating_overall: 5,
    rating_reliability: 4,
    rating_quality: 5,
    rating_collaboration: 5,
    review_text:
      "Fast, unobtrusive, and genuinely engaged with the subject matter. Max walked the floor like a journalist and delivered a story, not just coverage.",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seedCreator(c: CreatorSeed) {
  const id = await ensureAuthUser(
    supabase,
    c.email,
    "creator",
    c.user.display_name,
  );

  const { error: userErr } = await supabase.from("users").upsert({
    id,
    email: c.email,
    user_type: "creator",
    display_name: c.user.display_name,
    avatar_url: c.avatar,
    bio: c.user.bio,
    location_city: c.user.location_city,
    location_country: c.user.location_country,
    languages: c.user.languages,
    cultural_markets: c.user.cultural_markets,
    onboarding_completed: true,
    membership_tier: c.membership,
  });
  if (userErr) throw userErr;

  const { error: profErr } = await supabase
    .from("creator_profiles")
    .upsert({ user_id: id, ...c.profile });
  if (profErr) throw profErr;

  const { error: delErr } = await supabase
    .from("posts")
    .delete()
    .eq("user_id", id);
  if (delErr) throw delErr;

  const postRows = c.posts.map((p) => ({
    user_id: id,
    post_type: "portfolio_piece",
    ...p,
    thumbnail_url: (p.media_urls as string[])[0] ?? null,
  }));
  const { error: postsErr } = await supabase.from("posts").insert(postRows);
  if (postsErr) throw postsErr;

  console.log(`  ✓ creator ${c.user.display_name} (${c.posts.length} posts)`);
  return id;
}

async function seedStartup(s: StartupSeed) {
  const id = await ensureAuthUser(
    supabase,
    s.email,
    "startup",
    s.user.display_name,
  );

  const { error: userErr } = await supabase.from("users").upsert({
    id,
    email: s.email,
    user_type: "startup",
    display_name: s.user.display_name,
    avatar_url: s.avatar,
    location_city: s.user.location_city,
    location_country: s.user.location_country,
    languages: s.user.languages,
    cultural_markets: s.user.cultural_markets,
    onboarding_completed: true,
    membership_tier: s.membership,
  });
  if (userErr) throw userErr;

  const { error: profErr } = await supabase
    .from("startup_profiles")
    .upsert({ user_id: id, contact_email: s.email, ...s.profile });
  if (profErr) throw profErr;

  const { error: delErr } = await supabase
    .from("posts")
    .delete()
    .eq("user_id", id);
  if (delErr) throw delErr;

  const postRows = s.posts.map((p) => ({
    user_id: id,
    post_type: "job_listing",
    ...p,
    thumbnail_url: (p.media_urls as string[])[0] ?? null,
  }));
  const { error: postsErr } = await supabase.from("posts").insert(postRows);
  if (postsErr) throw postsErr;

  console.log(`  ✓ startup ${s.user.display_name} (${s.posts.length} posts)`);
  return id;
}

async function seedReviews(emailToId: Map<string, string>) {
  const seedIds = Array.from(emailToId.values());
  const { error: delErr } = await supabase
    .from("reviews")
    .delete()
    .in("reviewer_id", seedIds);
  if (delErr) throw delErr;

  const rows = reviews
    .map((r) => {
      const reviewer_id = emailToId.get(r.reviewer);
      const reviewed_id = emailToId.get(r.reviewed);
      if (!reviewer_id || !reviewed_id) return null;
      return {
        reviewer_id,
        reviewed_id,
        project_description: r.project_description,
        rating_overall: r.rating_overall,
        rating_reliability: r.rating_reliability,
        rating_quality: r.rating_quality,
        rating_collaboration: r.rating_collaboration,
        review_text: r.review_text,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const { error } = await supabase.from("reviews").insert(rows);
  if (error) throw error;
  console.log(`  ✓ ${rows.length} reviews`);
}

async function main() {
  console.log("Seeding glimpse.");
  const emailToId = new Map<string, string>();

  console.log("\nCreators:");
  for (const c of creators) {
    const id = await seedCreator(c);
    emailToId.set(c.email, id);
  }

  console.log("\nStartups:");
  for (const s of startups) {
    const id = await seedStartup(s);
    emailToId.set(s.email, id);
  }

  console.log("\nReviews:");
  await seedReviews(emailToId);

  console.log("\nDone.");
  console.log(
    `All seed accounts use password: ${SEED_PASSWORD} — log in with any email to preview that profile.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
