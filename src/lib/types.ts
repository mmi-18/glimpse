export type UserType = "creator" | "startup";
export type MembershipTier = "free" | "pro";

export type UserRow = {
  id: string;
  email: string;
  user_type: UserType;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location_city: string | null;
  location_country: string | null;
  languages: string[] | null;
  cultural_markets: string[] | null;
  onboarding_completed: boolean;
  membership_tier: MembershipTier;
  created_at: string;
};

export type BriefRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  reference_image_urls: string[] | null;
  active: boolean;
  created_at: string;
};

export type StyleVector = {
  style_production_value: number | null;
  style_pacing: number | null;
  style_focus: number | null;
  style_framing: number | null;
  style_staging: number | null;
  style_color: number | null;
  style_sound: number | null;
};

export type CreatorProfile = StyleVector & {
  user_id: string;
  discipline: "video" | "photo" | "both" | null;
  content_categories: string[] | null;
  content_style_tags: string[] | null;
  deliverable_types: string[] | null;
  rate_min: number | null;
  rate_max: number | null;
  availability: string | null;
  portfolio_urls: string[] | null;
  sub_specializations: string[] | null;
  industry_experience: string[] | null;
  minimum_acceptable_budget: number | null;
  typical_turnaround: string | null;
  travel_willingness: string | null;
  preferred_project_types: string[] | null;
  unwanted_work_types: string[] | null;
  usage_licensing_preference: string | null;
  production_capabilities: string[] | null;
  social_handles: Record<string, string> | null;
  creative_discipline: string | null;
  equipment: string[] | null;
  audience_size: number | null;
  past_brand_collaborations: string | null;
  creative_philosophy: string | null;
  inspiration_creators: string[] | null;
  showreel_url: string | null;
  avg_rating: number | null;
  review_count: number;
  portfolio_layout: unknown | null;
  about_layout: unknown | null;
};

export type StartupProfile = StyleVector & {
  user_id: string;
  company_name: string | null;
  industry: string | null;
  location_market: string[] | null;
  contact_person: string | null;
  contact_role: string | null;
  contact_email: string | null;
  typical_budget_range_min: number | null;
  typical_budget_range_max: number | null;
  project_goal: string[] | null;
  desired_look_feeling: string[] | null;
  deliverables_needed: string[] | null;
  quantity_volume: number | null;
  deadline: string | null;
  budget_for_project: number | null;
  content_usage_platforms: string[] | null;
  company_stage: string | null;
  website_url: string | null;
  company_description: string | null;
  content_categories_hired: string[] | null;
  brand_look_guidelines: string | null;
  language: string[] | null;
  target_audience: string[] | null;
  qualities_in_creator: string[] | null;
  content_communication_goal: string[] | null;
  success_criteria: string | null;
  usage_rights_scope: string | null;
  location_production_constraints: string[] | null;
  equipment_needed: string[] | null;
  brand_values: string[] | null;
  past_creator_collaborations: string | null;
  typical_timeline_pattern: string | null;
  brand_guidelines_url: string | null;
  reference_content_urls: string[] | null;
  brand_description: string | null;
};

export type PostRow = StyleVector & {
  id: string;
  user_id: string;
  post_type: "portfolio_piece" | "job_listing";
  title: string | null;
  description: string | null;
  media_urls: string[] | null;
  thumbnail_url: string | null;
  content_type: string | null;
  industry: string | null;
  format: "vertical" | "horizontal" | "square" | null;
  duration_seconds: number | null;
  equipment_used: string[] | null;
  likes_count: number;
  views_count: number;
  created_at: string;
  /** User-arranged grid layout. When null, default layout is computed. */
  cell_layout: unknown | null;
  /** Mini-mosaic that renders inside the uniform feed tile. */
  preview_layout: unknown | null;
};

export type ConversationRow = {
  id: string;
  participant_a: string;
  participant_b: string;
  match_score: number | null;
  last_message_at: string | null;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  match_score: number | null;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  project_description: string | null;
  rating_overall: number | null;
  rating_reliability: number | null;
  rating_quality: number | null;
  rating_collaboration: number | null;
  review_text: string | null;
  created_at: string;
};

export type IndustrySimilarityRow = {
  industry_a: string;
  industry_b: string;
  similarity_score: number;
};
