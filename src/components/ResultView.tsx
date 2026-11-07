"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { pairSlug, type Blend } from "@/lib/quiz";
import { loadProgress } from "@/lib/progress";
import { useLeaveQuiz } from "@/components/LeaveQuiz";
import { Result } from "@/components/screens/Result";

/**
 * /result/<pair>. The person who just took the quiz (their saved answers produce this pair) continues to the
 * report; anyone opening a shared link sees the same result with an invitation to take the quiz themselves.
 */
export function ResultView({ pair }: { pair: Blend }) {
  const router = useRouter();
  // Set for the person whose saved, scored answers produced this pair.
  const [owner, setOwner] = useState<{ description?: string; questionCount: number } | null>(null);
  const { requestClose, dialog } = useLeaveQuiz(owner !== null);

  useEffect(() => {
    const saved = loadProgress(); // none or storage blocked: treat as a visitor
    // Reading browser storage has to wait until after hydration, or server and client HTML would differ.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwner(saved?.result && pairSlug(saved.result.pair) === pairSlug(pair) ? { description: saved.result.description, questionCount: saved.answers.length } : null);
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
          <Result pair={pair} shared onNext={() => router.push("/")} onBack={() => router.push("/")} onClose={() => router.push("/")} />
        )}
      </motion.main>
      {dialog}
    </>
  );
}
