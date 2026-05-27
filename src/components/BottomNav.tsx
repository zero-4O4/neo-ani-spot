import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, User, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();

  const items = [
    { to: "/", label: "Beranda", icon: Home },
    { to: "/search", label: "Cari", icon: Search },
    { to: "/profile", label: "Profil", icon: User },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110 drop-shadow-[0_0_8px_var(--primary)]")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
