import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  preRollSeconds?: number;
}

const SAMPLE_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export function VideoPlayer({ src, poster, preRollSeconds = 5 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [adCountdown, setAdCountdown] = useState(preRollSeconds);
  const [adActive, setAdActive] = useState(true);

  const finalSrc = src || SAMPLE_HLS;

  useEffect(() => {
    if (!adActive) return;
    if (adCountdown <= 0) return;
    const t = setTimeout(() => setAdCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [adCountdown, adActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || adActive) return;

    if (finalSrc.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(finalSrc);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else {
      video.src = finalSrc;
    }
  }, [finalSrc, adActive]);

  const skipAd = () => setAdActive(false);
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
    setPlaying(!v.paused);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black md:rounded-xl">
      {adActive ? (
        <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/10">
          <div className="text-center">
            <span className="mb-2 inline-block rounded bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Iklan
            </span>
            <p className="text-2xl font-bold text-gradient">NEONIME PREMIUM</p>
            <p className="mt-2 text-sm text-muted-foreground">Streaming tanpa iklan, kualitas 4K</p>
          </div>
          <button
            onClick={skipAd}
            disabled={adCountdown > 0}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-background/90 px-4 py-2 text-sm font-semibold backdrop-blur disabled:opacity-60"
          >
            {adCountdown > 0 ? `Lewati dalam ${adCountdown}s` : (<><SkipForward className="h-4 w-4" /> Lewati Iklan</>)}
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            poster={poster}
            controls
            playsInline
            className="h-full w-full bg-black"
          />
          {/* Optional custom overlay controls hidden when native controls used */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="pointer-events-auto flex items-center gap-3 text-white">
              <button onClick={togglePlay}>{playing ? <Pause /> : <Play />}</button>
              <button onClick={() => setMuted((m) => !m)}>{muted ? <VolumeX /> : <Volume2 />}</button>
              <button className="ml-auto" onClick={() => videoRef.current?.requestFullscreen()}>
                <Maximize />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
