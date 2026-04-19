"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(args: {
  recipientId: string;
  content: string;
  matchScore: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [a, b] = [user.id, args.recipientId].sort();

  // Ensure conversation exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        participant_a: a,
        participant_b: b,
        match_score: args.matchScore,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    conversationId = created.id;
  } else {
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  const { error: msgErr } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    receiver_id: args.recipientId,
    content: args.content,
    match_score: args.matchScore,
  });
  if (msgErr) throw msgErr;

  revalidatePath("/inbox");
  return { conversationId };
}
