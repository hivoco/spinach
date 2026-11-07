"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { pairSlug, type Blend } from "@/lib/quiz";
import { fetchSharedResult } from "@/lib/api";
import { loadProgress, saveSharedResult } from "@/lib/progress";
import { useLeaveQuiz } from "@/components/LeaveQuiz";
import { Result } from "@/components/screens/Result";

/**
 * /result/<pair>. The person who just took the quiz (their saved answers produce this pair) continues to the
 * report. Anyone opening a shared link sees the same result and can get its report too, with Home instead of Back.
 */
export function ResultView({ pair }: { pair: Blend }) {
  const router = useRouter();
  // Set for the person whose saved, scored answers produced this pair.
  const [owner, setOwner] = useState<{ description?: string; questionCount: number } | null>(null);
  const { requestClose, dialog } = useLeaveQuiz(owner !== null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const opening = useRef(false);

  // A shared link has no saved result, so fetch this one's report details and then open the normal report form.
  const openSharedReport = async () => {
    if (opening.current) return;
    opening.current = true;
    setPending(true);
    setFailed(false);
    try {
      saveSharedResult(await fetchSharedResult(pair));
      router.push("/quiz?step=report");
    } catch {
      setFailed(true);
    } finally {
      opening.current = false;
      setPending(false);
    }
  };

  useEffect(() => {
    const saved = loadProgress(); // none or storage blocked: treat as a visitor
    // Reading browser storage has to wait until after hydration, or server and client HTML would differ.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwner(saved?.result && !saved.result.shared && pairSlug(saved.result.pair) === pairSlug(pair) ? { description: saved.result.description, questionCount: saved.answers.length } : null);
  }, [pair]);

  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative flex h-full flex-col"
      >
        {owner ? (
          <Result
            pair={pair}
            description={owner.description}
            onNext={() => router.push("/quiz?step=report")}
            // Arrived here from the last question (processing was replaced), so history Back returns to it.
            onBack={() => (window.history.length > 1 ? router.back() : router.push(`/quiz?q=${owner.questionCount}`))}
            onClose={requestClose}
          />
        ) : (
          <Result pair={pair} shared pending={pending} failed={failed} onNext={openSharedReport} onBack={() => router.push("/")} onClose={() => router.push("/")} />
        )}
      </motion.main>
      {dialog}
    </>
  );
}
