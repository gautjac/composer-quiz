"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProgress,
  saveProgress,
  hasQuizzedToday,
  type UserProgress,
  type QuizMode,
} from "@/lib/storage";
import { COMPOSERS, PERIODS, getPeriodById } from "@/lib/composers";
import ProgressRing from "@/components/ProgressRing";

export default function HomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<QuizMode>("listen");

  useEffect(() => {
    const p = getProgress();
    setProgress(p);
    setMode(p.preferredMode);
    setMounted(true);
  }, []);

  function switchMode(next: QuizMode) {
    setMode(next);
    if (progress) {
      const updated = { ...progress, preferredMode: next };
      saveProgress(updated);
      setProgress(updated);
    }
  }

  function startQuiz() {
    router.push(`/quiz?mode=${mode}`);
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-vellum flex items-center justify-center">
        <div className="w-16 h-20 shimmer rounded" />
      </div>
    );
  }

  const quizzedToday = progress ? hasQuizzedToday(progress) : false;
  const totalComposers = COMPOSERS.length;
  const seenComposers = progress
    ? new Set(
        progress.quizHistory.flatMap((q) => q.attempts.map((a) => a.composerId))
      ).size
    : 0;
  const totalQuizzes = progress?.totalQuizzes || 0;

  const totalAttempts = progress
    ? progress.quizHistory.reduce((sum, q) => sum + q.attempts.length, 0)
    : 0;
  const totalCorrectComposer = progress
    ? progress.quizHistory.reduce((sum, q) => sum + q.composerCorrect, 0)
    : 0;
  const totalCorrectPeriod = progress
    ? progress.quizHistory.reduce((sum, q) => sum + q.periodCorrect, 0)
    : 0;
  const overallAccuracy =
    totalAttempts > 0
      ? Math.round(
          ((totalCorrectComposer + totalCorrectPeriod) / (totalAttempts * 2)) *
            100
        )
      : 0;

  const lastQuiz =
    progress && progress.quizHistory.length > 0
      ? progress.quizHistory[progress.quizHistory.length - 1]
      : null;

  const periodStats: Record<string, { correct: number; total: number }> = {};
  if (progress) {
    for (const quiz of progress.quizHistory) {
      for (const attempt of quiz.attempts) {
        const composer = COMPOSERS.find((c) => c.id === attempt.composerId);
        if (!composer) continue;
        if (!periodStats[composer.period]) {
          periodStats[composer.period] = { correct: 0, total: 0 };
        }
        periodStats[composer.period].total++;
        if (attempt.periodCorrect) periodStats[composer.period].correct++;
      }
    }
  }

  const periodEntries = Object.entries(periodStats)
    .map(([id, stats]) => ({
      period: getPeriodById(id),
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total,
    }))
    .filter((e) => e.period)
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="min-h-screen bg-vellum">
      <header className="relative overflow-hidden bg-spine text-vellum">
        <div className="absolute inset-0 opacity-[0.06]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(246,241,232,0.4) 4px, rgba(246,241,232,0.4) 5px)",
            }}
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-0.5 bg-rubric" />
            <span className="text-rubric text-xs uppercase tracking-[0.2em] font-medium">
              Daily Classical Music Quiz
            </span>
          </div>
          <h1
            className="text-5xl sm:text-6xl mb-3 text-vellum"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
          >
            Cadenza
          </h1>
          <p className="text-vellum/70 max-w-md text-base leading-relaxed">
            Learn the canon of Western classical music. From Hildegard to
            Pärt — ten periods, fifty composers, their signature works,
            recordings courtesy of Wikimedia Commons.
          </p>

          {progress && progress.streak > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
              <span className="streak-flame">&#128293;</span>
              <span className="text-sm text-vellum/90 font-medium">
                {progress.streak} day streak
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="mode-toggle">
            <button
              className={`mode-toggle-option ${mode === "listen" ? "active" : ""}`}
              onClick={() => switchMode("listen")}
            >
              Listen mode
            </button>
            <button
              className={`mode-toggle-option ${mode === "describe" ? "active" : ""}`}
              onClick={() => switchMode("describe")}
            >
              Describe mode
            </button>
          </div>
          <p className="text-xs text-ink-muted text-center max-w-md">
            {mode === "listen"
              ? "Play a recording from Wikimedia Commons. Identify the composer and their period."
              : "Read a stylistic fingerprint of a composer. Identify the composer and their period."}
          </p>
        </div>

        <div
          className="library-card p-6 cursor-pointer group"
          onClick={startQuiz}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {quizzedToday && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-correct-light text-correct font-medium">
                    Completed today
                  </span>
                )}
              </div>
              <h2 className="text-2xl mb-1 group-hover:text-rubric-dark transition-colors">
                {quizzedToday ? "Practice Again" : "Today's Quiz"}
              </h2>
              <p className="text-ink-muted text-sm">
                10 {mode === "listen" ? "recordings" : "descriptions"} &middot; ~10 minutes &middot; Composer + Period
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-ink flex items-center justify-center group-hover:bg-spine transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-vellum" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>

        {totalQuizzes > 0 && (
          <div>
            <h2 className="text-xl mb-4">Your progress</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="library-card p-4 text-center">
                <p className="text-2xl font-semibold text-ink">{totalQuizzes}</p>
                <p className="text-xs text-ink-muted mt-1">Quizzes taken</p>
              </div>
              <div className="library-card p-4 text-center">
                <p className="text-2xl font-semibold text-ink">
                  {seenComposers}/{totalComposers}
                </p>
                <p className="text-xs text-ink-muted mt-1">Composers heard</p>
              </div>
              <div className="library-card p-4 text-center">
                <p className="text-2xl font-semibold text-ink">{overallAccuracy}%</p>
                <p className="text-xs text-ink-muted mt-1">Accuracy</p>
              </div>
              <div className="library-card p-4 text-center">
                <p className="text-2xl font-semibold text-ink">
                  {(progress?.heardAudio.length || 0) +
                    (progress?.seenDescriptions.length || 0)}
                </p>
                <p className="text-xs text-ink-muted mt-1">Items studied</p>
              </div>
            </div>
          </div>
        )}

        {lastQuiz && (
          <div>
            <h2 className="text-xl mb-4">Last quiz</h2>
            <div className="library-card p-5">
              <div className="flex items-center gap-6">
                <ProgressRing
                  progress={Math.round(
                    ((lastQuiz.composerCorrect + lastQuiz.periodCorrect) /
                      (lastQuiz.totalQuestions * 2)) *
                      100
                  )}
                  size={80}
                  strokeWidth={6}
                />
                <div className="flex-1">
                  <p className="text-sm text-ink-light">
                    <strong className="text-ink">
                      {lastQuiz.composerCorrect}/{lastQuiz.totalQuestions}
                    </strong>{" "}
                    composers correct
                  </p>
                  <p className="text-sm text-ink-light">
                    <strong className="text-ink">
                      {lastQuiz.periodCorrect}/{lastQuiz.totalQuestions}
                    </strong>{" "}
                    periods correct
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    {lastQuiz.date} &middot; {lastQuiz.mode} mode
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {periodEntries.length > 0 && (
          <div>
            <h2 className="text-xl mb-4">Period mastery</h2>
            <div className="library-card p-4">
              <div className="space-y-3">
                {periodEntries.map((entry) => (
                  <div key={entry.period!.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          href={`/period/${entry.period!.id}`}
                          className="text-sm font-medium truncate hover:text-rubric-dark transition-colors"
                        >
                          {entry.period!.name}
                        </Link>
                        <span className="text-xs text-ink-muted ml-2 flex-shrink-0">
                          {entry.accuracy}% ({entry.total} seen)
                        </span>
                      </div>
                      <div className="h-1.5 bg-vellum-dark rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${entry.accuracy}%`,
                            backgroundColor:
                              entry.accuracy >= 70
                                ? "#2f6b3e"
                                : entry.accuracy >= 40
                                  ? "#5d3145"
                                  : "#b13b29",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl mb-4">
            {totalQuizzes === 0 ? "What you'll learn" : "Browse periods"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PERIODS.map((p) => (
              <Link
                key={p.id}
                href={`/period/${p.id}`}
                className="library-card p-3 group block"
              >
                <p className="text-sm font-medium mb-0.5 group-hover:text-rubric-dark transition-colors">
                  {p.name}
                </p>
                <p className="text-xs text-ink-muted">{p.dates}</p>
              </Link>
            ))}
          </div>
        </div>

        <footer className="text-center py-8 border-t border-vellum-dark">
          <p className="text-xs text-ink-muted">
            Recordings courtesy of Wikimedia Commons &middot; Signature works compiled from the standard repertoire.
          </p>
          <p className="text-xs text-ink-muted mt-1">
            {`${totalComposers} composers · ${PERIODS.length} periods · Hildegard to Pärt`}
          </p>
        </footer>
      </main>
    </div>
  );
}
