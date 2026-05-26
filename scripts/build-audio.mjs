#!/usr/bin/env node
// Discover one Wikimedia Commons audio file per composer and bake into
// src/data/audio.json so the live app doesn't have to do API calls at
// quiz-load time.
//
// Strategy, per composer:
//   1. For each audioSearchTerms entry in order, search Commons file
//      namespace, filter to audio mime types, prefer 30s–10min duration.
//   2. Take the first acceptable hit; record its direct URL, license,
//      duration, and source page.
//   3. Checkpoint after every composer so an interruption doesn't lose work.
//
// Re-run any time COMPOSERS or their audioSearchTerms change. Set
// FORCE_REBUILD=1 to ignore existing cache entries.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const USER_AGENT =
  "CadenzaQuizBuilder/1.0 (https://example.com; contact@example.com)";

const MIN_DURATION = 25; // seconds — anything shorter is probably a fragment
const MAX_DURATION = 720; // 12 min — anything longer is too much for a quiz
const SEARCH_LIMIT = 15;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Parse COMPOSERS array out of composers.ts ----------

function parseComposers() {
  const src = readFileSync(resolve(ROOT, "src/lib/composers.ts"), "utf8");
  const start = src.indexOf("export const COMPOSERS:");
  const end = src.indexOf("export function getComposerById");
  const body = src.slice(start, end);

  const composers = [];
  // Walk { id: "...", name: "...", ... audioSearchTerms: [ ... ] }
  const entryRe = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?audioSearchTerms:\s*\[([\s\S]*?)\][\s\S]*?\},/g;
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    const id = m[1];
    const name = m[2];
    const terms = [...m[3].matchAll(/"([^"]+)"/g)].map((t) => t[1]);
    composers.push({ id, name, audioSearchTerms: terms });
  }
  return composers;
}

// ---------- MediaWiki API helpers ----------

async function api(params, attempt = 0) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 429 || res.status === 503) {
      if (attempt >= 3) throw new Error(`rate-limited after retries: ${res.status}`);
      await sleep(3000 * (attempt + 1));
      return api(params, attempt + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 2) throw err;
    await sleep(1500 * (attempt + 1));
    return api(params, attempt + 1);
  }
}

async function searchFiles(query) {
  const data = await api({
    action: "query",
    list: "search",
    srnamespace: 6, // File namespace
    srsearch: `${query} filetype:audio`,
    srlimit: String(SEARCH_LIMIT),
  });
  return (data?.query?.search ?? []).map((r) => r.title);
}

async function fileInfo(titles) {
  if (titles.length === 0) return [];
  const data = await api({
    action: "query",
    titles: titles.join("|"),
    prop: "imageinfo",
    iiprop: "url|size|mime|metadata|extmetadata",
  });
  const pages = data?.query?.pages ?? {};
  return Object.values(pages)
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const meta = (info.metadata || []).reduce((acc, kv) => {
        acc[kv.name] = kv.value;
        return acc;
      }, {});
      const xmeta = info.extmetadata || {};
      const license =
        xmeta.LicenseShortName?.value ||
        xmeta.License?.value ||
        xmeta.UsageTerms?.value ||
        "unknown";
      const length =
        meta.length !== undefined
          ? Number(meta.length)
          : meta.playtime_seconds !== undefined
            ? Number(meta.playtime_seconds)
            : null;
      return {
        title: p.title,
        url: info.url,
        size: info.size,
        mime: info.mime,
        durationSeconds: Number.isFinite(length) && length > 0 ? length : null,
        license,
        sourcePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
      };
    })
    .filter(Boolean);
}

