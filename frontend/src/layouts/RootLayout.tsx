import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
