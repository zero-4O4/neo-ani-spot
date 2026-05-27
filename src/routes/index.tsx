import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { jikanApi } from "@/lib/jikan";
import { HeroCarousel } from "@/components/HeroCarousel";
import { AnimeRow } from "@/components/AnimeRow";
import { AdBanner } from "@/components/AdBanner";
import { ChevronRight } from "lucide-react";

const GENRES = ["Action", "Romance", "Comedy", "Fantasy", "Sci-Fi", "Slice of Life", "Sports", "Horror"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEONIME — Streaming Anime Modern" },
      { name: "description", content: "Beranda NEONIME — anime terbaru, populer, dan ongoing dalam kualitas HD." },
    ],
  }),
  component: Home,
});

function Home() {
  const airing = useQuery({ queryKey: ["airing"], queryFn: () => jikanApi.topAiring().then((r) => r.data) });
  const popular = useQuery({ queryKey: ["popular"], queryFn: () => jikanApi.topPopular().then((r) => r.data) });
  const seasonal = useQuery({ queryKey: ["seasonal"], queryFn: () => jikanApi.seasonNow().then((r) => r.data) });

  return (
    <div className="space-y-10 md:space-y-14">
      <HeroCarousel items={airing.data} />

      <div className="mx-auto max-w-7xl space-y-10 md:px-6 md:space-y-14">
        <AnimeRow title="Sedang Tayang" subtitle="Episode baru tiap minggu" items={airing.data} badge="Ongoing" />

        <AdBanner />

        <AnimeRow title="Terpopuler" subtitle="Pilihan komunitas anime dunia" items={popular.data} />

        <section className="space-y-3 px-4 md:px-0">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Jelajahi Genre</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {GENRES.map((g) => (
              <Link
                key={g}
                to="/search"
                search={{ q: g }}
                className="group relative overflow-hidden rounded-xl border border-border bg-gradient-card p-4 transition-all hover:border-primary hover:shadow-glow"
              >
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/20 blur-2xl transition-opacity group-hover:bg-primary/40" />
                <div className="relative flex items-center justify-between">
                  <span className="font-semibold">{g}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <AnimeRow title="Musim Ini" subtitle="Anime musim berjalan" items={seasonal.data} badge="Baru" />
      </div>
    </div>
  );
}
