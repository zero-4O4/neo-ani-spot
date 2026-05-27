import { Link } from "@tanstack/react-router";
import { Star, Play } from "lucide-react";

interface Props {
  malId: number;
  title: string;
  image: string;
  score?: number | null;
  episodes?: number | null;
  badge?: string;
}

export function AnimeCard({ malId, title, image, score, episodes, badge }: Props) {
  return (
    <Link
      to="/anime/$id"
      params={{ id: String(malId) }}
      className="group relative block w-[140px] flex-shrink-0 sm:w-[170px] md:w-[190px]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-card shadow-card">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-80" />

        {badge && (
          <span className="absolute left-2 top-2 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-glow">
            {badge}
          </span>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
            <Play className="h-5 w-5 fill-current text-primary-foreground" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <div className="mb-1 flex items-center gap-2 text-[11px]">
            {score && (
              <span className="flex items-center gap-0.5 text-accent">
                <Star className="h-3 w-3 fill-current" /> {score.toFixed(1)}
              </span>
            )}
            {episodes && <span className="text-muted-foreground">EP {episodes}</span>}
          </div>
        </div>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
        {title}
      </h3>
    </Link>
  );
}
