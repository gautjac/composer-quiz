#!/usr/bin/env node
// Discover one Apple Music preview clip per composer via the public
// iTunes Search API and bake into src/data/audio.json.
//
// Strategy, per composer:
//   1. For each signature work, search the iTunes API for the composer +
//      work title. Filter to classical-genre results with a preview URL.
//   2. Score candidates (prefer Karajan / Berlin Phil / well-known
//      ensembles, prefer titles that mention the work's key terms).
//   3. Take the top hit; record its 30-second preview URL, the
//      performer's name, the track title, and a link to the iTunes
//      track page.
//   4. Checkpoint after every composer.
//
// Re-run any time COMPOSERS / signatureWorks change. Set FORCE_REBUILD=1
// to overwrite cached entries.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const USER_AGENT = "CadenzaQuizBuilder/1.0";
const COUNTRY = "US";
const SEARCH_LIMIT = 25;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Performers that produce high-quality canonical recordings. Hits on these
// get a score boost. Order is not significant.
const FAVORED_ARTISTS = [
  "Karajan",
  "Berlin Philharmonic",
  "Vienna Philharmonic",
  "Bernstein",
  "Boulez",
  "Solti",
  "Furtwängler",
  "Furtwangler",
  "Toscanini",
  "Klemperer",
  "Abbado",
  "Rattle",
  "Gardiner",
  "Harnoncourt",
  "Norrington",
  "Hogwood",
  "Pinnock",
  "Pollini",
  "Argerich",
  "Brendel",
  "Richter",
  "Horowitz",
  "Rubinstein",
  "Schiff",
  "Perahia",
  "Sokolov",
  "Hahn",
  "Mutter",
  "Heifetz",
  "Yo-Yo Ma",
  "Du Pré",
  "du Pre",
  "Rostropovich",
  "Fischer-Dieskau",
  "Pavarotti",
  "Callas",
  "Stile Antico",
  "Hilliard Ensemble",
  "Tallis Scholars",
  "Sequentia",
  "Anonymous 4",
  "Kronos Quartet",
  "Emerson String Quartet",
  "Borodin Quartet",
  "Ensemble Intercontemporain",
  "Cleveland Orchestra",
  "Concertgebouw",
  "Chicago Symphony",
  "New York Philharmonic",
  "London Symphony",
  "Philharmonia",
  "Royal Concertgebouw",
];

// Acceptable iTunes genre buckets — drop pop / 8-bit / lullaby covers etc.
const CLASSICAL_GENRES = new Set([
  "Classical",
  "Classical Crossover",
  "Opera",
  "Vocal",
  "Chamber Music",
  "Choral",
  "Orchestral",
  "Avant-Garde",
  "Early Music",
]);

// Anti-patterns. Tracks whose name or artist matches any of these are
// dropped — they're almost always covers, remixes, or kitsch.
const ANTI_PATTERNS = [
  /\b(8[ -]?bit|chiptune|8-bit)\b/i,
  /\b(remix|tribute|karaoke|cover|disney|music box|lullaby)\b/i,
  /\b(meditation|relaxation|spa|baby|piano lullabies)\b/i,
  /\b(workout|study music|focus music)\b/i,
];

// ---------- Parse COMPOSERS array out of composers.ts ----------

function parseComposers() {
  const src = readFileSync(resolve(ROOT, "src/lib/composers.ts"), "utf8");
  const start = src.indexOf("export const COMPOSERS:");
  const end = src.indexOf("export function getComposerById");
  const body = src.slice(start, end);

  const composers = [];
  const entryRe = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?signatureWorks:\s*\[([\s\S]*?)\][\s\S]*?audioSearchTerms:/g;
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    const id = m[1];
    const name = m[2];
    const worksBlock = m[3];
    // Extract titles from { title: "...", ... } entries.
    const titleRe = /title:\s*"((?:[^"\\]|\\.)*)"/g;
    const titles = [];
    let t;
    while ((t = titleRe.exec(worksBlock)) !== null) {
      titles.push(t[1].replace(/\\"/g, '"'));
    }
    composers.push({ id, name, signatureWorks: titles });
  }
  return composers;
}

// ---------- iTunes Search API helpers ----------

async function searchITunes(query, attempt = 0) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("entity", "song");
  url.searchParams.set("media", "music");
  url.searchParams.set("country", COUNTRY);
  url.searchParams.set("limit", String(SEARCH_LIMIT));
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 429 || res.status === 503) {
      if (attempt >= 3) throw new Error(`rate-limited after retries: ${res.status}`);
      await sleep(4000 * (attempt + 1));
      return searchITunes(query, attempt + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results ?? [];
  } catch (err) {
    if (attempt >= 2) throw err;
    await sleep(1500 * (attempt + 1));
    return searchITunes(query, attempt + 1);
  }
}

