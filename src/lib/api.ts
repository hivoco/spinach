import { archetypeKeyFromTitle, pairSlug, parsePairSlug, toQuestion, type ApiQuestion, type ArchetypeKey, type QuizAnswer, type QuizResult } from "@/lib/quiz";

// Browser-side calls to the quiz API in src/app/api (the archetype app's backend, same database).

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(
    path,
    body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
  return res.json();
}

export const fetchQuestions = async () => (await call<ApiQuestion[]>("/api/quiz/questions")).map(toQuestion);

type ApiResult = {
  archedata: { title: string }[];
  pdf: { pdfUrl: string } | null;
  description: { description: string } | null;
};

/** Scores the answers on the server and maps the archetypes it picks onto a result page. */
export async function calculateResult(answers: QuizAnswer[]): Promise<QuizResult> {
  const r = await call<ApiResult>("/api/quiz/calculate-result", answers);
  const keys = r.archedata.map((a) => archetypeKeyFromTitle(a.title));
  const pair = keys.every(Boolean) ? parsePairSlug(pairSlug(keys as [ArchetypeKey])) : null;
  if (!pair) throw new Error(`Unrecognised result: ${r.archedata.map((a) => a.title).join(", ")}`);
  return { pair, description: r.description?.description, pdfUrl: r.pdf?.pdfUrl, archetypes: r.archedata };
}

/** Saves the submission; the server then emails the PDF report to the person and notifies the admin. */
export const saveSubmission = (data: { name: string; email: string; quiz: QuizAnswer[]; result: unknown[]; pdfUrl?: string }) =>
  call<unknown>("/api/user/save-user-data", data);
