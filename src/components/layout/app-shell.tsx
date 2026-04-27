import { getCurrentUser } from "@/lib/auth";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <TopNav
        user={
          user
            ? {
                id: user.id,
                display_name: user.display_name,
                avatar_url: user.avatar_url,
                user_type: user.user_type,
                membership_tier: user.membership_tier,
              }
            : null
        }
      />
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <BottomNav
        userId={user?.id ?? null}
        userType={user?.user_type ?? null}
      />
    </>
  );
}
