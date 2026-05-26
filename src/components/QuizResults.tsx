"use client";

import ProgressRing from "./ProgressRing";
import type { QuizQuestion } from "@/lib/quiz-engine";
import type { QuizMode } from "@/lib/storage";

interface AttemptResult {
  question: QuizQuestion;
  composerCorrect: boolean;
  periodCorrect: boolean;
}

interface QuizResultsProps {
  mode: QuizMode;
  results: AttemptResult[];
  streak: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export default function QuizResults({
  mode,
  results,
  streak,
  onPlayAgain,
  onGoHome,
}: QuizResultsProps) {
  const totalComposer = results.filter((r) => r.composerCorrect).length;
  const totalPeriod = results.filter((r) => r.periodCorrect).length;
  const totalPerfect = results.filter(
    (r) => r.composerCorrect && r.periodCorrect
  ).length;
  const total = results.length;

  const overallPercent = Math.round(
    ((totalComposer + totalPeriod) / (total * 2)) * 100
  );
  const composerPercent = Math.round((totalComposer / total) * 100);
  const periodPercent = Math.round((totalPeriod / total) * 100);

  let message = "";
  if (overallPercent >= 90) message = "A perfect ear.";
  else if (overallPercent >= 70) message = "The repertoire is opening up.";
  else if (overallPercent >= 50) message = "Coming into focus.";
  else message = "Every Mahler listener was once a Mahler novice.";

  return (
    <div className="animate-fade-in-scale max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl mb-2">Quiz Complete</h1>
        <p className="text-ink-muted italic">{message}</p>
        {streak > 1 && (
          <p className="mt-2 text-rubric-dark font-medium">
            <span className="streak-flame">&#128293;</span> {streak} day streak
          </p>
        )}
      </div>

      <div className="flex justify-center gap-8 mb-8">
        <ProgressRing
          progress={composerPercent}
          label="Composers"
          sublabel={`${totalComposer}/${total}`}
        />
        <ProgressRing
          progress={periodPercent}
          label="Periods"
          sublabel={`${totalPeriod}/${total}`}
        />
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-vellum-dark">
          <span className="text-rubric text-lg">&#9733;</span>
          <span className="text-sm text-ink-light">
            <strong>{totalPerfect}</strong> perfect answers out of {total}
          </span>
        </div>
      </div>

      <div className="library-card p-4 mb-6">
        <h3 className="text-sm font-medium text-ink-muted uppercase tracking-wide mb-3">
          Breakdown &middot; {mode} mode
        </h3>
        <div className="space-y-2">
          {results.map((result, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 border-b border-vellum-dark last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {result.question.correctComposer.name}
                </p>
                <p className="text-xs text-ink-muted truncate italic">
                  {result.question.mode === "listen"
                    ? (result.question.audio?.workTitle ?? "—")
                    : (result.question.description?.prompt?.slice(0, 60) ?? "—")}
                  {result.question.mode === "describe" &&
                  result.question.description &&
                  result.question.description.prompt.length > 60
                    ? "…"
                    : ""}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    result.composerCorrect
                      ? "bg-correct-light text-correct"
                      : "bg-wrong-light text-wrong"
                  }`}
                >
                  {result.composerCorrect ? "✓" : "✗"}
                </span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    result.periodCorrect
                      ? "bg-correct-light text-correct"
                      : "bg-wrong-light text-wrong"
                  }`}
                >
                  {result.periodCorrect ? "✓" : "✗"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onGoHome}
          className="flex-1 py-3.5 bg-white border-2 border-vellum-dark text-ink rounded-lg font-medium hover:border-rubric transition-colors cursor-pointer"
        >
          Home
        </button>
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3.5 bg-ink text-vellum rounded-lg font-medium hover:bg-spine transition-colors cursor-pointer"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
