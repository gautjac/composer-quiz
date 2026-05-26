"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getComposerById, getPeriodForComposer } from "@/lib/composers";

export default function ComposerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [composerId, setComposerId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setComposerId(p.id));
  }, [params]);

  const composer = composerId ? getComposerById(composerId) : null;
  const period = composer ? getPeriodForComposer(composer) : null;

  if (!composerId) {
    return (
      <div className="min-h-screen bg-vellum flex items-center justify-center">
        <div className="w-16 h-20 shimmer rounded" />
      </div>
    );
  }

  if (!composer) {
    return (
      <div className="min-h-screen bg-vellum">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl mb-4">Composer not found</h1>
          <Link href="/" className="text-rubric-dark hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="relative max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <Link
            href={period ? `/period/${period.id}` : "/"}
            className="text-vellum/60 hover:text-vellum text-sm transition-colors mb-4 inline-block"
          >
            &larr; {period ? period.name : "Home"}
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-0.5 bg-rubric" />
            <span className="text-rubric text-xs uppercase tracking-[0.2em] font-medium">
              {composer.nationality} &middot; {composer.birthYear}
              {composer.deathYear ? `–${composer.deathYear}` : "–present"}
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl text-vellum mb-3"
            style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}
          >
            {composer.name}
          </h1>
          <p className="text-vellum/70 max-w-lg text-base leading-relaxed">
            {composer.bio}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="library-card p-5 sm:p-6">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-3">
            Signature works
          </p>
          <ul className="works-list">
            {composer.signatureWorks.map((w, i) => (
              <li key={i}>
                <span className="work-year">{w.year ?? "—"}</span>
                <span className="work-title">{w.title}</span>
                <span className="work-form">{w.form}</span>
              </li>
            ))}
          </ul>
        </div>

        {period && (
          <div className="library-card p-5 sm:p-6">
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
              Period
            </p>
            <Link
              href={`/period/${period.id}`}
              className="text-lg font-medium hover:text-rubric-dark transition-colors block mb-1"
            >
              {period.name}
            </Link>
            <p className="text-xs text-ink-muted mb-3">{period.dates}</p>
            <p className="text-sm text-ink-light leading-relaxed">
              {period.description}
            </p>
          </div>
        )}

        <div className="pt-4 pb-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-ink text-vellum rounded-lg font-medium hover:bg-spine transition-colors cursor-pointer"
          >
            &larr; Back to home
          </button>
        </div>
      </main>
    </div>
  );
}
