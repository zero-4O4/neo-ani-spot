import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Calendar, Play, Plus, Check, Lock, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { jikanApi } from "@/lib/jikan";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AdBanner } from "@/components/AdBanner";

export const Route = createFileRoute("/anime/$id")({
  component: AnimeDetail,
});

function AnimeDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => jikanApi.byId(id).then((r) => r.data),
  });

  const watchlist = useQuery({
    queryKey: ["wl-check", user?.id, id],
    queryFn: async () => {
      // Find or create matching anime row, then check watchlist
      const { data: a } = await supabase.from("anime").select("id").eq("mal_id", Number(id)).maybeSingle();
      if (!a) return { animeId: null, inList: false };
      const { data: w } = await supabase.from("watchlist").select("id").eq("user_id", user!.id).eq("anime_id", a.id).maybeSingle();
      return { animeId: a.id, inList: !!w };
    },
    enabled: !!user,
  });

  const ensureAnimeInDb = async () => {
    if (!data) throw new Error("no anime data");
    const { data: existing } = await supabase.from("anime").select("id").eq("mal_id", data.mal_id).maybeSingle();
    if (existing) return existing.id;
    const { data: inserted, error } = await supabase
      .from("anime")
      .insert({
        mal_id: data.mal_id,
        title: data.title,
        title_english: data.title_english,
        synopsis: data.synopsis,
        poster_url: data.images.webp?.large_image_url || data.images.jpg.large_image_url,
        genres: data.genres.map((g) => g.name),
        status: data.status.toLowerCase().includes("airing") ? "ongoing" : data.status.toLowerCase().includes("not yet") ? "upcoming" : "completed",
        year: data.year,
        score: data.score,
        episode_count: data.episodes,
        studio: data.studios[0]?.name,
      })
      .select("id")
      .single();
    if (error) throw error;
    return inserted.id;
  };

  const toggleWatchlist = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    try {
      const animeId = watchlist.data?.animeId || (await ensureAnimeInDb());
      if (watchlist.data?.inList) {
        await supabase.from("watchlist").delete().eq("user_id", user.id).eq("anime_id", animeId);
        toast.success("Dihapus dari favorit");
      } else {
        await supabase.from("watchlist").insert({ user_id: user.id, anime_id: animeId });
        toast.success("Ditambahkan ke favorit");
      }
      watchlist.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui favorit");
    }
  };

  const handlePlay = async () => {
    if (!user) { toast.info("Silakan masuk untuk menonton"); navigate({ to: "/login" }); return; }
    setPlaying(true);
    try {
      const animeId = await ensureAnimeInDb();
      await supabase.from("watch_history").upsert(
        { user_id: user.id, anime_id: animeId, progress_seconds: 0 },
        { onConflict: "user_id,episode_id" }
      );
    } catch (e) { /* ignore */ }
  };

  if (isLoading || !data) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Memuat...</div>;
  }

  const image = data.images.webp?.large_image_url || data.images.jpg.large_image_url;
  const totalEpisodes = data.episodes || 12;
  const episodes = Array.from({ length: Math.min(totalEpisodes, 24) }, (_, i) => i + 1);

  return (
    <article>
      {/* Banner */}
      <div className="relative">
        {playing ? (
          <div className="mx-auto max-w-6xl bg-black md:p-4">
            <VideoPlayer src="" poster={image} preRollSeconds={5} />
            <div className="px-4 py-3 md:px-0">
              <p className="text-sm text-muted-foreground">Episode {activeEpisode}</p>
              <h2 className="text-lg font-bold">{data.title_english || data.title}</h2>
            </div>
          </div>
        ) : (
          <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden md:h-[60vh]">
            <img src={image} alt={data.title} className="absolute inset-0 h-full w-full object-cover blur-sm opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
            <button
              onClick={() => navigate({ to: "/" })}
              className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-lg bg-background/70 px-3 py-1.5 text-sm backdrop-blur"
            >
              <ChevronLeft className="h-4 w-4" /> Kembali
            </button>
            <div className="relative z-10 flex h-full items-end justify-center pb-8 md:items-center md:pb-0">
              <div className="grid w-full max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-[200px,1fr] md:gap-8 md:px-6">
                <img src={image} alt={data.title} className="mx-auto hidden h-auto w-48 rounded-xl shadow-card md:block" />
                <div>
                  <h1 className="text-3xl font-bold leading-tight md:text-5xl">{data.title_english || data.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {data.score && <span className="flex items-center gap-1 text-accent"><Star className="h-4 w-4 fill-current" />{data.score.toFixed(1)}</span>}
                    {data.year && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{data.year}</span>}
                    {data.episodes && <span>{data.episodes} Episode</span>}
                    <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">{data.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.genres.map((g) => (
                      <span key={g.name} className="rounded-full border border-border bg-card px-3 py-1 text-xs">{g.name}</span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={handlePlay} className="flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105">
                      {user ? <Play className="h-5 w-5 fill-current" /> : <Lock className="h-5 w-5" />}
                      {user ? "Tonton Sekarang" : "Masuk untuk Tonton"}
                    </button>
                    <button onClick={toggleWatchlist} className="flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 font-medium hover:border-primary">
                      {watchlist.data?.inList ? <><Check className="h-4 w-4 text-primary" /> Difavoritkan</> : <><Plus className="h-4 w-4" /> Tambah Favorit</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-6">
        <section>
          <h2 className="text-xl font-bold">Sinopsis</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
            {data.synopsis || "Tidak ada sinopsis tersedia."}
          </p>
        </section>

        <AdBanner />

        <section>
          <h2 className="text-xl font-bold">Episode</h2>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {episodes.map((n) => (
              <button
                key={n}
                onClick={() => { setActiveEpisode(n); handlePlay(); }}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                  activeEpisode === n && playing
                    ? "border-primary bg-primary/15 text-primary shadow-glow"
                    : "border-border bg-card hover:border-primary hover:text-primary"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {!user && (
            <p className="mt-3 text-xs text-muted-foreground">
              <Lock className="mr-1 inline h-3 w-3" />
              <Link to="/login" className="text-primary hover:underline">Masuk</Link> untuk menonton episode.
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
