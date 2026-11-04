"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { blendTitle, questions, resultPath, topTwo, type ArchetypeKey } from "@/lib/quiz";
import { STORAGE_KEY, loadProgress, redirectFor, screenFromParams, screenHref, type Screen } from "@/lib/progress";
import { useLeaveQuiz } from "@/components/LeaveQuiz";
import { Intro } from "@/components/screens/Intro";
import { QuestionStep } from "@/components/screens/QuestionStep";
import { Processing } from "@/components/screens/Processing";
import { Report } from "@/components/screens/Report";
import { Done } from "@/components/screens/Done";

/**
 * The quiz after the welcome page. The URL says which screen is showing (/quiz?q=3, /quiz?step=report),
 * so the browser's Back/Forward, refresh and direct links all work; answers live in this tab's sessionStorage.
 * The result itself has its own shareable page, /result/<pair> (see ResultView).
 */
export function QuizFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<ArchetypeKey[]>([]);
  const [restored, setRestored] = useState(false);
  const { requestClose, dialog } = useLeaveQuiz(answers.some(Boolean));

  // Keep answers across a refresh (this tab only).
  useEffect(() => {
    const saved = loadProgress();
    if (saved) {
      // Restoring from browser storage must wait until after hydration, or server and client HTML would differ.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(saved.answers);
      setName(saved.name);
      setEmail(saved.email);
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, name, email }));
    } catch {} // storage blocked or full: progress just won't survive a refresh
  }, [restored, answers, name, email]);

  const pair = useMemo(() => topTwo(answers), [answers]);
  const resultHref = resultPath(pair);
  const screen = screenFromParams(params);
  // A link or refresh can point past the first unanswered question; send it back there.
  // ?step=result now lives at /result/<pair>; junk parameters (e.g. ?q=abc) are rewritten to the screen shown.
  const redirect = restored ? redirectFor(screen, answers) : null;
  const canonical = screenHref(screen);
  const redirectHref = !restored
    ? null
    : redirect
      ? screenHref(redirect)
      : screen.step === "result"
        ? resultHref
        : `/quiz?${params}` !== canonical
          ? canonical
          : null;
  useEffect(() => {
    if (redirectHref) router.replace(redirectHref, { scroll: false });
  }, [redirectHref, router]);

  const go = (s: Screen) => router.push(screenHref(s), { scroll: false });
  /** In-page Back behaves like the browser's; in a fresh tab with no history it goes to `fallback` instead. */
  const back = (fallback: string) => (window.history.length > 1 ? router.back() : router.replace(fallback, { scroll: false }));
  // Replace, not push: Back from the result should return to the last question, not replay processing.
  const showResult = useCallback(() => router.replace(resultHref, { scroll: false }), [router, resultHref]);

  if (!restored || redirectHref) return null;

  const q = screen.step === "quiz" ? screen.q - 1 : 0;

  const screens: Record<Screen["step"], React.ReactNode> = {
    intro: <Intro onDone={() => go({ step: "quiz", q: 1 })} />,
    quiz: (
      <QuestionStep
        index={q}
        total={questions.length}
        question={questions[q]}
        selected={answers[q]}
        onSelect={(k) =>
          setAnswers((a) => {
            const next = [...a];
            next[q] = k;
            return next;
          })
        }
        onNext={() => go(q < questions.length - 1 ? { step: "quiz", q: q + 2 } : { step: "processing" })}
        onBack={() => back(q > 0 ? screenHref({ step: "quiz", q }) : screenHref({ step: "intro" }))}
        onClose={requestClose}
      />
    ),
    processing: <Processing onDone={showResult} />,
    result: null, // redirected to /result/<pair> above
    // shortcut: no backend yet, so submitting only shows the thank-you screen; send the email here later.
    report: (
      <Report
        title={blendTitle(pair)}
        resultHref={resultHref}
        name={name}
        email={email}
        onName={setName}
        onEmail={setEmail}
        // Answers stay saved so refreshing the thank-you screen still works; starting again from the welcome page clears them.
        onSubmit={() => go({ step: "done" })}
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
