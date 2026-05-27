// Jikan API (MyAnimeList unofficial) - free, no key required
// https://docs.api.jikan.moe/

const BASE = "https://api.jikan.moe/v4";

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  images: {
    jpg: { large_image_url: string; image_url: string };
    webp: { large_image_url: string; image_url: string };
  };
  trailer?: { youtube_id?: string | null; url?: string | null; embed_url?: string | null };
  genres: { name: string }[];
  status: string;
  year: number | null;
  score: number | null;
  episodes: number | null;
  studios: { name: string }[];
  aired?: { from: string | null };
}

async function jikan<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export const jikanApi = {
  topAiring: () => jikan<{ data: JikanAnime[] }>("/top/anime?filter=airing&limit=12"),
  topPopular: () => jikan<{ data: JikanAnime[] }>("/top/anime?filter=bypopularity&limit=20"),
  seasonNow: () => jikan<{ data: JikanAnime[] }>("/seasons/now?limit=20"),
  search: (q: string, params?: { genres?: string; status?: string; year?: string }) => {
    const sp = new URLSearchParams({ q, limit: "24", sfw: "true" });
    if (params?.genres) sp.set("genres", params.genres);
    if (params?.status) sp.set("status", params.status);
    if (params?.year) sp.set("start_date", `${params.year}-01-01`);
    return jikan<{ data: JikanAnime[] }>(`/anime?${sp.toString()}`);
  },
  byId: (id: number | string) => jikan<{ data: JikanAnime }>(`/anime/${id}/full`),
  genres: () => jikan<{ data: { mal_id: number; name: string }[] }>("/genres/anime"),
};

export function mapJikanStatus(s: string): "ongoing" | "completed" | "upcoming" {
  const x = s.toLowerCase();
  if (x.includes("airing")) return "ongoing";
  if (x.includes("not yet")) return "upcoming";
  return "completed";
}
