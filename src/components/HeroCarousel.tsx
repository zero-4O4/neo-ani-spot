import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info, Star } from "lucide-react";
import type { JikanAnime } from "@/lib/jikan";

interface Props { items: JikanAnime[] | undefined }

export function HeroCarousel({ items }: Props) {
  const [idx, setIdx] = useState(0);
  const slides = items?.slice(0, 5) ?? [];

  useEffect(() => {
    if (slides.length === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!items) {
    return <div className="aspect-[16/10] w-full animate-pulse bg-muted md:aspect-[21/9]" />;
  }

  const current = slides[idx];
  if (!current) return null;

  const image = current.images.webp?.large_image_url || current.images.jpg.large_image_url;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden md:aspect-[21/9]">
      <img
        key={current.mal_id}
        src={image}
        alt={current.title}
        className="absolute inset-0 h-full w-full object-cover animate-in fade-in duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-8 md:max-w-2xl md:justify-center md:px-12 md:pb-0">
        <span className="mb-2 inline-block w-fit rounded-md bg-primary/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          Unggulan
        </span>
        <h1 className="line-clamp-2 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          {current.title_english || current.title}
        </h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          {current.score && (
            <span className="flex items-center gap-1 text-accent">
              <Star className="h-4 w-4 fill-current" /> {current.score.toFixed(1)}
            </span>
          )}
          {current.year && <span>{current.year}</span>}
          {current.genres.slice(0, 2).map((g) => (
            <span key={g.name}>{g.name}</span>
          ))}
        </div>
        <p className="mt-3 line-clamp-2 max-w-xl text-sm text-muted-foreground md:line-clamp-3 md:text-base">
          {current.synopsis}
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            to="/anime/$id"
            params={{ id: String(current.mal_id) }}
            className="flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
          >
            <Play className="h-4 w-4 fill-current" /> Tonton
          </Link>
          <Link
            to="/anime/$id"
            params={{ id: String(current.mal_id) }}
            className="flex items-center gap-2 rounded-lg bg-card/80 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-card"
          >
            <Info className="h-4 w-4" /> Detail
          </Link>
        </div>

        <div className="mt-5 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1 rounded-full transition-all ${i === idx ? "w-8 bg-primary shadow-glow" : "w-4 bg-muted"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
