import { archetypeKeyFromTitle, pairSlug, parsePairSlug, toQuestion, type ApiQuestion, type ArchetypeKey, type Blend, type QuizAnswer, type QuizResult } from "@/lib/quiz";

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

/** Maps the archetypes the server picked onto a result page. */
function toQuizResult(r: ApiResult): QuizResult {
  const keys = r.archedata.map((a) => archetypeKeyFromTitle(a.title));
  const pair = keys.every(Boolean) ? parsePairSlug(pairSlug(keys as [ArchetypeKey])) : null;
  if (!pair) throw new Error(`Unrecognised result: ${r.archedata.map((a) => a.title).join(", ")}`);
  return { pair, description: r.description?.description, pdfUrl: r.pdf?.pdfUrl, archetypes: r.archedata };
}

/** Scores the answers on the server. */
export const calculateResult = async (answers: QuizAnswer[]) => toQuizResult(await call<ApiResult>("/api/quiz/calculate-result", answers));

/** The report details for a result opened from a shared link, which has no answers to score. */
export const fetchSharedResult = async (pair: Blend): Promise<QuizResult> => ({
  ...toQuizResult(await call<ApiResult>(`/api/quiz/shared-result?pair=${encodeURIComponent(pairSlug(pair))}`)),
  shared: true,
});

/** Saves the submission; the server then emails the PDF report to the person and notifies the admin. */
export const saveSubmission = (data: { name: string; email: string; quiz: QuizAnswer[]; result: unknown[]; pdfUrl?: string }) =>
  call<unknown>("/api/user/save-user-data", data);
