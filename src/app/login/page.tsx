"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Image
            src="/images/glimpse-logo.jpeg"
            alt="glimpse."
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="brand-wordmark text-xl">glimpse.</span>
        </Link>

        <h1 className="mb-2 text-2xl font-medium">Welcome back</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Sign in to your glimpse. account.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>

        <div className="border-border mt-8 rounded-xl border p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Try a seed account</p>
          <p>Email: <span className="font-mono">kiri@seed.glimpse.app</span></p>
          <p>Password: <span className="font-mono">glimpse-seed-2026</span></p>
        </div>
      </div>
    </div>
  );
}
