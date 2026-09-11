import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { useAuth } from "@/frontend/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Cineframe" },
      { name: "description", content: "Sign in to Cineframe to keep your movie wishlist across all your devices." },
      { property: "og:title", content: "Sign in — Cineframe" },
      { property: "og:description", content: "Keep your movie wishlist across all your devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { signedIn } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  useEffect(() => {
    if (signedIn) void navigate({ to: "/wishlist" });
  }, [signedIn, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setSentConfirmation(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/wishlist" });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14">
      <div className="surface-panel rounded-2xl p-6 sm:p-8">
        <Clapperboard className="size-8 text-primary" aria-hidden />
        <h1 className="mt-4 text-3xl text-foreground">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your wishlist is saved to your account, so it's there on every device.
        </p>

        {sentConfirmation ? (
          <div className="mt-6 rounded-xl border border-border bg-secondary/60 p-4 text-sm text-foreground">
            Check your inbox — we sent a confirmation link to <strong>{email}</strong>. Once you confirm, come
            back and sign in.
          </div>
        ) : (
          <>
            <Button variant="outline" className="mt-6 w-full" onClick={() => void google()} disabled={busy}>
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <button
              type="button"
              className="mt-4 w-full text-sm text-muted-foreground underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </div>

      <Link to="/" className="mt-6 text-center text-sm text-muted-foreground underline">
        Keep browsing without an account
      </Link>
    </div>
  );
}
