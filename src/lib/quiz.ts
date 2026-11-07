import { asset } from "./assets.ts"; // explicit extension so `npm run check` can run this file directly in Node

export type ArchetypeKey =
  | "explorer"
  | "strategist"
  | "artist"
  | "harmoniser"
  | "protagonist"
  | "maverick"
  | "ruler"
  | "sage"
  | "visionary"
  | "indomitable-spirit";

export type Archetype = {
  name: string;
  image: string;
  trait: string;
  summary: string;
  strength: string;
};

const card = (key: string) => asset(`/images/archetypes/cards/${key}.webp`);

export const archetypes: Record<ArchetypeKey, Archetype> = {
  explorer: {
    name: "Explorer",
    image: card("explorer"),
    trait: "curiosity",
    summary: "You learn by trying things. New problems energise you, and you would rather test three ideas than debate one.",
    strength: "You thrive in roles with variety, research and room to experiment.",
  },
  strategist: {
    name: "Strategist",
    image: card("strategist"),
    trait: "strategy",
    summary: "You see the whole board. You break big goals into clear steps and spot risks before anyone else does.",
    strength: "You thrive where planning, analysis and clear priorities matter.",
  },
  artist: {
    name: "Artist",
    image: card("artist"),
    trait: "imagination",
    summary: "You think in pictures and stories. You notice what could be better and can't resist reshaping it.",
    strength: "You thrive in roles where originality is the job itself.",
  },
  harmoniser: {
    name: "Harmoniser",
    image: card("harmoniser"),
    trait: "empathy",
    summary: "People trust you quickly. You read the room, bring others together and make teams work better.",
    strength: "You thrive in roles built on relationships and teamwork.",
  },
  protagonist: {
    name: "Protagonist",
    image: card("protagonist"),
    trait: "drive",
    summary: "You take the lead. You set things in motion, finish what you start and bring others along with you.",
    strength: "You thrive where you can own delivery and see tangible results.",
  },
  maverick: {
    name: "Maverick",
    image: card("maverick"),
    trait: "independence",
    summary: "You question the usual way of doing things. Rules are a starting point, and you'll go against the grain when it makes sense.",
    strength: "You thrive where you're trusted to challenge norms and find your own route.",
  },
  ruler: {
    name: "Ruler",
    image: card("ruler"),
    trait: "leadership",
    summary: "You bring order to chaos. You like clear structure, take responsibility naturally, and people look to you to make the call.",
    strength: "You thrive in roles with authority, accountability and a team to lead.",
  },
  sage: {
    name: "Sage",
    image: card("sage"),
    trait: "wisdom",
    summary: "You want to understand how things really work. You think before you speak, and others come to you for considered advice.",
    strength: "You thrive in roles built on expertise, research and deep thinking.",
  },
  visionary: {
    name: "Visionary",
    image: card("visionary"),
    trait: "vision",
    summary: "You see what could be long before it exists. You connect ideas into a bigger picture and inspire others with it.",
    strength: "You thrive where you can shape direction and long-term change.",
  },
  "indomitable-spirit": {
    name: "Indomitable Spirit",
    image: card("indomitable-spirit"),
    trait: "resilience",
    summary: "Setbacks don't stop you. You keep going when things get hard, and your determination lifts the people around you.",
    strength: "You thrive in demanding roles where persistence makes the difference.",
  },
};

export const archetypeOrder = Object.keys(archetypes) as ArchetypeKey[];

// ---- Questions and scoring come from the database (src/app/api, ported from the archetype app) ----

/** How many questions the database holds; only used for copy shown before they're loaded (the welcome page). */
export const QUIZ_LENGTH = 11;

/** A question as GET /api/quiz/questions returns it: the options carry no answer key. */
export type ApiQuestion = { _id: string; questionText: string; options: { text: string }[] };

/** `text` is the question as stored (and saved with answers); `prompt` is how the quiz shows it. */
export type Question = { id: string; text: string; prompt: string; options: { label: string }[] };

/**
 * Same wording as the archetype app: most prompts continue "… You…", while one that already ends mid-sentence
 * ("…the highlight of the journey was your") just trails off.
 */
export const promptFor = (text: string) => {
  const t = text.trim().replace(/[.\s]+$/, "");
  return /\byour$/i.test(t) ? `${t}…` : `${t}. You…`;
};

export const toQuestion = (q: ApiQuestion): Question => ({
  id: q._id,
  text: q.questionText,
  prompt: promptFor(q.questionText),
  options: q.options.map((o) => ({ label: o.text })),
});

/** One answer as POST /api/quiz/calculate-result and the saved submission expect it. */
export type QuizAnswer = { question_id: string; question: string; answer: string };

/** What the quiz keeps from POST /api/quiz/calculate-result (see src/lib/api.ts). */
export type QuizResult = {
  pair: Blend;
  /** The combination description written for this blend's clusters. */
  description?: string;
  /** The PDF report for this blend, emailed on submit. */
  pdfUrl?: string;
  /** `archedata` as the API returned it; saved with the submission as `result`, as the archetype app did. */
  archetypes: unknown[];
  /** Opened from a shared link rather than scored from this person's answers. */
  shared?: boolean;
};

/** "the indomitable spirit" (the database title) → "indomitable-spirit". */
export function archetypeKeyFromTitle(title: string): ArchetypeKey | null {
  const key = title.trim().toLowerCase().replace(/^the\s+/, "").replace(/\s+/g, "-") as ArchetypeKey;
  return archetypeOrder.includes(key) ? key : null;
}

// ---- Shareable result pages: /result/<primary>-and-<secondary>, or /result/<archetype> for a single character ----

export type Pair = [ArchetypeKey, ArchetypeKey];
/** A result: a blend of two archetypes, or a single one. */
export type Blend = Pair | [ArchetypeKey];

// "-and-" rather than "-" because keys like "indomitable-spirit" already contain hyphens.
const PAIR_SEPARATOR = "-and-";

export const pairSlug = (blend: Blend) => blend.join(PAIR_SEPARATOR);
export const resultPath = (blend: Blend) => `/result/${pairSlug(blend)}`;

/** Every ordered pair of different archetypes: one result page each. */
export const allPairs: Pair[] = archetypeOrder.flatMap((a) => archetypeOrder.filter((b) => b !== a).map((b): Pair => [a, b]));
/** Every result page: the 10 single characters, then the 90 pairs. */
export const allResults: Blend[] = [...archetypeOrder.map((k): Blend => [k]), ...allPairs];

export function parsePairSlug(slug: string): Blend | null {
  const parts = slug.split(PAIR_SEPARATOR) as ArchetypeKey[];
  if (!parts.every((k) => archetypeOrder.includes(k))) return null;
  if (parts.length === 1) return [parts[0]];
  if (parts.length !== 2 || parts[0] === parts[1]) return null;
  return [parts[0], parts[1]];
}

/** The result copy, shared by the result screen and its search/share metadata. */
export const blendTitle = ([a, b]: Blend) => (b ? `${archetypes[a].name} + ${archetypes[b].name}` : archetypes[a].name);
export const blendTagline = ([a, b]: Blend) =>
  b ? `Where ${archetypes[a].trait} meets ${archetypes[b].trait}, passion thrives.` : `Where ${archetypes[a].trait} leads, passion thrives.`;
export const blendDescription = ([a, b]: Blend) => `${archetypes[a].summary} ${archetypes[b ?? a].strength}`;
