"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Download, LoaderCircle, Mail, Share2, User } from "lucide-react";
import { asset } from "@/lib/assets";
import { BackButton, Button, Field, Logo, MobileBar, TopBar } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

type Props = {
  title: string;
  /** The shareable result page, e.g. /result/explorer-and-strategist. */
  resultHref: string;
  /** The PDF report for this result, when the library has one. */
  pdfUrl?: string;
  name: string;
  email: string;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  /** Saves the submission (which emails the report); rejects when that fails. */
  onSubmit: () => Promise<void>;
  onBack: () => void;
  onClose: () => void;
};

export function Report({ title, resultHref, pdfUrl, name, email, onName, onEmail, onSubmit, onBack, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  // Errors only show after the first submit attempt, then update as the person types.
  const errors = {
    name: name.trim() ? undefined : "Enter your name.",
    email: !email.trim() ? "Enter your email address." : /^\S+@\S+\.\S+$/.test(email) ? undefined : "Enter a valid email, like you@example.com.",
  };

  return (
    <>
      <TopBar onBack={onBack} onClose={onClose} />
      <MobileBar left={<BackButton onClick={onBack} />} center={<Logo className="h-5 w-auto" />} />
      <section className="grid w-full flex-1 content-start px-7 pt-8 lg:grid-cols-[560px_560px] lg:mx-auto lg:max-w-page lg:content-stretch lg:justify-center lg:gap-[100px] lg:px-0 lg:pt-0 lg:pr-[100px] lg:pl-[120px]">
        {/* Phone: glass orb */}
        <Reveal direction="left" className="relative mx-auto grid size-[190px] place-items-center lg:hidden">
          <div aria-hidden className="absolute inset-[-9.47%_-14.74%_-20%_-14.74%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative Figma export */}
            <img alt="" src={asset("/images/ui/report/orb-mobile.webp")} className="block size-full" />
          </div>
          <span aria-hidden className="absolute size-[143.7px] rounded-full border-[1.5px] border-teal/22" />
          <span className="relative grid size-[92.5px] place-items-center rounded-full bg-teal/40 text-white">
            <Mail className="size-9" strokeWidth={1.5} />
          </span>
        </Reveal>

        {/* Desktop: glass card */}
        <Reveal direction="left" className="hidden lg:block lg:pt-[41px]">
          <div className="relative grid aspect-square w-full place-items-center rounded-[48px] border border-white/95 bg-linear-to-b from-white/70 to-white/38 shadow-glass backdrop-blur-[15px]">
            <span aria-hidden className="absolute size-[67.9%] rounded-full border-[1.5px] border-teal/12" />
            <span aria-hidden className="absolute size-[51.8%] rounded-full border-[1.5px] border-teal/22" />
            <span className="grid size-[35.7%] place-items-center rounded-full bg-teal/40 text-white">
              <Mail className="size-[42%]" strokeWidth={1.5} />
            </span>
          </div>
        </Reveal>

        <Reveal direction="right" delay={0.15} className="mt-[26px] text-center lg:mt-0 lg:pt-[37px] lg:text-left">
          <h1 className="font-display text-[32px] font-bold text-balance whitespace-nowrap text-ink lg:text-[60px] lg:leading-[70px]">To get your report</h1>
          <p className="mx-auto mt-[22px] max-w-[290px] text-base leading-[22px] text-ink/65 lg:mx-0 lg:mt-5 lg:max-w-none lg:text-xl lg:leading-[30px]">
            Tell us where to send your Career Archetype report.
          </p>

          <form
            ref={form}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              if (sending) return;
              if (!errors.name && !errors.email) {
                setSending(true);
                setSendFailed(false);
                // On success the screen changes; on failure stay here so the person can try again.
                return void onSubmit().catch(() => {
                  setSending(false);
                  setSendFailed(true);
                });
              }
              form.current?.querySelector<HTMLInputElement>(errors.name ? "input[name=name]" : "input[name=email]")?.focus();
            }}
            className="mt-6 flex flex-col gap-3 text-left lg:mt-9 lg:gap-[18px]"
          >
            <Field
              icon={<User />}
              label="Name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => onName(e.target.value)}
              error={submitted ? errors.name : undefined}
            />
            <Field
              icon={<Mail />}
              label="Email Id"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => onEmail(e.target.value)}
              error={submitted ? errors.email : undefined}
            />
            {/* Desktop frame shows it faded until both fields are valid; it stays clickable so a click still reveals the errors. */}
            <Button type="submit" aria-disabled={sending} className={`mt-2 w-full lg:mt-4 lg:h-[72px] lg:gap-1.5 ${errors.name || errors.email || sending ? "lg:opacity-50" : ""}`}>
              {sending ? (
                <>
                  Sending…
                  <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none lg:size-[22px]" />
                </>
              ) : (
                <>
                  <span className="lg:hidden">Send Report</span>
                  <span className="hidden lg:inline">Get Your Report</span>
                  <ArrowRight className="size-5 lg:size-[22px]" />
                </>
              )}
            </Button>
            <p aria-live="polite" className="px-6 text-center text-sm text-clay lg:text-left">
              {sendFailed ? "We couldn’t send your report. Check your connection and try again." : ""}
            </p>
          </form>

          <ReportActions title={title} resultHref={resultHref} pdfUrl={pdfUrl} className="mt-[76px] hidden gap-[22px] px-[14px] lg:flex" />
        </Reveal>
      </section>

      <ReportActions title={title} resultHref={resultHref} pdfUrl={pdfUrl} className="absolute inset-x-6 bottom-9 flex gap-4 lg:hidden" />
    </>
  );
}

/** Download and Share buttons for the result; also used on the thank-you screen. */
export function ReportActions({ title, resultHref, pdfUrl, className }: { title: string; resultHref: string; pdfUrl?: string; className: string }) {
  const [shareStatus, setShareStatus] = useState<"" | "copied" | "failed">("");
  useEffect(() => {
    if (!shareStatus) return;
    const t = setTimeout(() => setShareStatus(""), 2500);
    return () => clearTimeout(t);
  }, [shareStatus]);

  const share = async () => {
    const data = { title: "My career archetype", text: `My career archetype is ${title}. Find yours:`, url: location.origin + resultHref };
    if (navigator.share) return navigator.share(data).catch(() => {}); // the system share sheet is its own feedback
    try {
      await navigator.clipboard.writeText(`${data.text} ${data.url}`);
      setShareStatus("copied");
    } catch {
      setShareStatus("failed");
    }
  };

  return (
    <div className={className}>
      <p aria-live="polite" className="sr-only">
        {shareStatus === "copied" ? "Link copied to the clipboard." : shareStatus === "failed" ? "Couldn’t copy the link. Copy it from the address bar instead." : ""}
      </p>
      {/* The report lives on S3, which allows no cross-origin fetch, so it opens in a new tab (the browser's viewer can save it).
          No PDF for this result in the library: fall back to printing the page (where "Save as PDF" downloads it). */}
      <Button compact onClick={() => (pdfUrl ? window.open(pdfUrl, "_blank", "noopener") : window.print())} className="flex-1 lg:w-[260px] lg:flex-none">
        <Download className="size-[22px]" />
        Download Report
      </Button>
      <Button compact variant="glass" onClick={share} className="flex-1 lg:w-[250px] lg:flex-none">
        {shareStatus === "copied" ? <Check className="size-[22px] text-teal" /> : <Share2 className="size-[22px]" />}
        {shareStatus === "copied" ? "Link Copied" : shareStatus === "failed" ? "Copy Failed" : "Share Report"}
      </Button>
    </div>
  );
}
