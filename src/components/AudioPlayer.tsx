"use client";

// Minimal audio player: large play/pause button + scrubber + duration.
// The audio source is hot-linked from Wikimedia Commons. We never expose
// the work title or composer name here — that's the whole quiz.

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  // Approximate total duration in seconds, if the cache knows it. Used as
  // a fallback before the audio element's own metadata loads.
  hintedDurationSeconds: number | null;
}

export default function AudioPlayer({ src, hintedDurationSeconds }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(
    hintedDurationSeconds && hintedDurationSeconds > 0 ? hintedDurationSeconds : null
  );
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset all state when the source changes (i.e. moving to the next question).
  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(
      hintedDurationSeconds && hintedDurationSeconds > 0 ? hintedDurationSeconds : null
    );
    setLoaded(false);
    setError(false);
  }, [src, hintedDurationSeconds]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => {
      setLoaded(true);
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration);
      }
    };
    const onEnd = () => setPlaying(false);
    const onErr = () => setError(true);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onErr);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onErr);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a || error) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(
        () => setPlaying(true),
        () => setError(true)
      );
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    a.currentTime = ratio * duration;
    setCurrentTime(a.currentTime);
  }

  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />

      <button
        type="button"
        className="audio-play-btn"
        onClick={toggle}
        disabled={error}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-md">
        <div className="audio-scrubber" onClick={seek}>
          <div className="audio-scrubber-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-ink-muted font-medium">
          <span>{formatTime(currentTime)}</span>
          <span>
            {duration ? formatTime(duration) : loaded ? "—" : "loading…"}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-wrong italic">
          Audio couldn't load. (The Commons link may have moved.)
        </p>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
