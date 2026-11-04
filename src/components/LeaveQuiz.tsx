"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearProgress } from "@/lib/progress";
import { ConfirmDialog } from "@/components/ui";

/**
 * Close (✕) for anywhere in the quiz: asks "Leave the quiz?" once there are answers to lose,
 * then clears saved progress and goes to the welcome page. Render `dialog` once on the page.
 */
export function useLeaveQuiz(hasAnswers: boolean) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Clear storage and navigate; in-memory answers go away when the route unmounts. (Clearing state here
  // would trigger the quiz's "first unanswered question" redirect before the navigation to / happens.)
  const leave = () => {
    setOpen(false);
    clearProgress();
    router.push("/");
  };

  return {
    requestClose: () => (hasAnswers ? setOpen(true) : leave()),
    dialog: (
      <ConfirmDialog
        open={open}
        title="Leave the quiz?"
        message="Your answers so far will be lost."
        cancelLabel="Keep Going"
        confirmLabel="Leave Quiz"
        onCancel={() => setOpen(false)}
        onConfirm={leave}
      />
    ),
  };
}
