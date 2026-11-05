"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { asset } from "@/lib/assets";

/** <img> that keeps its space (as an empty, labelled box, or `fallback`) when the file fails to load. */
export function Asset({ src, alt, className = "", fallback }: { src: string; alt: string; className?: string; fallback?: ReactNode }) {
  const ref = useRef<HTMLImageElement>(null);
  const [missing, setMissing] = useState(false);

  // onError can fire before hydration, so check the already-loaded state too.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  if (missing)
    return (
      fallback ?? (
        <div role="img" aria-label={alt} className={className} />
      )
    );
  // eslint-disable-next-line @next/next/no-img-element -- user-supplied assets with unknown dimensions
  return <img ref={ref} src={src} alt={alt} className={className} onError={() => setMissing(true)} />;
}

/** The Spinach wordmark, linking to the welcome page. `link={false}` where it would only link to the page you're on. */
export function Logo({ className = "h-[21px] w-auto lg:h-[26px]", link = true }: { className?: string; link?: boolean }) {
  const image = (
    <Asset
      src={asset("/images/brand/spinach-logo.webp")}
      alt="Spinach"
      className={className}
      fallback={<span translate="no" className="font-display text-lg font-bold tracking-wide text-teal">SPINACH</span>}
    />
  );
  if (!link) return image;
  return (
    <Link href="/" aria-label="Spinach home" className="inline-flex rounded-md transition hover:opacity-80">
      {image}
    </Link>
  );
}

export function Backdrop() {
  // Tall phone version below the lg breakpoint, wide version on desktop.
  return (
    <div
      aria-hidden
      style={{ "--bg-phone": `url('${asset("/images/backgrounds/phone-background.webp")}')`, "--bg-desktop": `url('${asset("/images/backgrounds/app-background.webp")}')` } as CSSProperties}
      className="pointer-events-none fixed inset-0 -z-10 bg-(image:--bg-phone) bg-cover bg-center lg:bg-(image:--bg-desktop)"
    />
  );
}

function IconButton({ label, className = "", children, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid size-11 place-items-center rounded-full border border-white/95 bg-white/55 text-ink backdrop-blur-[10px] transition hover:bg-white/80 lg:size-12 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Desktop header from the D-frames: logo with close on the right, optional back button below. lowLogo: D2 and D3 put the logo at y54. */
export function TopBar({ onBack, onClose, lowLogo = false }: { onBack?: () => void; onClose?: () => void; lowLogo?: boolean }) {
  return (
    // Figma D-frames: close at y40, logo at y48, back at y105.
    <header className="relative z-10 hidden px-20 pt-10 lg:block">
      <div className="flex items-start justify-between">
        <div className={lowLogo ? "mt-3.5" : "mt-2"}>
          <Logo />
        </div>
        {onClose && (
          <IconButton label="Close quiz" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        )}
      </div>
      {onBack && (
        <IconButton label="Back" onClick={onBack} className="mt-[17px]">
          <ArrowLeft className="size-[22px]" />
        </IconButton>
      )}
    </header>
  );
}

/** Phone header row (y 24–68, tighter than the mobile frames): optional left button, centre content, right button. */
export function MobileBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  return (
    <header className="relative z-10 flex h-[68px] items-center justify-between px-7 pt-6 lg:hidden">
      <div>{left}</div>
      {center && <div className="absolute top-6 left-1/2 flex h-11 -translate-x-1/2 items-center whitespace-nowrap">{center}</div>}
      <div>{right}</div>
    </header>
  );
}

export const BackButton = ({ onClick }: { onClick: () => void }) => (
  <IconButton label="Back" onClick={onClick}>
    <ArrowLeft className="size-5" />
  </IconButton>
);

export const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <IconButton label="Close quiz" onClick={onClick}>
    <X className="size-5" />
  </IconButton>
);

/** Small glass label above a heading, e.g. "Question 01 / 11". */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[26px] items-center rounded-full border border-white/95 bg-white/60 px-3 font-display text-[10px] font-bold tracking-[1.2px] text-teal uppercase tabular-nums backdrop-blur-[6px] lg:h-9 lg:px-5 lg:text-[11.5px] lg:tracking-[1.4px]">
      {children}
    </span>
  );
}

type ButtonStyle = { variant?: "primary" | "glass"; compact?: boolean; className?: string };

/** Shared look for Button and LinkButton. compact: the phone report screen's side-by-side buttons (12px label, tight padding). */
function buttonClass({ variant = "primary", compact = false, className = "" }: ButtonStyle) {
  const size = compact ? "gap-1.5 px-3 text-xs whitespace-nowrap lg:gap-2.5 lg:px-8 lg:text-[15px]" : "gap-2.5 px-8 text-[15px]";
  const look =
    variant === "primary"
      ? "bg-teal text-white shadow-cta hover:bg-teal-deep"
      : "border border-white/95 bg-white/60 text-ink shadow-glass backdrop-blur-[8px] hover:bg-white/80";
  return `inline-flex h-[60px] items-center justify-center rounded-full font-display font-bold transition disabled:cursor-not-allowed disabled:opacity-50 lg:h-[68px] ${size} ${look} ${className}`;
}

