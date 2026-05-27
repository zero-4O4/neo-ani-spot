import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Search as SearchIcon, Filter } from "lucide-react";
import { jikanApi } from "@/lib/jikan";
import { AnimeCard } from "@/components/AnimeCard";

const GENRES: Record<string, string> = {
  "1": "Action", "2": "Adventure", "4": "Comedy", "8": "Drama", "10": "Fantasy",
  "22": "Romance", "24": "Sci-Fi", "27": "Shounen", "36": "Slice of Life", "37": "Supernatural",
};

const STATUSES = [
  { value: "", label: "Semua" },
  { value: "airing", label: "Ongoing" },
  { value: "complete", label: "Completed" },
  { value: "upcoming", label: "Upcoming" },
];

const YEARS = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) || "" }),
  head: () => ({ meta: [{ title: "Cari Anime — NEONIME" }] }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q);
  const [debounced, setDebounced] = useState(q);
  const [genre, setGenre] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => { setQ(search.q); }, [search.q]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debounced, genre, status, year],
    queryFn: () => jikanApi.search(debounced || "", { genres: genre, status, year }).then((r) => r.data),
    enabled: !!(debounced || genre || status || year),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Cari Anime</h1>
        <p className="mt-1 text-sm text-muted-foreground">Temukan judul favorit dengan filter genre, status, dan tahun.</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari judul anime..."
          className="w-full rounded-xl border border-border bg-card pl-12 pr-4 py-3.5 text-base outline-none focus:border-primary focus:shadow-glow"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" /> Filter:
        </div>
        <select value={genre} onChange={(e) => setGenre(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">Semua Genre</option>
          {Object.entries(GENRES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">Semua Tahun</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.map((a) => (
            <div key={a.mal_id} className="w-full">
              <AnimeCard
                malId={a.mal_id}
                title={a.title_english || a.title}
                image={a.images.webp?.large_image_url || a.images.jpg.large_image_url}
                score={a.score}
                episodes={a.episodes}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-muted-foreground">
            {debounced || genre || status || year ? "Tidak ada hasil." : "Mulai mengetik untuk mencari anime."}
          </p>
        </div>
      )}
    </div>
  );
}
