import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { allResults, blendDescription, blendTagline, blendTitle, pairSlug, parsePairSlug, resultPath } from "@/lib/quiz";
import { ResultView } from "@/components/ResultView";

type Props = { params: Promise<{ pair: string }> };

// One static page per result: 90 pairs and 10 single characters. Anything else is a 404 via notFound() below.
export function generateStaticParams() {
  return allResults.map((pair) => ({ pair: pairSlug(pair) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pair = parsePairSlug((await params).pair);
  if (!pair) return {};
  const title = blendTitle(pair);
  const description = `${blendTagline(pair)} ${blendDescription(pair)}`;
  return {
    title: `${title} | Spinach career archetype`,
    description,
    alternates: { canonical: resultPath(pair) },
    openGraph: { title: `${title}: my career archetype`, description, url: resultPath(pair), siteName: "Spinach", locale: "en_IN", type: "website" },
    twitter: { card: "summary_large_image", title: `${title}: my career archetype`, description },
  };
}

export default function ResultPage({ params }: Props) {
  // Reading the URL inside Suspense keeps navigation to a result instant (Cache Components); all 100 results are
  // prerendered, so the fallback is only ever seen on a cold, uncached pair.
  return (
    <Suspense fallback={null}>
      <PairResult params={params} />
    </Suspense>
  );
}

async function PairResult({ params }: Props) {
  const pair = parsePairSlug((await params).pair);
  if (!pair) notFound(); // also rejected earlier by src/proxy.ts, so bad links get a real 404 status
  return <ResultView pair={pair} />;
}
