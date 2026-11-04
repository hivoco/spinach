"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { pairSlug, questions, topTwo, type Blend } from "@/lib/quiz";
import { loadProgress } from "@/lib/progress";
import { useLeaveQuiz } from "@/components/LeaveQuiz";
import { Result } from "@/components/screens/Result";

/**
 * /result/<pair>. The person who just took the quiz (their saved answers produce this pair) continues to the
 * report; anyone opening a shared link sees the same result with an invitation to take the quiz themselves.
 */
export function ResultView({ pair }: { pair: Blend }) {
  const router = useRouter();
  const [owner, setOwner] = useState(false);
  const { requestClose, dialog } = useLeaveQuiz(owner);

  useEffect(() => {
    const saved = loadProgress(); // none or storage blocked: treat as a visitor
    const finished = saved && questions.every((_, i) => saved.answers[i]);
    // Reading browser storage has to wait until after hydration, or server and client HTML would differ.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (finished && pairSlug(topTwo(saved.answers)) === pairSlug(pair)) setOwner(true);
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
            onNext={() => router.push("/quiz?step=report")}
            // Arrived here from the last question (processing was replaced), so history Back returns to it.
            onBack={() => (window.history.length > 1 ? router.back() : router.push(`/quiz?q=${questions.length}`))}
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
