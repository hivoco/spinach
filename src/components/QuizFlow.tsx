"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { blendTitle, resultPath, type Question, type QuizAnswer, type QuizResult } from "@/lib/quiz";
import { calculateResult, fetchQuestions, saveSubmission } from "@/lib/api";
import { STORAGE_KEY, loadProgress, redirectFor, screenFromParams, screenHref, type Screen } from "@/lib/progress";
import { useLeaveQuiz } from "@/components/LeaveQuiz";
import { Button, LinkButton, Logo, MobileBar, Tag, TopBar } from "@/components/ui";
import { Intro } from "@/components/screens/Intro";
import { QuestionStep } from "@/components/screens/QuestionStep";
import { Processing } from "@/components/screens/Processing";
import { Report } from "@/components/screens/Report";
import { Done } from "@/components/screens/Done";

/**
 * The quiz after the welcome page. The URL says which screen is showing (/quiz?q=3, /quiz?step=report),
 * so the browser's Back/Forward, refresh and direct links all work; answers live in this tab's sessionStorage.
 * Questions, scoring and the emailed report come from the API (src/app/api). The result itself has its own
 * shareable page, /result/<pair> (see ResultView).
 */
export function QuizFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [restored, setRestored] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [scoreFailed, setScoreFailed] = useState(false);
  const { requestClose, dialog } = useLeaveQuiz(answers.some(Boolean));
  const justRestored = useRef(false);

  // Keep answers across a refresh (this tab only).
  useEffect(() => {
    const saved = loadProgress();
    // Restoring from browser storage must wait until after hydration, or server and client HTML would differ.
    // Next keeps this page alive (hidden) after you leave and this re-runs on return, so no saved progress
    // (the quiz was left or restarted) has to clear the answers still held in memory.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(saved?.answers ?? []);
    setName(saved?.name ?? "");
    setEmail(saved?.email ?? "");
    setResult(saved?.result ?? null);
    setRestored(true);
    justRestored.current = true;
  }, []);
  useEffect(() => {
    if (!restored) return;
    // This run still holds the state from before the restore above; saving it would bring back what was just cleared.
    if (justRestored.current) {
      justRestored.current = false;
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, name, email, result }));
    } catch {} // storage blocked or full: progress just won't survive a refresh
  }, [restored, answers, name, email, result]);

  const loadQuestions = useCallback(
    () =>
      fetchQuestions()
        .then((qs) => (qs.length ? setQuestions(qs) : setLoadFailed(true)))
        .catch(() => setLoadFailed(true)),
    [],
  );
  useEffect(() => void loadQuestions(), [loadQuestions]);

  const total = questions?.length ?? 0;
  const ready = restored && questions !== null;
  const screen = screenFromParams(params, total);
  // A link or refresh can point past the first unanswered question; send it back there.
  // ?step=result now lives at /result/<pair>; junk parameters (e.g. ?q=abc) are rewritten to the screen shown.
  const redirect = ready ? redirectFor(screen, answers, total, result !== null) : null;
  const canonical = screenHref(screen);
  const redirectHref = !ready
    ? null
    : redirect
      ? screenHref(redirect)
      : screen.step === "result" && result
        ? resultPath(result.pair)
        : `/quiz?${params}` !== canonical
          ? canonical
          : null;
  useEffect(() => {
    if (redirectHref) router.replace(redirectHref, { scroll: false });
  }, [redirectHref, router]);

  // The submitted answers, in the shape the API takes.
  const quizAnswers = useCallback(
    (): QuizAnswer[] => (questions ?? []).map((q, i) => ({ question_id: q.id, question: q.text, answer: answers[i] })),
    [questions, answers],
  );

  // Score the answers while the processing animation runs.
  const scoring = ready && !redirectHref && screen.step === "processing" && !result && !scoreFailed;
  useEffect(() => {
    if (!scoring) return;
    let cancelled = false;
    calculateResult(quizAnswers())
      .then((r) => !cancelled && setResult(r))
      .catch(() => !cancelled && setScoreFailed(true));
    return () => {
      cancelled = true;
    };
  }, [scoring, quizAnswers]);

  const go = (s: Screen) => router.push(screenHref(s), { scroll: false });
  /** In-page Back behaves like the browser's; in a fresh tab with no history it goes to `fallback` instead. */
  const back = (fallback: string) => (window.history.length > 1 ? router.back() : router.replace(fallback, { scroll: false }));
  // Replace, not push: Back from the result should return to the last question, not replay processing.
  const resultHref = result ? resultPath(result.pair) : "/";
  const showResult = useCallback(() => router.replace(resultHref, { scroll: false }), [router, resultHref]);

  if (loadFailed && !questions)
    return (
      <LoadError
        onRetry={() => {
          setLoadFailed(false);
          loadQuestions();
        }}
      />
    );
  if (!restored || !questions || redirectHref) return null;

  const q = screen.step === "quiz" ? screen.q - 1 : 0;

  const screens: Record<Screen["step"], React.ReactNode> = {
    intro: <Intro onDone={() => go({ step: "quiz", q: 1 })} />,
    quiz: (
      <QuestionStep
        index={q}
        total={total}
        question={questions[q]}
        selected={answers[q]}
        onSelect={(label) => {
          setAnswers((a) => {
            const next = [...a];
            next[q] = label;
            return next;
          });
          if (answers[q] !== label) setResult(null); // a changed answer needs scoring again
        }}
        onNext={() => go(q < total - 1 ? { step: "quiz", q: q + 2 } : { step: "processing" })}
        onBack={() => back(q > 0 ? screenHref({ step: "quiz", q }) : screenHref({ step: "intro" }))}
        onClose={requestClose}
      />
    ),
    processing: (
      <Processing
        count={total}
        ready={result !== null}
        failed={scoreFailed}
        onRetry={() => setScoreFailed(false)}
        onDone={showResult}
      />
    ),
    result: null, // redirected to /result/<pair> above
    report: result && (
      <Report
        title={blendTitle(result.pair)}
        resultHref={resultHref}
        pdfUrl={result.pdfUrl}
        name={name}
        email={email}
        onName={setName}
        onEmail={setEmail}
        // Answers stay saved so refreshing the thank-you screen still works; starting again from the welcome page clears them.
        onSubmit={async () => {
          await saveSubmission({ name: name.trim(), email: email.trim(), quiz: quizAnswers(), result: result.archetypes, pdfUrl: result.pdfUrl });
          go({ step: "done" });
        }}
        onBack={() => back(resultHref)}
        onClose={requestClose}
      />
    ),
    done: <Done />,
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Keyed by step (not question), so the question screen stays mounted and its card swap runs between questions. */}
        <motion.main
          key={screen.step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative flex h-full flex-col"
        >
          {screens[screen.step]}
        </motion.main>
      </AnimatePresence>
      {dialog}
    </>
  );
}

/** The questions couldn't be loaded (offline, or the API is down). */
function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="relative flex h-full flex-col">
      <TopBar />
      <MobileBar left={<Logo />} />
      <section className="flex flex-1 flex-col items-center justify-center px-7 pb-24 text-center lg:pb-32">
        <Tag>Something went wrong</Tag>
        <h1 className="mt-5 font-display text-[34px] leading-tight font-bold text-balance text-ink lg:mt-6 lg:text-[52px]">We couldn’t load the quiz</h1>
        <p className="mt-3 max-w-[420px] text-base leading-[22px] text-ink/65 lg:mt-4 lg:max-w-[520px] lg:text-xl">
          Check your connection and try again; any answers you’ve given are saved in this tab.
        </p>
        <div className="mt-9 flex w-full max-w-[334px] flex-col gap-3 lg:mt-10 lg:max-w-none lg:flex-row lg:justify-center lg:gap-4">
          <Button onClick={onRetry} className="lg:w-60">
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
