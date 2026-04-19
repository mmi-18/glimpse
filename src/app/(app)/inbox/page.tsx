import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MatchScoreBadge } from "@/components/feed/match-score-badge";
import type { ConversationRow, MessageRow, UserRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const supabase = await createClient();

  const { data: convs } = await supabase
    .from("conversations")
    .select("*")
    .or(`participant_a.eq.${currentUser.id},participant_b.eq.${currentUser.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const conversations = (convs ?? []) as ConversationRow[];

  // Fetch other participants + last message per conversation
  const otherIds = conversations.map((c) =>
    c.participant_a === currentUser.id ? c.participant_b : c.participant_a,
  );

  const [{ data: users }, { data: lastMsgs }, { data: unreadRows }] =
    await Promise.all([
      otherIds.length > 0
        ? supabase
            .from("users")
            .select("id, display_name, avatar_url, user_type")
            .in("id", otherIds)
        : Promise.resolve({ data: [] as UserRow[] }),
      conversations.length > 0
        ? supabase
            .from("messages")
            .select("*")
            .in(
              "conversation_id",
              conversations.map((c) => c.id),
            )
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as MessageRow[] }),
      supabase
        .from("messages")
        .select("conversation_id")
        .eq("receiver_id", currentUser.id)
        .eq("read", false),
    ]);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));
  const lastByConv = new Map<string, MessageRow>();
  for (const m of (lastMsgs ?? []) as MessageRow[]) {
    if (m.conversation_id && !lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, m);
    }
  }
  const unreadByConv = new Map<string, number>();
  for (const r of (unreadRows ?? []) as { conversation_id: string | null }[]) {
    if (!r.conversation_id) continue;
    unreadByConv.set(
      r.conversation_id,
      (unreadByConv.get(r.conversation_id) ?? 0) + 1,
    );
  }

  // Sort by match score (primary), then recency
  conversations.sort((a, b) => {
    const aScore = a.match_score ?? -1;
    const bScore = b.match_score ?? -1;
    if (aScore !== bScore) return bScore - aScore;
    return (
      new Date(b.last_message_at ?? b.created_at).getTime() -
      new Date(a.last_message_at ?? a.created_at).getTime()
    );
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-medium tracking-tight">Inbox</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Sorted by match score — your highest-fit conversations are on top.
      </p>

      <div className="mt-8 space-y-2">
        {conversations.length === 0 ? (
          <div className="border-border rounded-2xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground text-sm">
              No conversations yet — open a post or creator profile to reach
              out.
            </p>
          </div>
        ) : (
          conversations.map((c) => {
            const otherId =
              c.participant_a === currentUser.id
                ? c.participant_b
                : c.participant_a;
            const other = userMap.get(otherId);
            const last = lastByConv.get(c.id);
            const unread = unreadByConv.get(c.id) ?? 0;
            const isSender = last?.sender_id === currentUser.id;
            const highMatch = (c.match_score ?? 0) >= 0.8;

            return (
              <Link
                key={c.id}
                href={`/inbox/${c.id}`}
                className={cn(
                  "border-border bg-card flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-foreground/20",
                  highMatch && "ring-1 ring-foreground/10",
                )}
              >
                {other?.avatar_url && (
                  <Image
                    src={other.avatar_url}
                    alt={other.display_name ?? ""}
                    width={44}
                    height={44}
                    className="rounded-full border border-border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{other?.display_name}</p>
                    <span className="text-muted-foreground text-xs">
                      {last
                        ? new Date(last.created_at).toLocaleDateString()
                        : new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {last
                      ? `${isSender ? "You: " : ""}${last.content}`
                      : "No messages yet"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {c.match_score != null && (
                    <MatchScoreBadge score={c.match_score} size="sm" />
                  )}
                  {unread > 0 && (
                    <span className="bg-foreground text-background rounded-full px-2 py-0.5 text-[10px] font-medium">
                      {unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