function passesFilters(track, composerName) {
  if (!track.previewUrl) return false;
  if (!track.trackName || !track.artistName) return false;

  // Genre must be classical / opera / vocal / chamber / choral / etc.
  if (!CLASSICAL_GENRES.has(track.primaryGenreName)) return false;

  // Reject covers, 8-bit, meditation albums.
  const hay = `${track.trackName} ${track.artistName} ${track.collectionName ?? ""}`;
  for (const pat of ANTI_PATTERNS) {
    if (pat.test(hay)) return false;
  }

  // The artist OR the album OR the track name must mention the composer
  // — otherwise it's probably some other composer's piece named similarly.
  const lastName = composerName.split(/\s+/).pop().toLowerCase();
  const firstName = composerName.split(/\s+/)[0].toLowerCase();
  const fields = [
    track.artistName,
    track.collectionName ?? "",
    track.trackName,
  ]
    .join(" ")
    .toLowerCase();
  if (!fields.includes(lastName) && !fields.includes(firstName)) {
    return false;
  }

  return true;
}

function scoreTrack(track, workTitle) {
  let s = 0;
  // Title overlap: count matching tokens.
  const titleWords = workTitle.toLowerCase().split(/[^a-zà-ž0-9]+/).filter((w) => w.length >= 3);
  const trackWords = track.trackName.toLowerCase();
  for (const w of titleWords) {
    if (trackWords.includes(w)) s += 3;
  }
  // Favored performers.
  for (const a of FAVORED_ARTISTS) {
    if (track.artistName.includes(a)) {
      s += 6;
      break;
    }
  }
  // Avoid extremely short tracks (likely fragments).
  if (track.trackTimeMillis && track.trackTimeMillis > 90_000) s += 1;
  if (track.trackTimeMillis && track.trackTimeMillis > 240_000) s += 1;
  // Prefer Classical genre proper over Crossover.
  if (track.primaryGenreName === "Classical") s += 2;
  return s;
}

async function findAudioForComposer(composer) {
  // Try each signature work in order; also try the composer name alone as
  // a final fallback.
  const queries = [
    ...composer.signatureWorks.map((w) => `${composer.name} ${w}`),
    composer.name,
  ];

  let best = null;
  let bestScore = -Infinity;
  let bestWork = null;

  for (const [idx, query] of queries.entries()) {
    const workTitle =
      idx < composer.signatureWorks.length
        ? composer.signatureWorks[idx]
        : composer.signatureWorks[0] ?? composer.name;
    try {
      console.log(`  ↻ "${query.slice(0, 60)}…"`);
      const results = await searchITunes(query);
      const candidates = results
        .filter((t) => passesFilters(t, composer.name))
        .map((t) => ({ track: t, score: scoreTrack(t, workTitle) }))
        .sort((a, b) => b.score - a.score);
      if (candidates.length === 0) {
        console.log(`    (no candidates passed filters)`);
        await sleep(500);
        continue;
      }
      const top = candidates[0];
      if (top.score > bestScore) {
        best = top.track;
        bestScore = top.score;
        bestWork = workTitle;
        console.log(
          `    ✓ ${top.track.trackName} — ${top.track.artistName} (score ${top.score})`
        );
        // Strong hits stop the search early to spare the API.
        if (top.score >= 12) break;
      }
    } catch (err) {
      console.log(`    ✗ failed: ${err.message}`);
      await sleep(2000);
    }
    await sleep(400);
  }

  if (!best) return null;
  return {
    workTitle: best.trackName,
    workYear: null,
    artistName: best.artistName,
    audioUrl: best.previewUrl,
    sourcePage: best.trackViewUrl ?? null,
    license: "Apple Music preview (30s)",
    durationSeconds: 30,
  };
}

// ---------- Main pipeline ----------

async function main() {
  const composers = parseComposers();
  console.log(`Discovering iTunes previews for ${composers.length} composers…`);

  const outPath = resolve(ROOT, "src/data/audio.json");
  mkdirSync(dirname(outPath), { recursive: true });

  let out = {};
  try {
    const existing = readFileSync(outPath, "utf8");
    const parsed = JSON.parse(existing);
    if (parsed && typeof parsed === "object") {
      out = parsed;
      const resumeCount = Object.keys(out).length;
      if (resumeCount > 0) {
        console.log(`(Resuming — ${resumeCount} composers already cached.)`);
      }
    }
  } catch {
    /* fresh */
  }

  const missing = [];
  for (const c of composers) {
    // Skip if we already have an iTunes-format entry (it has artistName).
    if (
      !process.env.FORCE_REBUILD &&
      out[c.id] &&
      out[c.id].artistName // distinguishes new-format entries from old Commons-only entries
    ) {
      console.log(`\n[${c.id}] ${c.name} — cached, skipping`);
      continue;
    }
    console.log(`\n[${c.id}] ${c.name}`);
    const result = await findAudioForComposer(c);
    if (result) {
      out[c.id] = result;
    } else {
      missing.push(c.id);
      console.log(`  ⚠ no preview found`);
    }
    writeFileSync(outPath, JSON.stringify(out, null, 2));
  }

  console.log(`\n✔ Cached previews for ${Object.keys(out).length} composers`);
  console.log(`  → ${outPath}`);
  if (missing.length > 0) {
    console.log(`\n⚠ Composers without a preview: ${missing.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
