import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Plus, Trash2, RefreshCw, Megaphone, Film, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { jikanApi, mapJikanStatus } from "@/lib/jikan";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — NEONIME" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"anime" | "ads">("anime");

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Memuat...</div>;
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman ini hanya untuk admin. Hubungi administrator untuk akses, atau jalankan SQL berikut di backend untuk menjadikan akun Anda admin:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-card p-3 text-left text-xs">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${user.id}', 'admin');`}
        </pre>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">Kelola konten anime dan iklan</p>
        </div>
      </div>

      <div className="flex gap-2">
        <TabBtn active={tab === "anime"} onClick={() => setTab("anime")} icon={Film}>Anime</TabBtn>
        <TabBtn active={tab === "ads"} onClick={() => setTab("ads")} icon={Megaphone}>Iklan</TabBtn>
      </div>

      {tab === "anime" ? <AnimeManager /> : <AdsManager />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: any; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function AnimeManager() {
  const [syncing, setSyncing] = useState(false);
  const animeList = useQuery({
    queryKey: ["admin-anime"],
    queryFn: async () => {
      const { data } = await supabase.from("anime").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const syncFromJikan = async () => {
    setSyncing(true);
    try {
      const [airing, popular] = await Promise.all([jikanApi.topAiring(), jikanApi.topPopular()]);
      const all = [...airing.data, ...popular.data];
      const rows = all.map((a) => ({
        mal_id: a.mal_id,
        title: a.title,
        title_english: a.title_english,
        synopsis: a.synopsis,
        poster_url: a.images.webp?.large_image_url || a.images.jpg.large_image_url,
        genres: a.genres.map((g) => g.name),
        status: mapJikanStatus(a.status),
        year: a.year,
        score: a.score,
        episode_count: a.episodes,
        studio: a.studios[0]?.name,
      }));
      const { error } = await supabase.from("anime").upsert(rows, { onConflict: "mal_id" });
      if (error) throw error;
      toast.success(`Berhasil sinkronisasi ${rows.length} anime dari Jikan API`);
      animeList.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal sinkronisasi");
    } finally {
      setSyncing(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus anime ini?")) return;
    const { error } = await supabase.from("anime").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Dihapus"); animeList.refetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-gradient-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Sinkronisasi Otomatis</p>
            <p className="text-xs text-muted-foreground">Ambil metadata anime dari Jikan API (MyAnimeList)</p>
          </div>
          <button onClick={syncFromJikan} disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Sinkronisasi..." : "Sync Sekarang"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Daftar Anime ({animeList.data?.length ?? 0})</div>
        <div className="divide-y divide-border">
          {animeList.data?.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              {a.poster_url && <img src={a.poster_url} alt="" className="h-14 w-10 rounded-md object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.status} · {a.year ?? "?"} · {a.episode_count ?? 0} eps</p>
              </div>
              <button onClick={() => remove(a.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {animeList.data?.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Belum ada anime. Klik "Sync Sekarang" untuk impor dari Jikan.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdsManager() {
  const ads = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<"banner" | "preroll">("banner");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const add = async () => {
    if (!name) { toast.error("Nama wajib diisi"); return; }
    const { error } = await supabase.from("ads").insert({ name, type, image_url: imageUrl || null, target_url: targetUrl || null });
    if (error) toast.error(error.message);
    else { toast.success("Iklan ditambahkan"); setName(""); setImageUrl(""); setTargetUrl(""); ads.refetch(); }
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("ads").update({ active: !active }).eq("id", id);
    ads.refetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus iklan ini?")) return;
    await supabase.from("ads").delete().eq("id", id);
    ads.refetch();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-gradient-card p-4">
        <p className="mb-3 font-semibold">Tambah Iklan Baru</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama iklan" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="banner">Banner</option>
            <option value="preroll">Pre-roll</option>
          </select>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL Gambar" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="URL Tujuan" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <button onClick={add} className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Iklan ({ads.data?.length ?? 0})</div>
        <div className="divide-y divide-border">
          {ads.data?.map((ad) => (
            <div key={ad.id} className="flex items-center gap-3 p-3">
              {ad.image_url && <img src={ad.image_url} alt="" className="h-12 w-20 rounded object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{ad.name}</p>
                <p className="text-xs text-muted-foreground">{ad.type} · {ad.active ? "Aktif" : "Nonaktif"}</p>
              </div>
              <button onClick={() => toggle(ad.id, ad.active)} className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:border-primary">
                {ad.active ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button onClick={() => remove(ad.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {ads.data?.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Belum ada iklan.</div>
          )}
        </div>
      </div>
    </div>
  );
}
