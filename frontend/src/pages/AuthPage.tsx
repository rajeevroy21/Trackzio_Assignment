import { useEffect, useState } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function AuthPage() {
  const navigate = useNavigate();
  const { signedIn } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (signedIn) {
      navigate("/");
    }
  }, [signedIn, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        // Supabase can require email confirmation.
        if (!data.session) {
          toast.success(
            "Account created! Please check your email to confirm your account.",
          );
          setMode("signin");
          return;
        }

        toast.success("Account created successfully!");
        navigate("/");
        return;
      }

      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.session) {
        toast.error("Unable to create a session. Please try again.");
        return;
      }

      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14">
      <div className="surface-panel rounded-2xl p-6 sm:p-8">
        <Clapperboard className="size-8 text-primary" aria-hidden />

        <h1 className="mt-4 text-3xl text-foreground">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your email and password to access your personal
          wishlist.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="user@example.com"
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
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              placeholder="••••••••"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && (
              <Loader2
                className="size-4 animate-spin"
                aria-hidden
              />
            )}

            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-muted-foreground underline hover:text-foreground"
          onClick={() =>
            setMode(mode === "signin" ? "signup" : "signin")
          }
        >
          {mode === "signin"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>

      <Link
        to="/"
        className="mt-6 text-center text-sm text-muted-foreground underline hover:text-foreground"
      >
        Keep browsing without an account
      </Link>
    </div>
  );
}