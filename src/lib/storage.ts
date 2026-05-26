// Local storage wrapper for quiz progress and spaced repetition.

export type QuizMode = "listen" | "describe";

export interface AudioRecord {
  // Stable id for dedupe / "have I heard this before?"
  id: string; // "{composerId}-audio-{titleSlug}"
  composerId: string;
  composerName: string;
  workTitle: string;
  workYear: number | null;
  audioUrl: string;
  sourcePage: string;
  license: string;
  // Approximate duration; nullable because not every source provides it.
  durationSeconds: number | null;
}

export interface DescriptionRecord {
  id: string; // "{composerId}-describe-{index}"
  composerId: string;
  composerName: string;
  prompt: string;
}

export interface QuizAttempt {
  date: string;
  mode: QuizMode;
  itemId: string;
  composerId: string;
  composerCorrect: boolean;
  periodCorrect: boolean;
}

export interface DailyQuizResult {
  date: string;
  mode: QuizMode;
  totalQuestions: number;
  composerCorrect: number;
  periodCorrect: number;
  attempts: QuizAttempt[];
}

export interface ComposerWeight {
  composerId: string;
  weight: number;
  timesShown: number;
  timesComposerCorrect: number;
  timesPeriodCorrect: number;
  lastShown: string | null;
}

export interface UserProgress {
  streak: number;
  lastQuizDate: string | null;
  totalQuizzes: number;
  preferredMode: QuizMode;
  composerWeights: Record<string, ComposerWeight>;
  quizHistory: DailyQuizResult[];
  heardAudio: string[];
  seenDescriptions: string[];
}

const STORAGE_KEY = "composer-quiz-progress";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getProgress(): UserProgress {
  if (!isBrowser()) return defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return { ...defaultProgress(), ...parsed };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function defaultProgress(): UserProgress {
  return {
    streak: 0,
    lastQuizDate: null,
    totalQuizzes: 0,
    preferredMode: "listen",
    composerWeights: {},
    quizHistory: [],
    heardAudio: [],
    seenDescriptions: [],
  };
}

export function getComposerWeight(
  progress: UserProgress,
  composerId: string
): ComposerWeight {
  return (
    progress.composerWeights[composerId] || {
      composerId,
      weight: 5,
      timesShown: 0,
      timesComposerCorrect: 0,
      timesPeriodCorrect: 0,
      lastShown: null,
    }
  );
}

export function updateWeightAfterAttempt(
  progress: UserProgress,
  composerId: string,
  composerCorrect: boolean,
  periodCorrect: boolean
): void {
  const w = getComposerWeight(progress, composerId);
  w.timesShown++;
  if (composerCorrect) w.timesComposerCorrect++;
  if (periodCorrect) w.timesPeriodCorrect++;
  w.lastShown = new Date().toISOString();

  if (composerCorrect && periodCorrect) {
    w.weight = Math.max(1, w.weight - 1);
  } else if (!composerCorrect && !periodCorrect) {
    w.weight = Math.min(10, w.weight + 2);
  } else {
    w.weight = Math.min(10, w.weight + 1);
  }

  progress.composerWeights[composerId] = w;
}

export function updateStreak(progress: UserProgress): void {
  const today = new Date().toISOString().split("T")[0];
  if (progress.lastQuizDate === today) return;

  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];
  if (progress.lastQuizDate === yesterday) {
    progress.streak++;
  } else {
    progress.streak = 1;
  }
  progress.lastQuizDate = today;
  progress.totalQuizzes++;
}

export function hasQuizzedToday(progress: UserProgress): boolean {
  const today = new Date().toISOString().split("T")[0];
  return progress.lastQuizDate === today;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}
