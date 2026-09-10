import { Link } from "@tanstack/react-router";
import { Clapperboard, Heart, LogOut, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, signedIn } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Clapperboard className="size-6 text-primary" aria-hidden />
          <span className="text-display text-2xl leading-none text-foreground">Cineframe</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/wishlist">
              <Heart className="size-4" aria-hidden />
              <span className="hidden sm:inline">Wishlist</span>
            </Link>
          </Button>

          {signedIn ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void supabase.auth.signOut();
              }}
              title={user?.email ?? undefined}
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">
                <UserIcon className="size-4" aria-hidden />
                <span>Sign in</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
