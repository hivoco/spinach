import type { Metadata } from "next";
import { Suspense } from "react";
import { QuizFlow } from "@/components/QuizFlow";

export const metadata: Metadata = {
  title: "Career archetype quiz | Spinach",
  // Quiz steps and personal results aren't pages people should land on from search.
  robots: { index: false, follow: true },
};

export default function QuizPage() {
  // useSearchParams needs a Suspense boundary so the rest of the route can still be prerendered.
  return (
    <Suspense fallback={null}>
      <QuizFlow />
    </Suspense>
  );
}
