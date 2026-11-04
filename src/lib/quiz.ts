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

const card = (key: string) => `/images/archetypes/cards/${key}.png`;

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

export type Question = {
  id: string;
  prompt: string;
  /** `also`: the answer's secondary archetype, worth half a point, so a short quiz still yields a meaningful pair. */
  options: { label: string; archetype: ArchetypeKey; also?: ArchetypeKey }[];
};

export const questions: Question[] = [
  {
    id: "brief",
    prompt: "You are given a task without a clear brief and a strict deadline. You…",
    options: [
      { label: "Try a quick first version and learn from it", archetype: "explorer", also: "artist" },
      { label: "Map out the steps and timeline before starting", archetype: "strategist", also: "ruler" },
      { label: "Ask the team what success looks like", archetype: "harmoniser", also: "sage" },
      { label: "Write your own brief and run with it", archetype: "maverick", also: "visionary" },
      { label: "Push through, whatever it takes to hit the date", archetype: "indomitable-spirit", also: "protagonist" },
    ],
  },
];

/**
 * Two highest-scoring archetypes. `answers[i]` is the archetype picked for questions[i] (holes = unanswered):
 * each pick scores 1 and its option's `also` scores 0.5. Ties go to the earlier one in archetypeOrder.
 */
export function topTwo(answers: ArchetypeKey[]): [ArchetypeKey, ArchetypeKey] {
  const score = new Map<ArchetypeKey, number>();
  const add = (k: ArchetypeKey | undefined, n: number) => k && score.set(k, (score.get(k) ?? 0) + n);
  answers.forEach((a, i) => {
    add(a, 1);
    add(questions[i]?.options.find((o) => o.archetype === a)?.also, 0.5);
  });
  const count = (k: ArchetypeKey) => score.get(k) ?? 0;
  const [first, second] = [...archetypeOrder].sort((a, b) => count(b) - count(a));
  return [first, second];
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
