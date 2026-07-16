# SATcram

An AI learning operating system for the SAT: bring mistakes from anywhere
(Khan Academy, Bluebook, worksheets, a tutor's homework, a screenshot), get
a structured diagnostic instead of "wrong," and let the app build a
personalized study plan, score prediction, and Socratic tutor from your
actual mistake history.

## Run it

```
npm install
cp .env.example .env   # add your OPENAI_API_KEY
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — homepage at `/`, login at `/login`, app at `/app`.

For production after building:

```
npm run build
OPENAI_API_KEY=sk-... npm start
```

## OpenAI setup

1. Copy `.env.example` to `.env` and add your key from [platform.openai.com](https://platform.openai.com/api-keys).
2. The dev server proxies `POST /api/analyze` to GPT-4o with vision — screenshots are read directly off the image.
3. If the key is missing or the API fails, analysis falls back to the offline mock in `mockAnalysis.js` so the app still works.

## Pages

- **`/`** — marketing homepage (product pitch, how it works, features).
- **`/login`** — login / sign-up screen. Authentication isn't wired up yet
  (see "Adding real login" below) — every path on this screen currently
  leads straight into the app.
- **`/app`** — the app itself, behind the sidebar:
  - **Dashboard** (`src/components/Dashboard`) — accuracy trend, predicted
    SAT score with a confidence range, most frequent mistake patterns,
    topics due for spaced-repetition review, and a confidence-vs-accuracy
    calibration check.
  - **Upload a mistake** (`src/components/Upload`) — drag in a screenshot
    (or click to choose a file, up to 4 images), and/or paste a question,
    your answer, and the correct one; get back a structured diagnostic
    report (question type, correctness, reason, confidence, estimated
    skill, pattern).
  - **Mistake DNA** (`src/components/DNA`) — a scantron-style mastery
    strand per topic, across Math / Reading / Writing.
  - **Study plan** (`src/components/Plan`) — a daily plan generated from
    weak topics, explicitly skipping anything already mastered.
  - **AI tutor** (`src/components/Tutor`) — Socratic mode: asks *why* you
    picked an answer and responds to your reasoning rather than just
    revealing the correct one.
  - **Mistake journal** (`src/components/Journal`) — every mistake,
    searchable, grouped by month, with a status you can cycle (Needs
    review / Fixed / Recurring).

## Swapping in the real AI (OpenAI)

OpenAI is wired up by default via `src/lib/aiClient.js` → `POST /api/analyze`.
The Vite dev server and `npm start` both serve this endpoint. Just add
`OPENAI_API_KEY` to `.env`. If the API is unavailable, the app falls back to
`mockAnalysis.js` automatically.

To force offline-only mode, change the import in `useMistakeStore.js` back to
`mockAnalysis.js`.

## Adding real login

`src/pages/Login.jsx` is a complete front-end for login/sign-up, but
submitting it just navigates into `/app` — there's no backend behind it.
`src/lib/authClient.js` has a `login()` / `signup()` / `logout()` stub with
notes on wiring up real auth (roll your own backend + session cookie, or
drop in Clerk/Auth0/Supabase/Firebase) whenever you're ready.

## Data model

A "mistake" record (see `src/data/sampleMistakes.js` for shape):

```
{
  id, timestamp, source, subject, topic,
  questionText, studentAnswer, correctAnswer,
  images,        // array of data-URL screenshots attached at upload time
  correctness, reason, confidence, estimatedSkill, pattern,
  status // 'Fixed' | 'Needs review' | 'Recurring'
}
```

Mastery per topic is the running average of `estimatedSkill` across every
attempt on that topic — this is what feeds the DNA strand, the score
estimator, and the study plan.
