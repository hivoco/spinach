import { query, queryOne, withTransaction } from "@/lib/db";
import { newObjectId } from "@/lib/objectId";
import clusterServices from "./cluster";
import combinationServices from "./combination";
import pdfServices from "./pdf";

const createQuestion = async (data) => {
  const { questionText, options = [] } = data;

  const id = newObjectId();
  const now = new Date();

  await withTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO questions (id, questionText, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      [id, questionText?.trim(), now, now]
    );

    for (const [position, option] of options.entries()) {
      await conn.query(
        `INSERT INTO question_options (id, question_id, text, archetype_id, position, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          newObjectId(),
          id,
          option.text?.trim(),
          option.archetype,
          position,
          now,
          now,
        ]
      );
    }
  });

  return getQuestionById(id);
};

const loadQuestions = async ({ includeArchetype, order }) => {
  const questions = await query(
    `SELECT id, questionText, createdAt, updatedAt FROM questions ORDER BY id ${order}`
  );
  if (!questions.length) return [];

  const options = await query(
    `SELECT * FROM question_options WHERE question_id IN (?) ORDER BY question_id, position`,
    [questions.map((q) => q.id)]
  );

  const optionsByQuestion = new Map();
  for (const option of options) {
    const shaped = includeArchetype
      ? {
          _id: option.id,
          text: option.text,
          archetype: option.archetype_id,
          createdAt: option.createdAt,
          updatedAt: option.updatedAt,
        }
      : {
          text: option.text,
          createdAt: option.createdAt,
          updatedAt: option.updatedAt,
        };

    const bucket = optionsByQuestion.get(option.question_id);
    if (bucket) bucket.push(shaped);
    else optionsByQuestion.set(option.question_id, [shaped]);
  }

  return questions.map((q) => ({
    _id: q.id,
    questionText: q.questionText,
    options: optionsByQuestion.get(q.id) || [],
  }));
};

const getQuestionById = async (id) => {
  const question = await queryOne(`SELECT * FROM questions WHERE id = ?`, [id]);
  if (!question) return null;

  const options = await query(
    `SELECT * FROM question_options WHERE question_id = ? ORDER BY position`,
    [id]
  );

  return {
    _id: question.id,
    questionText: question.questionText,
    options: options.map((o) => ({
      _id: o.id,
      text: o.text,
      archetype: o.archetype_id,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    })),
  };
};

const getQuestion = async () =>
  loadQuestions({ includeArchetype: true, order: "ASC" });

/** Quiz-facing list: newest first, with the answer key stripped out. */
const getQuizQuestion = async () =>
  loadQuestions({ includeArchetype: false, order: "DESC" });

/** The selected option for one submitted answer, plus its archetype. */
const findAnsweredOption = async (questionId, answer) =>
  queryOne(
    `SELECT q.questionText,
            o.text        AS optionText,
            a.id          AS archetype_id,
            a.title       AS archetype_title,
            a.color       AS archetype_color
       FROM question_options o
       JOIN questions  q ON q.id = o.question_id
       JOIN archetypes a ON a.id = o.archetype_id
      WHERE o.question_id = ? AND TRIM(o.text) = TRIM(?)
      ORDER BY o.position
      LIMIT 1`,
    [String(questionId), String(answer)]
  );

/**
 * Sums the scores of every archetype belonging to the same cluster, so ties
 * between archetypes can be broken by which cluster the answers leaned toward.
 */
const calculateClusterInfo = async (archetypeScores) => {
  const allClusterScoreInfo = {};

  for (const [archetypeId, score] of Object.entries(archetypeScores)) {
    const clusterId = await clusterServices.findClusterIdByArchetype(archetypeId);
    if (!clusterId) {
      console.error(`No cluster found for archetype ${archetypeId}`);
      continue;
    }

    if (allClusterScoreInfo[clusterId]) {
      allClusterScoreInfo[clusterId].score += score;
      allClusterScoreInfo[clusterId].archetype_id.push(archetypeId);
    } else {
      allClusterScoreInfo[clusterId] = {
        cluster_id: clusterId,
        archetype_id: [archetypeId],
        score,
      };
    }
  }

  return allClusterScoreInfo;
};

const calculateResult = async (data) => {
  const archetypeScores = {}; // archetype id -> number of answers pointing at it
  const firstAppearanceIndex = {}; // archetype id -> index of the first such answer
  let finalArchetypes = [];

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const matched = await findAnsweredOption(entry.question_id, entry.answer);
    if (!matched) continue;

    const archetypeId = matched.archetype_id;
    archetypeScores[archetypeId] = (archetypeScores[archetypeId] || 0) + 1;

    if (!(archetypeId in firstAppearanceIndex)) {
      firstAppearanceIndex[archetypeId] = i;
    }
  }

  // Highest score wins; an earlier first answer breaks a tie.
  const sortedArchetypes = Object.entries(archetypeScores)
    .map(([id, score]) => ({ id, score, firstIndex: firstAppearanceIndex[id] }))
    .sort((a, b) =>
      b.score === a.score ? a.firstIndex - b.firstIndex : b.score - a.score
    );

  const topArchetypes = sortedArchetypes.slice(0, 3);

  if (topArchetypes.length < 2) {
    throw new Error("Not enough archetypes to determine results.");
  }

  const [first, second, third] = topArchetypes;

  if (third && second.score === third.score) {
    if (first.score === second.score) {
      // Three-way tie: rank the three by the total score of their cluster.
      const allClusterInfo = await calculateClusterInfo(archetypeScores);

      const clusterScores = await Promise.all(
        [
          ["first", first],
          ["second", second],
          ["third", third],
        ].map(async ([label, archetype]) => {
          const clusterId = await clusterServices.findClusterIdByArchetype(
            archetype.id
          );
          return [label, allClusterInfo[clusterId]?.score ?? 0];
        })
      );

      clusterScores.sort((a, b) => b[1] - a[1]);

      const byLabel = { first, second, third };
      finalArchetypes = clusterScores
        .slice(0, 2)
        .map(([label]) => byLabel[label].id);
    } else {
      // Only 2nd and 3rd are tied: the one from the stronger cluster joins 1st.
      const allClusterInfo = await calculateClusterInfo(archetypeScores);
      const sid = await clusterServices.findClusterIdByArchetype(second.id);
      const tid = await clusterServices.findClusterIdByArchetype(third.id);

      if (sid === tid) {
        finalArchetypes = [second.id, third.id];
      } else {
        const secondClusterScore = allClusterInfo[sid]?.score ?? 0;
        const thirdClusterScore = allClusterInfo[tid]?.score ?? 0;

        finalArchetypes =
          thirdClusterScore > secondClusterScore
            ? [first.id, third.id]
            : [first.id, second.id];
      }
    }
  } else {
    // No clash, return top 2 archetypes
    finalArchetypes = [first.id, second.id];
  }

  const archedata = finalArchetypes.length
    ? await query(
        `SELECT id AS _id, title, image, color, isLeft FROM archetypes WHERE id IN (?)`,
        [finalArchetypes]
      ).then((rows) => {
        const byId = new Map(rows.map((r) => [r._id, r]));
        return finalArchetypes
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map((r) => ({ ...r, isLeft: Boolean(r.isLeft) }));
      })
    : [];

  const pdf = await pdfServices.findByArchetypes(finalArchetypes);

  const finalCluster = [];
  for (const id of finalArchetypes) {
    const clusterId = await clusterServices.findClusterIdByArchetype(id);
    if (clusterId && !finalCluster.includes(clusterId)) {
      finalCluster.push(clusterId);
    }
  }

  const description = await combinationServices.findDescriptionByClusters(
    finalCluster
  );

  return { archetypes: finalArchetypes, archedata, pdf, description };
};

const quizServices = {
  createQuestion,
  getQuestion,
  getQuizQuestion,
  getQuestionById,
  calculateResult,
};
export default quizServices;
