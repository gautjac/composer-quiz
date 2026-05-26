"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPeriodById } from "@/lib/periods";
import { getComposersByPeriod } from "@/lib/composers";

export default function PeriodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [periodId, setPeriodId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setPeriodId(p.id));
  }, [params]);

  const period = periodId ? getPeriodById(periodId) : null;
  const composers = periodId ? getComposersByPeriod(periodId) : [];

  if (!periodId) {
    return (
      <div className="min-h-screen bg-vellum flex items-center justify-center">
        <div className="w-16 h-20 shimmer rounded" />
      </div>
    );
  }

  if (!period) {
    return (
      <div className="min-h-screen bg-vellum">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl mb-4">Period not found</h1>
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
            href="/"
            className="text-vellum/60 hover:text-vellum text-sm transition-colors mb-4 inline-block"
          >
            &larr; Back to home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-0.5 bg-rubric" />
            <span className="text-rubric text-xs uppercase tracking-[0.2em] font-medium">
              {period.dates}
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl text-vellum mb-3"
            style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}
          >
            {period.name}
          </h1>
          <p className="text-vellum/70 max-w-lg text-base leading-relaxed">
            {period.description}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <div className="library-card p-5 sm:p-6">
          <p className="text-ink-light leading-relaxed text-[15px]">
            {period.longDescription}
          </p>
        </div>

        <div>
          <h2 className="text-xl mb-4">
            {composers.length === 1 ? "Featured composer" : "Key composers"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {composers.map((c) => (
              <Link
                key={c.id}
                href={`/composer/${c.id}`}
                className="library-card p-4 block group"
              >
                <h3 className="font-medium mb-0.5 group-hover:text-rubric-dark transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-rubric-dark mb-1.5">
                  {c.nationality}, {c.birthYear}
                  {c.deathYear ? `–${c.deathYear}` : "–present"} &middot; {c.primaryForm}
                </p>
                <p className="text-sm text-ink-light leading-relaxed">{c.bio}</p>
              </Link>
            ))}
          </div>
        </div>

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