function passesFilters(file, composerName) {
  // Commons sometimes tags Ogg/Opus audio as application/ogg. Accept those
  // alongside true audio/* types, but only if the file extension is audio.
  if (!file.mime) return false;
  const isAudioMime = file.mime.startsWith("audio/");
  const isOggContainer =
    /^application\/(ogg|opus)/.test(file.mime) &&
    /\.(ogg|oga|opus)$/i.test(file.title);
  if (!isAudioMime && !isOggContainer) return false;
  if (file.durationSeconds !== null) {
    if (file.durationSeconds < MIN_DURATION) return false;
    if (file.durationSeconds > MAX_DURATION) return false;
  }
  // Reject clearly off-topic results (e.g. someone's birthday party named
  // after a composer). Require the composer's last name in the file title.
  const lastName = composerName.split(/\s+/).pop().toLowerCase();
  if (!file.title.toLowerCase().includes(lastName)) return false;
  // Reject spoken-word / language pronunciation files.
  if (/pronounced|pronunciation|inleiding|introduction by|speaking|^File:[A-Za-z]{2}-/i.test(file.title)) {
    return false;
  }
  // Reject MIDI files — they sound terrible. Only accept real recordings.
  if (/\.(mid|midi)$/i.test(file.title)) return false;
  return true;
}

function scoreFile(file, searchTerm) {
  // Prefer longer-but-still-in-bounds files; prefer terms appearing in title.
  let s = 0;
  if (file.durationSeconds) {
    s += Math.min(120, file.durationSeconds) / 10;
  }
  for (const token of searchTerm.split(/\s+/)) {
    if (token.length < 3) continue;
    if (file.title.toLowerCase().includes(token.toLowerCase())) s += 4;
  }
  // Slight preference for ogg / opus / flac over wav (file size; quality).
  if (/\.(ogg|opus|flac)$/i.test(file.title)) s += 1;
  if (/\.wav$/i.test(file.title)) s -= 1;
  return s;
}

function cleanWorkTitle(fileTitle) {
  // "File:Mozart - Symphony No. 40 - I. Molto allegro.ogg" → "Symphony No. 40 - I. Molto allegro"
  return fileTitle
    .replace(/^File:/, "")
    .replace(/\.(ogg|opus|flac|mp3|wav)$/i, "")
    .replace(/^[A-Za-z., ]+ - /, "")
    .replace(/_/g, " ")
    .trim();
}

async function findAudioForComposer(composer) {
  // Append composer's last name as a final fallback — catches anything
  // that the more specific search terms miss.
  const lastName = composer.name.split(/\s+/).pop();
  const terms = [...composer.audioSearchTerms];
  if (!terms.some((t) => t.toLowerCase() === lastName.toLowerCase())) {
    terms.push(lastName);
  }

  for (const term of terms) {
    try {
      console.log(`  ↻ search "${term}"`);
      const titles = await searchFiles(term);
      if (titles.length === 0) {
        console.log(`    (no results)`);
        continue;
      }
      const infos = await fileInfo(titles);
      const good = infos
        .filter((f) => passesFilters(f, composer.name))
        .map((f) => ({ ...f, _score: scoreFile(f, term) }))
        .sort((a, b) => b._score - a._score);

      if (good.length === 0) {
        console.log(`    (none passed filters)`);
        await sleep(400);
        continue;
      }
      const top = good[0];
      console.log(
        `    ✓ ${top.title} (${top.durationSeconds ?? "?"}s, ${top.license})`
      );
      return {
        workTitle: cleanWorkTitle(top.title),
        workYear: null,
        audioUrl: top.url,
        sourcePage: top.sourcePage,
        license: top.license,
        durationSeconds: top.durationSeconds,
      };
    } catch (err) {
      console.log(`    ✗ "${term}" failed: ${err.message}`);
      await sleep(1200);
    }
    await sleep(600);
  }
  return null;
}

// ---------- Main pipeline ----------

async function main() {
  const composers = parseComposers();
  console.log(`Discovering audio for ${composers.length} composers…`);

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
    /* start fresh */
  }

  const missing = [];
  for (const c of composers) {
    if (!process.env.FORCE_REBUILD && out[c.id]) {
      console.log(`\n[${c.id}] ${c.name} — cached, skipping`);
      continue;
    }
    console.log(`\n[${c.id}] ${c.name}`);
    const result = await findAudioForComposer(c);
    if (result) {
      out[c.id] = result;
    } else {
      missing.push(c.id);
      console.log(`  ⚠ no audio found`);
    }
    writeFileSync(outPath, JSON.stringify(out, null, 2));
  }

  console.log(`\n✔ Cached audio for ${Object.keys(out).length} composers`);
  console.log(`  → ${outPath}`);
  if (missing.length > 0) {
    console.log(`\n⚠ Composers without audio: ${missing.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
