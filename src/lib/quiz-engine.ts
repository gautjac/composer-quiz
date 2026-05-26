import {
  COMPOSERS,
  PERIODS,
  type Composer,
  getPeriodById,
} from "./composers";
import { getCachedAudio } from "./audio-cache";
import {
  type AudioRecord,
  type DescriptionRecord,
  type QuizMode,
  type UserProgress,
  getComposerWeight,
  slugify,
} from "./storage";

export interface QuizQuestion {
  mode: QuizMode;
  audio?: AudioRecord;
  description?: DescriptionRecord;
  composerChoices: Composer[];
  periodChoices: { id: string; name: string }[];
  correctComposer: Composer;
  correctPeriod: { id: string; name: string };
}

export function selectComposersForQuiz(
  progress: UserProgress,
  mode: QuizMode,
  count = 10
): Composer[] {
  // In listen mode we can only pick composers with cached audio.
  const eligible = COMPOSERS.filter((c) => {
    if (mode === "listen") return getCachedAudio(c.id) !== null;
    return c.descriptionPrompts.length > 0;
  });

  const weighted = eligible.map((composer) => ({
    composer,
    weight: getComposerWeight(progress, composer.id).weight,
  }));

  const selected: Composer[] = [];
  const pool = [...weighted];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (let j = 0; j < pool.length; j++) {
      random -= pool[j].weight;
      if (random <= 0) {
        selected.push(pool[j].composer);
        pool.splice(j, 1);
        break;
      }
    }
  }

  return selected;
}

export function buildAudioForComposer(composer: Composer): AudioRecord | null {
  const cached = getCachedAudio(composer.id);
  if (!cached) return null;
  return {
    id: `${composer.id}-audio-${slugify(cached.workTitle)}`,
    composerId: composer.id,
    composerName: composer.name,
    workTitle: cached.workTitle,
    workYear: cached.workYear,
    artistName: cached.artistName,
    audioUrl: cached.audioUrl,
    sourcePage: cached.sourcePage,
    license: cached.license,
    durationSeconds: cached.durationSeconds,
  };
}

export function buildDescriptionForComposer(
  composer: Composer,
  seenIds: Set<string>
): DescriptionRecord | null {
  if (composer.descriptionPrompts.length === 0) return null;

  const candidates = composer.descriptionPrompts
    .map((prompt, idx) => ({
      id: `${composer.id}-describe-${idx}`,
      prompt,
    }))
    .filter((c) => !seenIds.has(c.id));

  const chosen =
    candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : {
          id: `${composer.id}-describe-${Math.floor(
            Math.random() * composer.descriptionPrompts.length
          )}`,
          prompt:
            composer.descriptionPrompts[
              Math.floor(Math.random() * composer.descriptionPrompts.length)
            ],
        };

  return {
    id: chosen.id,
    composerId: composer.id,
    composerName: composer.name,
    prompt: chosen.prompt,
  };
}

export function generateListenQuestions(
  composers: Composer[],
  count: number,
  heardAudioIds: string[] = []
): QuizQuestion[] {
  const seenSet = new Set(heardAudioIds);
  const questions: QuizQuestion[] = [];

  // Prefer unheard audio first.
  const withAudio = composers
    .map((c) => ({ c, audio: buildAudioForComposer(c) }))
    .filter((x): x is { c: Composer; audio: AudioRecord } => x.audio !== null);

  const unheard = withAudio.filter((x) => !seenSet.has(x.audio.id));
  const heard = withAudio.filter((x) => seenSet.has(x.audio.id));
  const ordered = [...unheard, ...heard];

  for (const { c, audio } of ordered) {
    if (questions.length >= count) break;
    const period = getPeriodById(c.period);
    if (!period) continue;

    const wrongComposers = generateWrongComposerChoices(c, 3);
    const composerChoices = shuffle([c, ...wrongComposers]);

    const wrongPeriods = generateWrongPeriodChoices(period.id, 3);
    const periodChoices = shuffle([
      { id: period.id, name: period.name },
      ...wrongPeriods,
    ]);

    questions.push({
      mode: "listen",
      audio,
      composerChoices,
      periodChoices,
      correctComposer: c,
      correctPeriod: { id: period.id, name: period.name },
    });
  }

  return shuffle(questions).slice(0, count);
}

export function generateDescribeQuestions(
  composers: Composer[],
  count: number,
  seenDescriptionIds: string[] = []
): QuizQuestion[] {
  const seenSet = new Set(seenDescriptionIds);
  const questions: QuizQuestion[] = [];

  for (const c of composers) {
    if (questions.length >= count) break;
    const description = buildDescriptionForComposer(c, seenSet);
    if (!description) continue;
    const period = getPeriodById(c.period);
    if (!period) continue;

    const wrongComposers = generateWrongComposerChoices(c, 3);
    const composerChoices = shuffle([c, ...wrongComposers]);

    const wrongPeriods = generateWrongPeriodChoices(period.id, 3);
    const periodChoices = shuffle([
      { id: period.id, name: period.name },
      ...wrongPeriods,
    ]);

    questions.push({
      mode: "describe",
      description,
      composerChoices,
      periodChoices,
      correctComposer: c,
      correctPeriod: { id: period.id, name: period.name },
    });
  }

  return shuffle(questions).slice(0, count);
}

function generateWrongComposerChoices(correct: Composer, count: number): Composer[] {
  const candidates = COMPOSERS.filter((c) => c.id !== correct.id);

  const samePeriod = candidates.filter((c) => c.period === correct.period);
  const sameEra = candidates.filter((c) => c.era === correct.era);
  const sameForm = candidates.filter((c) => c.primaryForm === correct.primaryForm);

  // Plausible distractors: same period > same era > same form.
  const preferred = [
    ...new Set([...samePeriod, ...sameEra, ...sameForm]),
  ];
  const others = candidates.filter((c) => !preferred.includes(c));

  const pool = preferred.length >= count ? preferred : [...preferred, ...others];
  return shuffle(pool).slice(0, count);
}

function generateWrongPeriodChoices(
  correctPeriodId: string,
  count: number
): { id: string; name: string }[] {
  const wrong = PERIODS.filter((p) => p.id !== correctPeriodId);
  return shuffle(wrong)
    .slice(0, count)
    .map((p) => ({ id: p.id, name: p.name }));
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