export function Button({ variant, compact, className, ...props }: ComponentProps<"button"> & ButtonStyle) {
  return <button className={buttonClass({ variant, compact, className })} {...props} />;
}

/** Same look as Button, for navigation (a real link: middle-click, Cmd/Ctrl+click and prefetch work). */
export function LinkButton({ variant, compact, className, ...props }: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={buttonClass({ variant, compact, className })} {...props} />;
}

export function Field({ icon, label, error, ...props }: ComponentProps<"input"> & { icon: ReactNode; label: string; error?: string }) {
  const errorId = `${useId()}-error`;
  const border = error ? "border-clay lg:border-clay" : "border-teal lg:border-white/95 lg:focus-within:border-teal";
  return (
    <div>
      <label
        className={`group flex h-[54px] items-center gap-3.5 rounded-full border-[1.5px] bg-white/62 px-6 shadow-[0_8px_20px_rgb(46_112_107/0.1)] backdrop-blur-[6px] transition focus-within:shadow-[0_8px_20px_rgb(46_112_107/0.22)] focus-within:ring-[3px] focus-within:ring-teal/25 lg:h-[72px] lg:gap-5 lg:px-[30.5px] lg:shadow-[0_8px_22px_rgb(46_112_107/0.1)] lg:focus-within:shadow-[0_8px_22px_rgb(46_112_107/0.22)] lg:focus-within:ring-0 ${border}`}
      >
        <span className="text-ink/60 transition-colors lg:group-focus-within:text-teal [&>svg]:size-[22px]">{icon}</span>
        <span className="sr-only">{label}</span>
        <input
          // Browsers paint autofilled inputs blue and ignore background overrides; delaying the colour change effectively never applies it.
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink/50 autofill:transition-[background-color] autofill:delay-[99999s] lg:text-[19px]"
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      </label>
      {error && (
        <p id={errorId} className="mt-1.5 px-6 text-left text-sm text-clay lg:px-8">
          {error}
        </p>
      )}
    </div>
  );
}

/** Small modal for confirming a destructive action. Native <dialog>: focus is trapped and Esc cancels. */
export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
  }, [props.open]);
  return (
    <dialog
      ref={ref}
      onClose={props.onCancel}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(90vw,420px)] overscroll-contain rounded-[32px] border border-white/95 bg-white/85 p-8 text-center text-ink shadow-[0_24px_60px_rgb(46_52_64/0.25)] backdrop-blur-[15px] backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]"
    >
      <h2 id="confirm-title" className="font-display text-2xl font-bold text-balance">
        {props.title}
      </h2>
      <p className="mt-3 text-base text-ink/65">{props.message}</p>
      <div className="mt-7 flex gap-3">
        <Button variant="glass" onClick={props.onCancel} className="flex-1" autoFocus>
          {props.cancelLabel}
        </Button>
        <Button onClick={props.onConfirm} className="flex-1">
          {props.confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

type Shape = { src: string; clip: string; overflow: string };

/**
 * Figma's cushion-shaped glass panel. The exported SVG draws the outline, fill and shadow;
 * a blurred layer clipped to the same shape behind it supplies the frosted glass.
 * `mobile` swaps in the phone export below the lg breakpoint.
 */
export function GlassShape({ shape, mobile = shape, className = "", children }: { shape: Shape; mobile?: Shape; className?: string; children: ReactNode }) {
  // React's useId contains characters that are invalid inside url(#…), so strip them.
  const id = `glass${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const layers = [
    { s: mobile, key: "m", show: "lg:hidden" },
    { s: shape, key: "d", show: "hidden lg:block" },
  ];
  return (
    <div className={`relative ${className}`}>
      <svg aria-hidden className="absolute size-0">
        {layers.map(({ s, key }) => (
          <clipPath key={key} id={id + key} clipPathUnits="objectBoundingBox">
            <path d={s.clip} />
          </clipPath>
        ))}
      </svg>
      {layers.map(({ s, key, show }) => (
        <div key={key} aria-hidden className={`pointer-events-none absolute inset-0 ${show}`}>
          <div className="absolute inset-0 backdrop-blur-[15px]" style={{ clipPath: `url(#${id + key})` }} />
          <div className="absolute" style={{ inset: s.overflow }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative Figma export */}
            <img alt="" src={s.src} className="block size-full max-w-none" />
          </div>
        </div>
      ))}
      <div className="relative h-full">{children}</div>
    </div>
  );
}
