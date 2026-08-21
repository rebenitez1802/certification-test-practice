# Certification Test Practice

A static practice-test app for certification exams, deployable to GitHub Pages. Ships with an
**ISTQB CTFL v4.0 (Foundation Level)** knowledge base of 160 original practice questions.

- Generate a random practice test from the question bank — either a **full mock exam**
  (40 questions, official chapter distribution, 60-minute timer, 65% pass mark) or a
  **custom practice** run (pick chapters, question count, optional timer).
- Take the test with a question navigator, flag-for-review, and auto-submit when time runs out.
  An in-progress test survives page refreshes.
- Get a score with pass/fail and a per-chapter breakdown, plus a full **answer review** with
  explanations for every question.
- Past attempts are kept in a local history (browser `localStorage` — nothing leaves your machine).

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (test generation + scoring)
npm run validate   # question knowledge-base integrity checks
npm run build      # type-check + production build
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which validates the question bank,
runs the tests, builds the app, and deploys it to GitHub Pages.

One-time setup: in the GitHub repo, go to **Settings → Pages** and set **Source** to
**GitHub Actions**. The site then deploys to
`https://<user>.github.io/certification-test-practice/`.

> If you fork/rename the repo, update `base` in `vite.config.ts` to `'/<repo-name>/'`.

## Adding questions or new certifications

The knowledge base lives in `src/data/`. Each exam is a directory:

```
src/data/<exam-id>/
  exam.json          # name, chapters, mock spec (count, time limit, pass %, distribution)
  chapter-*.json     # arrays of questions
```

Question shape:

```json
{
  "id": "ctfl-1-001",
  "chapter": "1",
  "kLevel": "K2",
  "stem": "…",
  "options": ["…", "…", "…", "…"],
  "correct": [2],
  "explanation": "…"
}
```

Questions with 4 options have exactly 1 correct answer; "Select TWO" questions have 5 options
and exactly 2 correct answers. Run `npm run validate` after editing. A new directory with an
`exam.json` and chapter files appears in the app automatically — no code changes needed.

## Disclaimer

The included questions are original practice material written against the public ISTQB CTFL v4.0
syllabus. They are not official ISTQB exam questions and are not affiliated with or endorsed by
ISTQB.
