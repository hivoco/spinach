"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, LinkButton, Logo, MobileBar, Tag, TopBar } from "@/components/ui";

export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    // shortcut: logs to the browser console only; send to an error-reporting service once one is set up.
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex h-full flex-col">
      <TopBar />
      <MobileBar left={<Logo />} />
      <section className="flex flex-1 flex-col items-center justify-center px-7 pb-24 text-center lg:pb-32">
        <Tag>Something went wrong</Tag>
        <h1 className="mt-5 font-display text-[34px] leading-tight font-bold text-balance text-ink lg:mt-6 lg:text-[52px]">We couldn’t load this screen</h1>
        <p className="mt-3 max-w-[420px] text-base leading-[22px] text-ink/65 lg:mt-4 lg:max-w-[520px] lg:text-xl">
          Try again. If it keeps happening, go back to the start; your quiz answers are saved in this tab.
        </p>
        <div className="mt-9 flex w-full max-w-[334px] flex-col gap-3 lg:mt-10 lg:max-w-none lg:flex-row lg:justify-center lg:gap-4">
          <Button onClick={() => unstable_retry()} className="lg:w-60">
            <RotateCcw className="size-5" />
            Try Again
          </Button>
          <LinkButton href="/" variant="glass" className="lg:w-60">
            Back to Home
          </LinkButton>
        </div>
      </section>
    </main>
  );
}
