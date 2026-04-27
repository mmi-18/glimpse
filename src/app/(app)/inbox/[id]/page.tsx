import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MatchScoreBadge } from "@/components/feed/match-score-badge";
import { Avatar } from "@/components/brand/avatar";
import { ConversationComposer } from "@/components/messaging/conversation-composer";
import type { ConversationRow, MessageRow, UserRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const supabase = await createClient();
  const { data: convData } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();
  if (!convData) notFound();
  const conv = convData as ConversationRow;

  if (
    conv.participant_a !== currentUser.id &&
    conv.participant_b !== currentUser.id
  ) {
    redirect("/inbox");
  }

  const otherId =
    conv.participant_a === currentUser.id
      ? conv.participant_b
      : conv.participant_a;

  const [{ data: otherUser }, { data: msgs }] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, avatar_url, user_type")
      .eq("id", otherId)
      .single(),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!otherUser) notFound();

  // Mark incoming as read
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", id)
    .eq("receiver_id", currentUser.id)
    .eq("read", false);

  const messages = (msgs ?? []) as MessageRow[];
  const other = otherUser as Pick<UserRow, "id" | "display_name" | "avatar_url" | "user_type">;

  const profileHref =
    other.user_type === "creator"
      ? `/creator/${other.id}`
      : `/startup/${other.id}`;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-4 md:h-[calc(100vh-4rem)] md:px-6">
      <div className="border-border mb-4 flex items-center justify-between gap-3 border-b pb-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/inbox"
            aria-label="Back to inbox"
            className="text-muted-foreground hover:text-foreground inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link
            href={profileHref}
            className="flex min-w-0 items-center gap-3 hover:opacity-80"
          >
            <Avatar
              src={other.avatar_url}
              name={other.display_name}
              size={36}
            />
            <span className="text-foreground truncate font-medium">
              {other.display_name}
            </span>
          </Link>
        </div>
        {conv.match_score != null && (
          <MatchScoreBadge
            score={conv.match_score}
            size="md"
            className="shrink-0"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            No messages yet.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const mine = m.sender_id === currentUser.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-border border-t pt-4">
        <ConversationComposer
          conversationId={id}
          recipientId={otherId}
          matchScore={conv.match_score}
        />
      </div>
    </div>
  );
}
