import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Ad { id: string; name: string; image_url: string | null; target_url: string | null }

export function AdBanner() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    supabase.from("ads").select("id,name,image_url,target_url")
      .eq("type", "banner").eq("active", true).limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAd(data[Math.floor(Math.random() * data.length)]);
        }
      });
  }, []);

  if (!ad || closed) {
    // Placeholder house ad
    return (
      <div className="relative mx-4 my-6 overflow-hidden rounded-xl border border-border bg-gradient-card p-4 md:mx-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor</span>
            <p className="mt-1 text-sm font-semibold">Nikmati pengalaman streaming tanpa gangguan</p>
          </div>
          <span className="rounded-md bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary">Iklan</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-4 my-6 overflow-hidden rounded-xl border border-border md:mx-0">
      <a href={ad.target_url ?? "#"} target="_blank" rel="noopener noreferrer">
        {ad.image_url && <img src={ad.image_url} alt={ad.name} className="w-full" />}
      </a>
      <button
        onClick={() => setClosed(true)}
        className="absolute right-2 top-2 rounded-full bg-background/80 p-1 backdrop-blur"
        aria-label="Tutup iklan"
      >
        <X className="h-3 w-3" />
      </button>
      <span className="absolute left-2 top-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground backdrop-blur">Iklan</span>
    </div>
  );
}
