import { archetypeOrder, questions, type ArchetypeKey } from "./quiz.ts"; // explicit extension so `npm run check` can run this file directly in Node

// ---- Saved answers (sessionStorage) ----

type Progress = { answers: ArchetypeKey[]; name: string; email: string };

export const STORAGE_KEY = "spinach-quiz-progress";

/** Validates progress read back from sessionStorage; anything malformed is treated as no saved progress. */
export function parseProgress(raw: string | null): Progress | null {
  try {
    const p = JSON.parse(raw ?? "null");
    if (!p || typeof p !== "object") return null;
    const { answers, name, email } = p;
    const validAnswers =
      Array.isArray(answers) && answers.length <= questions.length && answers.every((a) => a === null || archetypeOrder.includes(a));
    if (!validAnswers || typeof name !== "string" || typeof email !== "string") return null;
    // JSON turns unanswered slots into null; keep them as holes like the live state.
    return { answers: answers.map((a: ArchetypeKey | null) => a ?? undefined) as ArchetypeKey[], name, email };
  } catch {
    return null;
  }
}

/** Saved progress for this tab, or null when there is none, it is malformed, or storage is blocked (private mode). */
export function loadProgress(): Progress | null {
  try {
    return parseProgress(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearProgress() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ---- Which screen the /quiz URL points at ----

const AFTER_QUIZ = ["processing", "result", "report", "done"] as const;
export type Screen = { step: "intro" } | { step: "quiz"; q: number } | { step: (typeof AFTER_QUIZ)[number] };

/** `?q=3` → question 3, `?step=result` → result; anything unknown falls back to the intro. */
export function screenFromParams(params: URLSearchParams): Screen {
  const q = Number(params.get("q"));
  if (params.has("q") && Number.isInteger(q) && q >= 1 && q <= questions.length) return { step: "quiz", q };
  const step = params.get("step");
  if ((AFTER_QUIZ as readonly string[]).includes(step ?? "")) return { step: step as Screen["step"] } as Screen;
  return { step: "intro" };
}

export const screenHref = (s: Screen) => (s.step === "quiz" ? `/quiz?q=${s.q}` : `/quiz?step=${s.step}`);

/**
 * Where a direct visit or refresh should actually land: a question can't be skipped ahead to,
 * and results need every answer. Returns null when the requested screen is allowed.
 */
export function redirectFor(screen: Screen, answers: ArchetypeKey[]): Screen | null {
  const firstMissing = questions.findIndex((_, i) => !answers[i]);
  if (firstMissing === -1) return null;
  if (screen.step === "quiz" && screen.q - 1 <= firstMissing) return null;
  if (screen.step === "intro") return null;
  return { step: "quiz", q: firstMissing + 1 };
}
