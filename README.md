# Spinach – Career Archetype Quiz

A short quiz (11 questions) that tells people which blend of two career archetypes fits them best, then lets them share the result or ask for their report.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4 and Motion.

## Run it

```bash
npm install
cp .env.example .env.local   # same values as the archetype app: DATABASE_URL, EMAIL_USER/PASS, ADMIN_EMAIL
npm run dev
```

The quiz uses the archetype app's MySQL database and backend: questions, scoring, PDF reports and saved
submissions are the same, only the UI differs.

Open http://localhost:3000.

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Make a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Check the code with ESLint |
| `npm run check` | Test scoring, result links and saved-answer handling |
| `npm run compress:png` | Shrink PNGs in `public/` without changing a single pixel (`-- <folder>` for one folder) |

## Pages

- `/` – welcome screen
- `/quiz` – the quiz: intro video, questions (`?q=1`), processing, report form and thank-you (`?step=…`)
- `/result/<pair>` – shareable result, e.g. `/result/explorer-and-strategist` (90 pairs, each with its own share image)

## Where things live

- `src/app/api/` – the API, same routes as the archetype app (`/api/quiz/questions`, `/api/quiz/calculate-result`, `/api/user/save-user-data`, …)
- `src/server/services/`, `src/lib/db.js`, `src/lib/mail.js` – the archetype app's backend, copied unchanged
- `src/lib/api.ts` – the browser's calls to that API
- `src/lib/quiz.ts` – archetypes, result pages and copy
- `src/lib/progress.ts` – saved answers and which screen a URL shows
- `src/components/screens/` – one file per screen
- `src/components/ui.tsx` – shared buttons, headers, fields and glass panels
- `public/images/`, `public/videos/` – artwork and the intro video. The site loads these from the `public/` folder of the S3 bucket (`src/lib/assets.ts`), so re-upload a file there after changing it. Keep the local folder too: the favicon, share images and email logo read it directly

## Layout

Each screen is laid out on the Figma frames (390×844 phone, 1440×900 desktop) and scaled to fit the window. Wide, landscape screens of at least 1024px get the desktop layout; everything else, including portrait tablets, gets the phone layout.

## Notes

- Submitting the report form saves the submission and emails the PDF report (plus an admin notification), as the archetype app does.
- "Download Report" saves the PDF through `/api/report/download`, because browsers won't force a download of another site's file; results without a PDF fall back to printing the page.
- Captions for the intro video: add `public/videos/intro.vtt` and a `<track>` for it in `Intro.tsx`.
