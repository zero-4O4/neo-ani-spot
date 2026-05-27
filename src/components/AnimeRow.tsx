import type { ReactNode } from "react";
import { AnimeCard } from "./AnimeCard";
import type { JikanAnime } from "@/lib/jikan";

interface Props {
  title: string;
  subtitle?: string;
  items: JikanAnime[] | undefined;
  badge?: string;
  action?: ReactNode;
}

export function AnimeRow({ title, subtitle, items, badge, action }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between px-4 md:px-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:gap-4 md:px-0">
        {!items
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[140px] flex-shrink-0 sm:w-[170px] md:w-[190px]">
                <div className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
              </div>
            ))
          : items.map((a) => (
              <AnimeCard
                key={a.mal_id}
                malId={a.mal_id}
                title={a.title_english || a.title}
                image={a.images.webp?.large_image_url || a.images.jpg.large_image_url}
                score={a.score}
                episodes={a.episodes}
                badge={badge}
              />
            ))}
      </div>
    </section>
  );
}
