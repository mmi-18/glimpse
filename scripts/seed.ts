/**
 * glimpse. seed script
 *
 * Prereqs:
 *   1. Run the SQL migration at supabase/migrations/0001_init.sql in the Supabase dashboard
 *   2. .env.local must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
 *
 * Run:  npm run seed
 *
 * Idempotent: safe to re-run. Uses fixed emails as the identity key.
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
const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}`;

async function ensureAuthUser(
  client: SupabaseClient,
  email: string,
  userType: "creator" | "startup",
  displayName: string,
): Promise<string> {
  // Check if user exists
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
// Seed data
// ---------------------------------------------------------------------------

type CreatorSeed = {
  email: string;
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

const creators: CreatorSeed[] = [
  {
    email: "kiri@seed.glimpse.app",
    user: {
      display_name: "Kiri",
      location_city: "Munich",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU"],
      bio: "I chase moments where aesthetics meet emotion. Whether it's a yacht at golden hour or a classic car on a mountain road, I want every frame to feel intentional.",
    },
    profile: {
      discipline: "both",
      content_categories: ["luxury_lifestyle", "maritime", "automotive"],
      content_style_tags: ["cinematic", "polished", "moody", "editorial"],
      deliverable_types: ["photo_series", "short_social", "long_brand_film"],
      rate_min: 500,
      rate_max: 1200,
      availability: "within_1_week",
      sub_specializations: [
        "drone_cinematography",
        "color_grading",
        "lifestyle_photography",
      ],
      industry_experience: ["luxury_lifestyle", "automotive", "travel_adventure"],
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
    user: {
      display_name: "Max",
      location_city: "Berlin",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU"],
      bio: "From mosh pits to mountain peaks — I thrive in environments with raw energy. No retouching, no staging, just the moment.",
    },
    profile: {
      discipline: "both",
      content_categories: [
        "music_events",
        "outdoor_adventure",
        "nature_landscape",
        "automotive",
      ],
      content_style_tags: [
        "moody",
        "raw",
        "atmospheric",
        "documentary",
        "energetic",
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
    email: "kai@seed.glimpse.app",
    user: {
      display_name: "Kai Lindstrom",
      location_city: "Gothenburg",
      location_country: "Sweden",
      languages: ["Swedish", "English"],
      cultural_markets: ["Nordics", "EU"],
      bio: "The sea teaches patience. I wait for the light, the spray, the moment a sail catches the wind just right.",
    },
    profile: {
      discipline: "both",
      content_categories: ["maritime", "sailing", "travel"],
      content_style_tags: ["cinematic", "warm", "golden_hour", "editorial"],
      deliverable_types: ["photo_series", "short_social", "long_brand_film"],
      rate_min: 600,
      rate_max: 1100,
      availability: "within_1_week",
      industry_experience: ["luxury_lifestyle", "travel_adventure", "outdoor_sport"],
      travel_willingness: "worldwide",
      preferred_project_types: ["brand_content", "lifestyle_documentation"],
      unwanted_work_types: ["corporate_events"],
      creative_philosophy:
        "The sea teaches patience. I wait for the light, the spray, the moment a sail catches the wind just right.",
      creative_discipline: "both",
      style_production_value: 8,
      style_pacing: 3,
      style_focus: 5,
      style_framing: 8,
      style_staging: 4,
      style_color: 7,
      style_sound: 3,
    },
    posts: [
      {
        title: "Golden Hour Crossing",
        description:
          "Classic sailing yacht cutting through deep blue water at sunset. Water-level perspective.",
        media_urls: [enc("seed/Gemini_yachting.png")],
        content_type: "photo_series",
        industry: "luxury_lifestyle",
        format: "horizontal",
        style_production_value: 8,
        style_pacing: 2,
        style_focus: 5,
        style_framing: 8,
        style_staging: 3,
        style_color: 8,
        style_sound: 2,
      },
    ],
  },
  {
    email: "marco@seed.glimpse.app",
    user: {
      display_name: "Marco Veltri",
      location_city: "Milan",
      location_country: "Italy",
      languages: ["Italian", "English"],
      cultural_markets: ["EU"],
      bio: "I'm drawn to machines that have a story. The older the aircraft, the more character in the frame.",
    },
    profile: {
      discipline: "photo",
      content_categories: ["aviation", "transport", "vintage"],
      content_style_tags: ["nostalgic", "muted", "documentary", "film_look"],
      deliverable_types: ["photo_series", "product_video"],
      rate_min: 450,
      rate_max: 850,
      availability: "within_1_week",
      industry_experience: ["automotive", "travel_adventure"],
      travel_willingness: "international",
      preferred_project_types: ["editorial", "heritage_brands"],
      unwanted_work_types: ["social_media_reels", "fast_turnaround"],
      creative_philosophy:
        "I'm drawn to machines that have a story. The older the aircraft, the more character in the frame.",
      creative_discipline: "photographer",
      style_production_value: 7,
      style_pacing: 2,
      style_focus: 7,
      style_framing: 6,
      style_staging: 3,
      style_color: 4,
      style_sound: 2,
    },
    posts: [
      {
        title: "Dawn at the Airfield",
        description:
          "Vintage propeller aircraft on a misty grass airfield. First light, no people, just the machine and the morning.",
        media_urls: [enc("seed/Gemini_airplane.png")],
        content_type: "photo_series",
        industry: "automotive",
        format: "horizontal",
        style_production_value: 7,
        style_pacing: 1,
        style_focus: 8,
        style_framing: 6,
        style_staging: 2,
        style_color: 4,
        style_sound: 1,
      },
    ],
  },
  {
    email: "lena@seed.glimpse.app",
    user: {
      display_name: "Lena Berger",
      location_city: "Innsbruck",
      location_country: "Austria",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU"],
      bio: "Mountains demand humility. I go where the weather takes me and let the landscape dictate the frame.",
    },
    profile: {
      discipline: "photo",
      content_categories: ["mountain_landscape", "nature", "outdoor_adventure"],
      content_style_tags: ["moody", "atmospheric", "wide_angle", "blue_hour"],
      deliverable_types: ["photo_series", "long_brand_film"],
      rate_min: 400,
      rate_max: 800,
      availability: "within_1_month",
      industry_experience: ["outdoor_sport", "travel_adventure", "sustainability"],
      travel_willingness: "international",
      preferred_project_types: [
        "expedition_documentation",
        "editorial",
        "brand_content",
      ],
      unwanted_work_types: ["studio_work", "product_photography"],
      creative_philosophy:
        "Mountains demand humility. I go where the weather takes me and let the landscape dictate the frame.",
      creative_discipline: "photographer",
      style_production_value: 6,
      style_pacing: 1,
      style_focus: 2,
      style_framing: 10,
      style_staging: 1,
      style_color: 5,
      style_sound: 1,
    },
    posts: [
      {
        title: "Blue Hour Valley",
        description:
          "Alpine valley at dusk. River winding through steep mountain walls, clouds touching the peaks.",
        media_urls: [enc("seed/Gemini_mountains.png")],
        content_type: "photo_series",
        industry: "outdoor_sport",
        format: "horizontal",
        style_production_value: 6,
        style_pacing: 1,
        style_focus: 1,
        style_framing: 10,
        style_staging: 1,
        style_color: 5,
        style_sound: 1,
      },
    ],
  },
  {
    email: "tom@seed.glimpse.app",
    user: {
      display_name: "Tom Ashworth",
      location_city: "London",
      location_country: "UK",
      languages: ["English"],
      cultural_markets: ["UK", "EU"],
      bio: "Motorsport is controlled chaos. My job is to find the fraction of a second where speed becomes art.",
    },
    profile: {
      discipline: "both",
      content_categories: ["motorsport", "automotive", "rally"],
      content_style_tags: ["action", "editorial", "desaturated", "dynamic"],
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
        title: "Gravel Stage — Forest Rally",
        description:
          "Vintage rally car drifting through a forest stage. Panning shot, motion blur, dust trail.",
        media_urls: [enc("seed/Gemini_racingcar.png")],
        content_type: "event_coverage",
        industry: "automotive",
        format: "horizontal",
        style_production_value: 8,
        style_pacing: 8,
        style_focus: 8,
        style_framing: 5,
        style_staging: 2,
        style_color: 5,
        style_sound: 5,
      },
    ],
  },
  {
    email: "sofia@seed.glimpse.app",
    user: {
      display_name: "Sofia Reyes",
      location_city: "Lisbon",
      location_country: "Portugal",
      languages: ["Portuguese", "Spanish", "English"],
      cultural_markets: ["EU", "US"],
      bio: "I follow coastlines. Every cliff, every cove has a different story depending on the light and the tide.",
    },
    profile: {
      discipline: "photo",
      content_categories: ["travel", "coastal", "nature"],
      content_style_tags: ["vibrant", "natural", "editorial", "warm"],
      deliverable_types: ["photo_series", "short_social"],
      rate_min: 350,
      rate_max: 750,
      availability: "within_1_week",
      industry_experience: ["travel_adventure", "lifestyle", "outdoor_sport"],
      travel_willingness: "worldwide",
      preferred_project_types: [
        "travel_editorial",
        "brand_content",
        "destination_marketing",
      ],
      unwanted_work_types: ["studio_work", "corporate_events"],
      creative_philosophy:
        "I follow coastlines. Every cliff, every cove has a different story depending on the light and the tide.",
      creative_discipline: "photographer",
      style_production_value: 7,
      style_pacing: 3,
      style_focus: 3,
      style_framing: 9,
      style_staging: 2,
      style_color: 7,
      style_sound: 2,
    },
    posts: [
      {
        title: "Cliff Edge — Tropical Coast",
        description:
          "Dramatic coastline from above. Turquoise water, volcanic rock, a single boat far below.",
        media_urls: [enc("seed/Gemini_tropicallandscape.png")],
        content_type: "photo_series",
        industry: "travel_adventure",
        format: "horizontal",
        style_production_value: 7,
        style_pacing: 2,
        style_focus: 2,
        style_framing: 9,
        style_staging: 1,
        style_color: 7,
        style_sound: 1,
      },
    ],
  },
  {
    email: "jonas@seed.glimpse.app",
    user: {
      display_name: "Jonas Kramer",
      location_city: "Cologne",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU"],
      bio: "Two wheels, 300 km/h, one chance to nail the shot. That pressure is what makes it worth it.",
    },
    profile: {
      discipline: "both",
      content_categories: ["motorsport", "motorcycle", "action"],
      content_style_tags: ["dynamic", "high_contrast", "dramatic", "panning"],
      deliverable_types: ["photo_series", "short_social", "event_coverage"],
      rate_min: 500,
      rate_max: 950,
      availability: "immediately",
      industry_experience: ["automotive", "outdoor_sport"],
      travel_willingness: "international",
      preferred_project_types: [
        "event_coverage",
        "brand_content",
        "product_launch",
      ],
      unwanted_work_types: ["food_photography", "real_estate"],
      creative_philosophy:
        "Two wheels, 300 km/h, one chance to nail the shot. That pressure is what makes it worth it.",
      creative_discipline: "both",
      style_production_value: 8,
      style_pacing: 8,
      style_focus: 9,
      style_framing: 5,
      style_staging: 3,
      style_color: 8,
      style_sound: 7,
    },
    posts: [
      {
        title: "Knee Down — Wet Track",
        description:
          "Superbike leaning deep into a corner, wet track reflections, panning motion blur.",
        media_urls: [enc("seed/Gemini_superbike.png")],
        content_type: "event_coverage",
        industry: "automotive",
        format: "horizontal",
        style_production_value: 8,
        style_pacing: 9,
        style_focus: 9,
        style_framing: 4,
        style_staging: 2,
        style_color: 8,
        style_sound: 6,
      },
    ],
  },
  {
    email: "astrid@seed.glimpse.app",
    user: {
      display_name: "Astrid Holm",
      location_city: "Tromso",
      location_country: "Norway",
      languages: ["Norwegian", "English"],
      cultural_markets: ["Nordics", "EU"],
      bio: "The fjords teach you to be still. I wait for the moment the water goes perfectly flat and the world holds its breath.",
    },
    profile: {
      discipline: "photo",
      content_categories: ["nature_landscape", "wilderness", "nordic"],
      content_style_tags: [
        "meditative",
        "muted",
        "scandinavian",
        "minimalist",
      ],
      deliverable_types: ["photo_series", "long_brand_film"],
      rate_min: 450,
      rate_max: 900,
      availability: "within_1_month",
      industry_experience: ["outdoor_sport", "sustainability", "travel_adventure"],
      travel_willingness: "national",
      preferred_project_types: [
        "editorial",
        "brand_content",
        "expedition_documentation",
      ],
      unwanted_work_types: [
        "fast_turnaround",
        "corporate_events",
        "studio_work",
      ],
      creative_philosophy:
        "The fjords teach you to be still. I wait for the moment the water goes perfectly flat and the world holds its breath.",
      creative_discipline: "photographer",
      style_production_value: 6,
      style_pacing: 1,
      style_focus: 1,
      style_framing: 10,
      style_staging: 1,
      style_color: 3,
      style_sound: 1,
    },
    posts: [
      {
        title: "Morning Stillness — Lofoten",
        description:
          "Norwegian fjord at dawn. Mirror water, fog on the surface, a single red cabin on the shore.",
        media_urls: [enc("seed/Gemini_fjord.png")],
        content_type: "photo_series",
        industry: "outdoor_sport",
        format: "horizontal",
        style_production_value: 6,
        style_pacing: 1,
        style_focus: 1,
        style_framing: 10,
        style_staging: 1,
        style_color: 3,
        style_sound: 1,
      },
    ],
  },
  {
    email: "nico@seed.glimpse.app",
    user: {
      display_name: "Nico Castellano",
      location_city: "Monaco",
      location_country: "Monaco",
      languages: ["French", "Italian", "English"],
      cultural_markets: ["EU", "US"],
      bio: "Luxury is in the details — the light on the water, the curve of a hull, the stillness of a sunset at sea. I make it feel effortless.",
    },
    profile: {
      discipline: "both",
      content_categories: ["marine", "luxury", "lifestyle"],
      content_style_tags: ["premium", "warm", "golden", "aerial"],
      deliverable_types: ["short_social", "photo_series", "long_brand_film"],
      rate_min: 800,
      rate_max: 2000,
      availability: "within_1_week",
      industry_experience: ["luxury_lifestyle", "travel_adventure", "real_estate"],
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
        title: "Mediterranean Sunset Run",
        description:
          "Sleek speedboat cutting through calm water at sunset. Drone perspective, golden light on the wake.",
        media_urls: [enc("seed/Gemini_speedboat.png")],
        content_type: "photo_series",
        industry: "luxury_lifestyle",
        format: "horizontal",
        style_production_value: 9,
        style_pacing: 3,
        style_focus: 6,
        style_framing: 8,
        style_staging: 4,
        style_color: 8,
        style_sound: 3,
      },
    ],
  },
];

const startups: StartupSeed[] = [
  {
    email: "heimplanet@seed.glimpse.app",
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
        title: "Looking for: Outdoor Content Creator",
        description:
          "We need 10-20 second vertical clips capturing immersive Heimplanet moments — the view after a hike, morning coffee at camp, a tent in the wind. Raw, authentic, not overly produced.",
        media_urls: [],
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
        "Electric mobility deep tech startup. We build the most efficient electric motors. Our brand is simple but bold, professional but electrifying. We need a 30-40 second website video showing our production process.",
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
        title: "Hiring: Website Video Production",
        description:
          "30-40 second fast-paced visual sequence of our entire production process. From wire to assembled electric motor. Clean, professional, high-end. Scripted scene list provided.",
        media_urls: [],
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
    email: "bmw-motorrad@seed.glimpse.app",
    user: {
      display_name: "BMW Motorrad",
      location_city: "Munich",
      location_country: "Germany",
      languages: ["German", "English"],
      cultural_markets: ["DACH", "EU", "US", "Global"],
    },
    profile: {
      company_name: "BMW Motorrad",
      industry: "automotive",
      location_market: ["DACH", "EU", "US", "Global"],
      contact_person: "Andrea Kern",
      contact_role: "Senior Brand Content Manager",
      company_stage: "established",
      typical_budget_range_min: 3000,
      typical_budget_range_max: 15000,
      project_goal: ["product_launch", "brand_awareness", "social_growth"],
      desired_look_feeling: ["premium", "dynamic", "cinematic", "bold"],
      deliverables_needed: ["photo_series", "short_social", "long_brand_film"],
      content_usage_platforms: ["instagram", "youtube", "website", "paid_ads"],
      target_audience: ["millennials", "gen_z", "motorcycle_enthusiasts"],
      qualities_in_creator: [
        "creativity",
        "reliability",
        "speed",
        "brand_understanding",
      ],
      brand_description:
        "BMW Motorrad is looking for visual creators who can capture the thrill and precision of our motorcycles. We want content that makes you feel the ride — dynamic, premium, and emotionally charged.",
      style_production_value: 9,
      style_pacing: 7,
      style_focus: 8,
      style_framing: 6,
      style_staging: 6,
      style_color: 7,
      style_sound: 7,
    },
    posts: [
      {
        title: "Seeking: Motorcycle Content Creator for R 1300 GS Launch",
        description:
          "We're launching the new R 1300 GS and need a content creator for a 3-day shoot in the Alps. Deliverables: 15-20 hero images + 3 short-form social clips (15-30s each). Must capture the bike in motion and at rest in dramatic mountain scenery. Cinematic, bold, premium feel. Experience with automotive/motorcycle content preferred.",
        media_urls: [seedImg("Transportation Max", "DSC06191.jpg")],
        content_type: "photo_series",
        industry: "automotive",
        format: "horizontal",
        style_production_value: 9,
        style_pacing: 7,
        style_focus: 8,
        style_framing: 6,
        style_staging: 5,
        style_color: 7,
        style_sound: 6,
      },
    ],
  },
];

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
    reviewer: "bmw-motorrad@seed.glimpse.app",
    reviewed: "max@seed.glimpse.app",
    project_description:
      "Motorcycle lifestyle shoot for R nineT campaign — 2 day shoot in Bavaria",
    rating_overall: 5,
    rating_reliability: 5,
    rating_quality: 5,
    rating_collaboration: 5,
    review_text:
      "Max nailed the brief perfectly. Every frame felt premium and authentic. Fast turnaround, great communication, and the final selects exceeded expectations. Already planning the next project together.",
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
    avatar_url: avatar(c.user.display_name),
    bio: c.user.bio,
    location_city: c.user.location_city,
    location_country: c.user.location_country,
    languages: c.user.languages,
    cultural_markets: c.user.cultural_markets,
    onboarding_completed: true,
  });
  if (userErr) throw userErr;

  const { error: profErr } = await supabase
    .from("creator_profiles")
    .upsert({ user_id: id, ...c.profile });
  if (profErr) throw profErr;

  // Reset posts for idempotent seed
  const { error: delErr } = await supabase
    .from("posts")
    .delete()
    .eq("user_id", id);
  if (delErr) throw delErr;

  const postRows = c.posts.map((p) => ({
    user_id: id,
    post_type: "portfolio_piece",
    ...p,
    thumbnail_url:
      (p.media_urls as string[])[0] ?? null,
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
    avatar_url: avatar(s.user.display_name),
    location_city: s.user.location_city,
    location_country: s.user.location_country,
    languages: s.user.languages,
    cultural_markets: s.user.cultural_markets,
    onboarding_completed: true,
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
  // Wipe seed reviews first (delete reviews authored by any seeded email)
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
