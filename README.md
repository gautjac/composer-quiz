# Cadenza — A Daily Classical Music Quiz

Learn the canon of Western classical music one composer at a time. Modelled on [lit-quiz](https://github.com/gautjac/lit-quiz) and [philosophy-quiz](https://github.com/gautjac/philosophy-quiz).

## Two modes

- **Listen mode** — play a real recording from Wikimedia Commons. Identify the composer and their period.
- **Describe mode** — read a stylistic fingerprint of a composer ("His Adagietto from the Fifth Symphony became famous in Visconti's Death in Venice"). Identify the composer and their period.

Each quiz is 10 questions. The reveal screen shows a bio, the period's description, and 5–7 **signature works** — the educational core. Weighted spaced repetition surfaces composers you've struggled with.

## Coverage

50 composers across 10 periods, from Hildegard von Bingen to Arvo Pärt. Listen mode covers the composers with public-domain recordings on Wikimedia Commons (the historical canon and many 18th–19th c. mainstays); describe mode covers all 50, including still-copyrighted 20th-century figures like Cage, Reich, Glass, and Pärt.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Rebuild the audio cache

The audio cache (`src/data/audio.json`) is checked in. Re-run if you change `COMPOSERS` in `src/lib/composers.ts`:

```bash
npm run build:audio
```

The script queries the Wikimedia Commons MediaWiki API, filters for audio files matching each composer (last-name match required, MIDI rejected, 25 s ≤ duration ≤ 12 min), and picks the best result. Checkpoints after every composer; resumable if interrupted. Set `FORCE_REBUILD=1` to overwrite cached entries.

## Deploy

`netlify.toml` is configured. Connect the repo to Netlify — `npm run build` is the publish command, `.next` the publish dir, and the `@netlify/plugin-nextjs` plugin handles the rest.

## Project structure

```
src/
  app/
    page.tsx                — home (mode picker, progress, period grid)
    quiz/page.tsx           — quiz page (both modes)
    period/[id]/page.tsx    — period browse page
    composer/[id]/page.tsx  — composer page (bio + signature works + period)
  lib/
    composers.ts            — the 50 composers + their signature works
    periods.ts              — the 10 periods
    quiz-engine.ts          — question generation for both modes
    storage.ts              — LocalStorage progress (streak, weights, history)
    audio-cache.ts          — reads pre-discovered audio.json
  components/
    AudioPlayer.tsx         — HTML5 audio player (play / scrub / time)
    ProgressRing.tsx        — circular accuracy ring
    QuizResults.tsx         — end-of-quiz summary
  data/audio.json           — pre-discovered Wikimedia Commons audio URLs
scripts/build-audio.mjs     — Commons MediaWiki API audio discovery script
```
