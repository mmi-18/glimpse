"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, Search, LayoutGrid, UserRound, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type NavUser = { id: string; display_name: string | null; avatar_url: string | null; user_type: "creator" | "startup" } | null;

const tabs = [
  { href: "/feed", label: "Feed", icon: LayoutGrid },
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/inbox", label: "Inbox", icon: Inbox },
] as const;

export function TopNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-border bg-background sticky top-0 z-30 hidden border-b backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="flex items-center gap-6">
            {tabs.map((t) => {
              const active = pathname?.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={
                  user.user_type === "creator"
                    ? `/creator/${user.id}`
                    : `/startup/${user.id}`
                }
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
              >
                <UserRound className="h-4 w-4" />
                <span>{user.display_name ?? "Profile"}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Sign in
              </Link>
              <Link href="/signup" className={buttonVariants()}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
