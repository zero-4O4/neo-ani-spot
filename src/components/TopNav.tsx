import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, User, Shield, Flame } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function TopNav() {
  const { pathname } = useLocation();
  const { isAdmin, user } = useAuth();

  const items = [
    { to: "/", label: "Beranda", icon: Home },
    { to: "/search", label: "Cari", icon: Search },
    { to: "/profile", label: "Profil", icon: User },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 hidden border-b border-border/60 bg-background/70 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">NEONIME</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        {!user && (
          <Link to="/login" className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105">
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
