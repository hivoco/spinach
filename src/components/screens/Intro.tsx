"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { asset } from "@/lib/assets";
import { TopBar } from "@/components/ui";

const ICON_HIDE_MS = 2500;

export function Intro({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [missing, setMissing] = useState(false);
  const [showIcon, setShowIcon] = useState(false);

  // An icon brought back by a tap fades away again if it isn't used.
  useEffect(() => {
    if (!showIcon) return;
    const t = setTimeout(() => setShowIcon(false), ICON_HIDE_MS);
    return () => clearTimeout(t);
  }, [showIcon]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); // interrupted or blocked plays reject too; a broken file is caught by onError
    else v.pause();
  };

  const seek = (fraction: number) => {
    const v = ref.current;
    if (v?.duration) v.currentTime = fraction * v.duration;
  };

  return (
    <>
      <TopBar lowLogo />
      {/* Phone layout: 425px is the 670px-tall player at the video's 9:16 (377px) plus its gutters. Any wider, on tablets and short
          phones, and object-cover would zoom in and cut off the top and bottom of the video. */}
      <section className="mx-auto flex w-full max-w-[425px] flex-1 flex-col px-6 pt-10 lg:max-w-[960px] lg:justify-center lg:px-0 lg:pt-0 lg:pb-[38px]">
        <div className="flex h-[35px] items-center justify-between lg:mb-3.5 lg:h-auto">
          <h1 className="font-display text-[11px] font-bold tracking-[2.5px] text-teal uppercase lg:text-xs lg:tracking-[1.6px]">Introductory video</h1>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border-[1.5px] border-ink-2 py-[9px] pr-3 pl-4 font-display text-[11px] font-bold tracking-[1.2px] text-ink-2 uppercase transition hover:bg-white/40 lg:h-10 lg:w-[120px] lg:gap-1 lg:border lg:border-white/95 lg:bg-white/30 lg:p-0 lg:text-xs lg:tracking-[1px] lg:text-ink lg:backdrop-blur-[6px] lg:hover:bg-white/60"
          >
            Skip
            <SkipForward className="size-3.5 lg:size-4" />
          </button>
        </div>

        <div className="relative mt-[23px] h-[670px] w-full overflow-hidden rounded-[28px] bg-ink-2 lg:mt-0 lg:aspect-video lg:h-auto lg:rounded-[36px] lg:shadow-[0_20px_50px_rgb(46_112_107/0.25)]">
          <video
            ref={ref}
            src={asset("/videos/intro.mp4")}
            playsInline
            // Desktop keeps the wide frame but shows the whole portrait video, with dark bars at the sides.
            className="size-full object-cover lg:object-contain"
            onPlay={() => {
              setPlaying(true);
              setShowIcon(false);
            }}
            onPause={() => setPlaying(false)}
            onEnded={onDone}
            onError={() => setMissing(true)}
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
          />

          {missing ? (
            <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/60">Video unavailable</p>
          ) : (
            <>
              {/* Paused: a tap anywhere plays. Playing: a tap only shows or hides the icon, so it can't pause by accident. */}
              <button type="button" aria-hidden tabIndex={-1} onClick={() => (playing ? setShowIcon((show) => !show) : toggle())} className="absolute inset-0" />
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause intro video" : "Play intro video"}
                // Below the centre, clear of the progress bar: the desktop player is shorter, so it can't move as far.
                // While playing it's hidden and can't be pressed until a tap shows it.
                className={`absolute top-[calc(50%+200px)] left-1/2 grid size-[88px] -translate-1/2 place-items-center rounded-full bg-teal text-white transition-opacity lg:top-[calc(50%+150px)] lg:size-[104px] ${
                  playing && !showIcon ? "pointer-events-none opacity-0 focus-visible:pointer-events-auto focus-visible:opacity-100" : ""
                }`}
              >
                {playing ? (
                  <Pause className="size-7 lg:size-9" strokeWidth={1.5} />
                ) : (
                  <>
                    <Play className="ml-1 size-7 fill-white lg:hidden" strokeWidth={2} />
                    <Play className="ml-1 hidden size-9 lg:block" strokeWidth={1.5} />
                  </>
                )}
              </button>
            </>
          )}

          <div className="absolute inset-x-6 bottom-10 flex h-4 items-center rounded-full outline-offset-4 has-focus-visible:outline-2 has-focus-visible:outline-white lg:inset-x-9 lg:bottom-8">
            <div aria-hidden className="relative h-1 w-full rounded-full bg-ink">
              <div className="h-full rounded-full bg-sage" style={{ width: `${progress * 100}%` }} />
              <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white lg:size-4" style={{ left: `${progress * 100}%` }} />
            </div>
            {/* Invisible native slider over the drawn bar: click, drag, arrow keys and screen readers all work. */}
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              onChange={(e) => seek(Number(e.target.value) / 1000)}
              disabled={missing}
              aria-label="Seek video"
              aria-valuetext={`${Math.round(progress * 100)}% played`}
              className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-default"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={missing}
          className="mx-auto mt-6 rounded-full px-4 py-1 text-center text-base text-teal transition hover:bg-white/40 disabled:opacity-40 disabled:hover:bg-transparent lg:mt-[26px] lg:text-lg"
        >
          <span className="lg:hidden">{playing ? "Tap to pause" : "Tap to play"}</span>
          <span className="hidden lg:inline">{playing ? "Click to pause" : "Click to play"}</span>
        </button>
      </section>
    </>
  );
}
