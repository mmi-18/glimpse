import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/app/(app)/new-post/post-editor";
import type { CreatorProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.user_type !== "creator") {
    redirect("/brief");
  }

  // Pull the creator's profile so the editor can default industry + content
  // type from the user's baseline. User can override inline.
  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const profile = (profileData as CreatorProfile | null) ?? null;

  const defaultIndustry = profile?.industry_experience?.[0] ?? "";
  const defaultContentType = profile?.deliverable_types?.[0] ?? "photo_series";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/feed"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-medium tracking-tight">New post</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add pictures and text, arrange them however you want. Drag the
          corner handle to resize — snap to 1×1, 2×1, 1×2, or 2×2.
        </p>
      </header>

      <PostEditor
        defaultIndustry={defaultIndustry}
        defaultContentType={defaultContentType}
      />
    </div>
  );
}
