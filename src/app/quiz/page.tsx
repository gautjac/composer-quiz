"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  selectComposersForQuiz,
  generateListenQuestions,
  generateDescribeQuestions,
  type QuizQuestion,
} from "@/lib/quiz-engine";
import {
  getProgress,
  saveProgress,
  updateWeightAfterAttempt,
  updateStreak,
  type DailyQuizResult,
  type QuizAttempt,
  type QuizMode,
} from "@/lib/storage";
import QuizResults from "@/components/QuizResults";
import AudioPlayer from "@/components/AudioPlayer";
import { getPeriodById, type Composer } from "@/lib/composers";

type PageState = "loading" | "playing" | "results" | "error";
type Phase = "composer" | "period" | "reveal";

interface AttemptResult {
  question: QuizQuestion;
  composerCorrect: boolean;
  periodCorrect: boolean;
}

const QUIZ_SIZE = 10;

function QuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode: QuizMode =
    searchParams.get("mode") === "describe" ? "describe" : "listen";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(
    "Tuning the orchestra..."
  );

  const [phase, setPhase] = useState<Phase>("composer");
  const [selectedComposer, setSelectedComposer] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [composerCorrect, setComposerCorrect] = useState(false);
  const [periodCorrect, setPeriodCorrect] = useState(false);

  const question = questions[currentIndex] ?? null;
  const period = question
    ? getPeriodById(question.correctComposer.period)
    : null;

  const loadQuiz = useCallback(async () => {
    setPageState("loading");
    setCurrentIndex(0);
    setResults([]);
    setPhase("composer");
    setSelectedComposer(null);
    setSelectedPeriod(null);
    setComposerCorrect(false);
    setPeriodCorrect(false);

    const messages =
      mode === "listen"
        ? [
            "Tuning the orchestra...",
            "Pulling scores from the library...",
            "Polishing the brass...",
            "Choosing today's recordings...",
          ]
        : [
            "Composing the prompts...",
            "Distilling the signatures...",
            "Selecting today's fingerprints...",
          ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 2000);

    try {
      const progress = getProgress();
      const composers = selectComposersForQuiz(progress, mode, QUIZ_SIZE + 5);

      let quizQuestions: QuizQuestion[];
      if (mode === "listen") {
        quizQuestions = generateListenQuestions(
          composers,
          QUIZ_SIZE,
          progress.heardAudio
        );
      } else {
        quizQuestions = generateDescribeQuestions(
          composers,
          QUIZ_SIZE,
          progress.seenDescriptions
        );
      }

      if (quizQuestions.length === 0) {
        setLoadingMessage(
          mode === "listen"
            ? "No recordings available. Try describe mode instead."
            : "Could not assemble a quiz. Try again in a moment..."
        );
        setPageState("error");
        return;
      }

      setQuestions(quizQuestions);
      setPageState("playing");
    } catch (err) {
      console.error("Failed to load quiz:", err);
      setLoadingMessage("Something went wrong. Try again in a moment...");
      setPageState("error");
    } finally {
      clearInterval(msgInterval);
    }
  }, [mode]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  function handleComposerChoice(composer: Composer) {
    if (selectedComposer || !question) return;
    const correct = composer.id === question.correctComposer.id;
    setSelectedComposer(composer.id);
    setComposerCorrect(correct);
  }

  function handlePeriodChoice(periodId: string) {
    if (selectedPeriod || !question) return;
    const correct = periodId === question.correctPeriod.id;
    setSelectedPeriod(periodId);
    setPeriodCorrect(correct);
  }

  function advanceToPeriod() {
    setPhase("period");
  }

  function advanceToReveal() {
    setPhase("reveal");
  }

  function advanceToNext() {
    if (!question) return;

    const progress = getProgress();
    updateWeightAfterAttempt(
      progress,
      question.correctComposer.id,
      composerCorrect,
      periodCorrect
    );

    const newResult: AttemptResult = { question, composerCorrect, periodCorrect };
    const newResults = [...results, newResult];
    setResults(newResults);

    if (currentIndex + 1 >= questions.length) {
      updateStreak(progress);
      setStreak(progress.streak);

      const dailyResult: DailyQuizResult = {
        date: new Date().toISOString().split("T")[0],
        mode,
        totalQuestions: questions.length,
        composerCorrect: newResults.filter((r) => r.composerCorrect).length,
        periodCorrect: newResults.filter((r) => r.periodCorrect).length,
        attempts: newResults.map(
          (r): QuizAttempt => ({
            date: new Date().toISOString(),
            mode,
            itemId:
              r.question.mode === "listen"
                ? r.question.audio!.id
                : r.question.description!.id,
            composerId: r.question.correctComposer.id,
            composerCorrect: r.composerCorrect,
            periodCorrect: r.periodCorrect,
          })
        ),
      };
      progress.quizHistory.push(dailyResult);

      for (const r of newResults) {
        if (r.question.mode === "listen") {
          if (!progress.heardAudio.includes(r.question.audio!.id)) {
            progress.heardAudio.push(r.question.audio!.id);
          }
        } else {
          if (!progress.seenDescriptions.includes(r.question.description!.id)) {
            progress.seenDescriptions.push(r.question.description!.id);
          }
        }
      }

      saveProgress(progress);
      setPageState("results");
    } else {
      setPhase("composer");
      setSelectedComposer(null);
      setSelectedPeriod(null);
      setComposerCorrect(false);
      setPeriodCorrect(false);
      setCurrentIndex(currentIndex + 1);
    }
  }

  return (
    <div className="min-h-screen bg-vellum">
      <header className="border-b border-vellum-dark bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            &larr; Back
          </button>
          <h1
            className="text-lg tracking-tight"
            style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}
          >
            Cadenza
          </h1>
          <span className="text-xs text-ink-muted uppercase tracking-wider">
            {mode}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 sm:py-8">
        {pageState === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
            <div className="loading-passage shimmer w-72 h-48 rounded" />
            <p className="text-ink-muted text-sm mt-4 italic">{loadingMessage}</p>
          </div>
        )}

        {pageState === "error" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in text-center">
            <p className="text-ink-muted text-sm italic max-w-md">{loadingMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2 bg-white border-2 border-vellum-dark text-ink rounded-lg font-medium hover:border-rubric transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={loadQuiz}
                className="px-6 py-2 bg-ink text-vellum rounded-lg font-medium hover:bg-spine transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {pageState === "playing" && question && (
          <div>
            <div className="mb-4 sm:mb-6 flex items-center gap-3">
              <span className="text-sm text-ink-muted font-medium">
                {currentIndex + 1} / {questions.length}
              </span>
              <div className="flex-1 h-1.5 bg-vellum-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-rubric rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              {question.mode === "listen" && question.audio ? (
                <>
                  <div className="audio-card max-w-2xl mx-auto">
                    <p className="text-xs uppercase tracking-[0.2em] text-rubric mb-6">
                      Listen
                    </p>
                    <AudioPlayer
                      src={question.audio.audioUrl}
                      hintedDurationSeconds={question.audio.durationSeconds}
                    />
                  </div>
                  {phase === "reveal" && (
                    <div className="mt-4 text-center max-w-2xl mx-auto">
                      <p className="text-sm text-ink-muted italic">
                        from <span className="text-ink">{question.audio.workTitle}</span>
                      </p>
                      <a
                        href={question.audio.sourcePage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-ink-muted hover:text-rubric-dark underline-offset-2 hover:underline mt-0.5 inline-block"
                      >
                        Wikimedia Commons &middot; {question.audio.license} →
                      </a>
                    </div>
                  )}
                </>
              ) : (
                question.description && (
                  <div className="description-card max-w-2xl mx-auto">
                    <div>{question.description.prompt}</div>
                  </div>
                )
              )}
            </div>

            {phase === "composer" && (
              <div>
                <h2 className="text-lg sm:text-xl mb-3 sm:mb-4 text-center">
                  {question.mode === "listen"
                    ? "Whose music is this?"
                    : "Whose music is being described?"}
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-xl mx-auto">
                  {question.composerChoices.map((c) => {
                    let cls = "choice-btn";
                    if (selectedComposer) {
                      if (c.id === question.correctComposer.id) cls += " correct";
                      else if (c.id === selectedComposer) cls += " wrong";
                    }
                    return (
                      <button
                        key={c.id}
                        className={cls}
                        onClick={() => handleComposerChoice(c)}
                        disabled={!!selectedComposer}
                      >
                        <span className="font-medium text-sm sm:text-base">
                          {c.name}
                        </span>
                        <span className="block text-[10px] sm:text-xs text-ink-muted mt-0.5">
                          {c.nationality}, {c.birthYear}
                          {c.deathYear ? `–${c.deathYear}` : "–present"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedComposer && (
                  <div className="mt-4 text-center">
                    <p
                      className={`text-sm font-medium mb-3 ${
                        composerCorrect ? "text-correct" : "text-wrong"
                      }`}
                    >
                      {composerCorrect
                        ? "Correct."
                        : `It's ${question.correctComposer.name}.`}
                    </p>
                    <button
                      onClick={advanceToPeriod}
                      className="px-6 py-2 bg-ink text-vellum rounded-lg font-medium hover:bg-spine transition-colors cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {phase === "period" && (
              <div>
                <h2 className="text-lg sm:text-xl mb-3 text-center">
                  What period does{" "}
                  <span className="text-rubric-dark italic">
                    {question.correctComposer.name}
                  </span>{" "}
                  belong to?
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-xl mx-auto">
                  {question.periodChoices.map((p) => {
                    let cls = "choice-btn";
                    if (selectedPeriod) {
                      if (p.id === question.correctPeriod.id) cls += " correct";
                      else if (p.id === selectedPeriod) cls += " wrong";
                    }
                    return (
                      <button
                        key={p.id}
                        className={cls}
                        onClick={() => handlePeriodChoice(p.id)}
                        disabled={!!selectedPeriod}
                      >
                        <span className="font-medium text-sm sm:text-base">
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedPeriod && (
                  <div className="mt-4 text-center">
                    <p
                      className={`text-sm font-medium mb-3 ${
                        periodCorrect ? "text-correct" : "text-wrong"
                      }`}
                    >
                      {periodCorrect
                        ? "Correct."
                        : `The answer is ${question.correctPeriod.name}.`}
                    </p>
                    <button
                      onClick={advanceToReveal}
                      className="px-6 py-2 bg-ink text-vellum rounded-lg font-medium hover:bg-spine transition-colors cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {phase === "reveal" && (
              <div className="max-w-xl mx-auto">
                <div className="flex justify-center gap-4 mb-5">
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      composerCorrect
                        ? "bg-correct-light text-correct"
                        : "bg-wrong-light text-wrong"
                    }`}
                  >
                    Composer: {composerCorrect ? "Correct" : "Incorrect"}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      periodCorrect
                        ? "bg-correct-light text-correct"
                        : "bg-wrong-light text-wrong"
                    }`}
                  >
                    Period: {periodCorrect ? "Correct" : "Incorrect"}
                  </div>
                </div>

                <div className="library-card p-5 mb-6">
                  <h3 className="text-lg mb-1">
                    {question.correctComposer.name}
                  </h3>
                  <p className="text-sm text-rubric-dark font-medium mb-2">
                    {period?.name} · {period?.dates}
                  </p>
                  <p className="text-sm text-ink-light leading-relaxed mb-4">
                    {question.correctComposer.bio}
                  </p>

                  <div className="pt-4 border-t border-vellum-dark">
                    <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                      Signature works
                    </p>
                    <ul className="works-list">
                      {question.correctComposer.signatureWorks.map((w, i) => (
                        <li key={i}>
                          <span className="work-year">
                            {w.year ?? "—"}
                          </span>
                          <span className="work-title">{w.title}</span>
                          <span className="work-form">{w.form}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {period && (
                    <div className="pt-4 mt-4 border-t border-vellum-dark">
                      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
                        About the {period.name} period
                      </p>
                      <p className="text-sm text-ink-light leading-relaxed">
                        {period.description}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={advanceToNext}
                  className="w-full py-3.5 bg-ink text-vellum rounded-lg font-medium hover:bg-spine transition-colors cursor-pointer"
                >
                  {currentIndex + 1 === questions.length
                    ? "See Results"
                    : "Next"}
                </button>
              </div>
            )}
          </div>
        )}

        {pageState === "results" && (
          <QuizResults
            mode={mode}
            results={results}
            streak={streak}
            onPlayAgain={loadQuiz}
            onGoHome={() => router.push("/")}
          />
        )}
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-vellum flex items-center justify-center">
          <div className="w-16 h-20 shimmer rounded" />
        </div>
      }
    >
      <QuizPageInner />
    </Suspense>
  );
}
