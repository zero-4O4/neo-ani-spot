import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Settings, Heart, History, Bell, MonitorPlay, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profil — NEONIME" }] }),
  component: Profile,
});

function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"watchlist" | "history" | "settings">("watchlist");
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [quality, setQuality] = useState("auto");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const watchlist = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("watchlist")
        .select("id, created_at, anime:anime_id (id, title, poster_url, mal_id)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const history = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("watch_history")
        .select("id, watched_at, progress_seconds, anime:anime_id (id, title, poster_url, mal_id)")
        .eq("user_id", user!.id)
        .order("watched_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  if (loading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Memuat...</p></div>;
  }

  const displayName = profile.data?.display_name || user.email?.split("@")[0] || "Pengguna";
  const avatar = profile.data?.avatar_url || user.user_metadata?.avatar_url;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-6 md:py-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-primary shadow-glow">
            {avatar ? (
              <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted"><UserIcon className="h-10 w-10" /></div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={async () => { await signOut(); toast.success("Berhasil keluar"); navigate({ to: "/" }); }}
            className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: "watchlist" as const, label: "Favorit", icon: Heart },
          { id: "history" as const, label: "Riwayat", icon: History },
          { id: "settings" as const, label: "Pengaturan", icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "watchlist" && (
        <div>
          {watchlist.data && watchlist.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {watchlist.data.map((w: any) => (
                <Link key={w.id} to="/anime/$id" params={{ id: String(w.anime.mal_id) }} className="group">
                  <div className="aspect-[2/3] overflow-hidden rounded-xl">
                    <img src={w.anime.poster_url} alt={w.anime.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium">{w.anime.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Heart} text="Belum ada anime favorit. Tambahkan dari halaman detail anime." />
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          {history.data && history.data.length > 0 ? (
            <div className="space-y-2">
              {history.data.map((h: any) => (
                <Link key={h.id} to="/anime/$id" params={{ id: String(h.anime.mal_id) }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary">
                  <img src={h.anime.poster_url} alt={h.anime.title} className="h-16 w-12 rounded-md object-cover" />
                  <div className="flex-1">
                    <p className="font-medium">{h.anime.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.watched_at).toLocaleDateString("id-ID")}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={History} text="Belum ada riwayat tontonan." />
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-3">
          <SettingRow icon={Bell} title="Notifikasi" desc="Dapatkan pemberitahuan episode baru">
            <Switch checked={notifications} onChange={setNotifications} />
          </SettingRow>
          <SettingRow icon={MonitorPlay} title="Putar Otomatis" desc="Lanjutkan ke episode berikutnya">
            <Switch checked={autoplay} onChange={setAutoplay} />
          </SettingRow>
          <SettingRow icon={Settings} title="Kualitas Video" desc="Pilih resolusi default pemutar">
            <select value={quality} onChange={(e) => setQuality(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </SettingRow>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-16 text-center">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function SettingRow({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/15 p-2 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-gradient-primary shadow-glow" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
