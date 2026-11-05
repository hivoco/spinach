import { pairSlug, parsePairSlug, type QuizResult } from "./quiz.ts"; // explicit extension so `npm run check` can run this file directly in Node

// ---- Saved answers (sessionStorage) ----

/** `answers[i]` is the option text picked for question i (holes = unanswered); `result` is the server's scoring of them. */
type Progress = { answers: string[]; name: string; email: string; result: QuizResult | null };

export const STORAGE_KEY = "spinach-quiz-progress";

// Generous upper bound on the question count, so a tampered entry can't make the quiz allocate a huge array.
const MAX_ANSWERS = 100;

const optionalString = (v: unknown) => v === undefined || typeof v === "string";

function parseResult(r: unknown): QuizResult | null | undefined {
  if (r === null || r === undefined) return null;
  if (typeof r !== "object") return undefined;
  const { pair, description, pdfUrl, archetypes } = r as Record<string, unknown>;
  const blend = Array.isArray(pair) ? parsePairSlug(pairSlug(pair as QuizResult["pair"])) : null;
  if (!blend || !optionalString(description) || !optionalString(pdfUrl) || !Array.isArray(archetypes)) return undefined;
  return { pair: blend, description: description as string | undefined, pdfUrl: pdfUrl as string | undefined, archetypes };
}

/** Validates progress read back from sessionStorage; anything malformed is treated as no saved progress. */
export function parseProgress(raw: string | null): Progress | null {
  try {
    const p = JSON.parse(raw ?? "null");
    if (!p || typeof p !== "object") return null;
    const { answers, name, email } = p;
    const validAnswers = Array.isArray(answers) && answers.length <= MAX_ANSWERS && answers.every((a) => a === null || typeof a === "string");
    const result = parseResult(p.result);
    if (!validAnswers || typeof name !== "string" || typeof email !== "string" || result === undefined) return null;
    // JSON turns unanswered slots into null; keep them as holes like the live state.
    return { answers: answers.map((a: string | null) => a ?? undefined) as string[], name, email, result };
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

/** `?q=3` → question 3 (of `total`), `?step=result` → result; anything unknown falls back to the intro. */
export function screenFromParams(params: URLSearchParams, total: number): Screen {
  const q = Number(params.get("q"));
  if (params.has("q") && Number.isInteger(q) && q >= 1 && q <= total) return { step: "quiz", q };
  const step = params.get("step");
  if ((AFTER_QUIZ as readonly string[]).includes(step ?? "")) return { step: step as Screen["step"] } as Screen;
  return { step: "intro" };
}

export const screenHref = (s: Screen) => (s.step === "quiz" ? `/quiz?q=${s.q}` : `/quiz?step=${s.step}`);

/**
 * Where a direct visit or refresh should actually land: a question can't be skipped ahead to, results need every
 * answer, and the report needs the scored result (processing fetches it). Returns null when the screen is allowed.
 */
export function redirectFor(screen: Screen, answers: string[], total: number, hasResult: boolean): Screen | null {
  const firstMissing = Array.from({ length: total }, (_, i) => answers[i]).findIndex((a) => !a);
  if (firstMissing === -1) return !hasResult && (screen.step === "result" || screen.step === "report" || screen.step === "done") ? { step: "processing" } : null;
  if (screen.step === "quiz" && screen.q - 1 <= firstMissing) return null;
  if (screen.step === "intro") return null;
  return { step: "quiz", q: firstMissing + 1 };
}
